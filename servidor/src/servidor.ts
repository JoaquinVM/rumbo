// Rumbo 2's server (PUB-01, DAT-03, DAT-09): the built page and the save API under /api/v2, only to people Cloudflare
// Access let in. Every write is checked with the shared contracts before it reaches the database; a document that does
// not pass gets 400 with its code and nothing is written. It does not answer the v1 routes (/api/datos…).
import http from 'node:http';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RAIZ_API, validarDatos, validarDocumentoDeRuta, validarPrincipal, ID, COLECCIONES,
  type CodigoError, type Validado,
} from '@rumbo/contratos';
import type { Verificador } from './access.js';
import type { Base } from './base.js';

const MB = 1024 * 1024;
const LIMITE_DOC = 1 * MB;
const LIMITE_TODO = 25 * MB;
const RUTA_DOC = new RegExp(`^${RAIZ_API}/docs/([a-z]+)/([^/]+)$`);

// The same headers as the v1 page.
const SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
    "font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; " +
    "frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

export type Archivo = { tipo: string; cache: string; cuerpo: Buffer };

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// The built page (app/dist), read once at start: path → type, cache and body. index.html goes at / too. Files under
// /assets/ carry a hash in their name, so they are cached for a year; the rest is checked again on every visit.
export function leerPagina(dir: URL | string): Map<string, Archivo> {
  const raiz = typeof dir === 'string' ? dir : fileURLToPath(dir);
  const archivos = new Map<string, Archivo>();
  const recorrer = (d: string): void => {
    for (const nombre of readdirSync(d)) {
      const ruta = join(d, nombre);
      if (statSync(ruta).isDirectory()) { recorrer(ruta); continue; }
      const tipo = TIPOS[extname(nombre)];
      if (!tipo) continue;
      const web = '/' + relative(raiz, ruta).split(sep).join('/');
      const cache = web.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
      archivos.set(web, { tipo, cache, cuerpo: readFileSync(ruta) });
    }
  };
  recorrer(raiz);
  const inicio = archivos.get('/index.html');
  if (!inicio) throw new Error(`No está la página construida en ${raiz} (npm run construir)`);
  archivos.set('/', inicio);
  return archivos;
}

class Fallo extends Error {
  constructor(readonly estado: number, readonly codigo: CodigoError, readonly campo?: string) { super(codigo); }
}

function leerCuerpo(req: http.IncomingMessage, limite: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = [];
    let total = 0, cortado = false;
    req.on('data', (c: Buffer) => {
      if (cortado) return;
      total += c.length;
      if (total > limite) { cortado = true; reject(new Fallo(413, 'demasiado-grande')); req.resume(); return; }
      partes.push(c);
    });
    req.on('end', () => {
      if (cortado) return;
      try { resolve(JSON.parse(Buffer.concat(partes).toString('utf8'))); }
      catch { reject(new Fallo(400, 'json-invalido')); }
    });
    req.on('error', reject);
  });
}

// A contract that said no is a 400 with its code and the field, and nothing is written.
function exigir<T>(v: Validado<T>): T {
  if (!v.ok) throw new Fallo(400, v.codigo, v.campo);
  return v.datos;
}

export function crearServidor({ base, verificar, correos, archivos }: {
  base: Base;
  verificar: Verificador;
  correos: string[];
  archivos: Map<string, Archivo>;
}): http.Server {
  const permitidos = new Set(correos.map((c) => c.trim().toLowerCase()).filter(Boolean));
  if (!permitidos.size) throw new Error('CORREOS_PERMITIDOS está vacío');

  const responder = (res: http.ServerResponse, estado: number, cuerpo?: unknown) => {
    const texto = cuerpo === undefined ? '' : JSON.stringify(cuerpo);
    res.writeHead(estado, { ...SEGURIDAD, 'Cache-Control': 'no-store',
      ...(texto ? { 'Content-Type': 'application/json; charset=utf-8' } : {}) });
    res.end(texto);
  };

  async function api(req: http.IncomingMessage, res: http.ServerResponse, ruta: string): Promise<void> {
    let persona: string | null;
    try { persona = await verificar(req.headers['cf-access-jwt-assertion']); }
    catch (e) { console.error('Access:', (e as Error).message); throw new Fallo(503, 'access-no-responde'); }
    if (!persona) throw new Fallo(401, 'sin-sesion');
    if (!permitidos.has(persona)) throw new Fallo(403, 'correo-no-permitido');

    const m = ruta.match(RUTA_DOC);
    if (m) {
      const [, col = '', id = ''] = m;
      if (req.method === 'PUT') {
        const cuerpo = await leerCuerpo(req, LIMITE_DOC);
        exigir(validarDocumentoDeRuta(col, id, cuerpo));
        await base.guardarDoc(persona, col, id, cuerpo as object); // as it came: unknown fields stay (DAT-05)
        return responder(res, 204);
      }
      if (req.method === 'DELETE') {
        if (!(COLECCIONES as readonly string[]).includes(col)) throw new Fallo(400, 'coleccion-desconocida');
        if (!ID.test(id)) throw new Fallo(400, 'id-invalido');
        await base.borrarDoc(persona, col, id); // deleting what is not there is fine: retries repeat it
        return responder(res, 204);
      }
    } else if (ruta === `${RAIZ_API}/ajustes` && req.method === 'PUT') {
      const main = exigir(validarPrincipal(await leerCuerpo(req, LIMITE_DOC)));
      await base.guardarPrincipal(persona, main);
      return responder(res, 204);
    } else if (ruta === `${RAIZ_API}/datos`) {
      if (req.method === 'GET') return responder(res, 200, await base.leer(persona));
      if (req.method === 'PUT') {
        const { main, filas } = exigir(validarDatos(await leerCuerpo(req, LIMITE_TODO)));
        await base.reemplazar(persona, main, filas);
        return responder(res, 204);
      }
      if (req.method === 'DELETE') { await base.borrarTodo(persona); return responder(res, 204); }
    }
    throw new Fallo(404, 'no-existe');
  }

  return http.createServer(async (req, res) => {
    const ruta = new URL(req.url ?? '/', 'http://rumbo').pathname;
    try {
      if (ruta.startsWith('/api/')) return await api(req, res, ruta);
      const archivo = req.method === 'GET' ? archivos.get(ruta) : undefined;
      if (archivo) {
        res.writeHead(200, { ...SEGURIDAD, 'Content-Type': archivo.tipo, 'Cache-Control': archivo.cache });
        return res.end(archivo.cuerpo);
      }
      // Healthy only when the v1 data was migrated and verified (design.md): otherwise a deploy of the v2 does not
      // become healthy and goes back to the v1 on its own (PUB-05).
      if (req.method === 'GET' && ruta === '/salud') {
        if (!(await base.migracionHecha())) throw new Fallo(503, 'sin-migracion');
        return responder(res, 200, { ok: true });
      }
      throw new Fallo(404, 'no-existe');
    } catch (e) {
      if (e instanceof Fallo) return responder(res, e.estado, e.campo ? { error: e.codigo, campo: e.campo } : { error: e.codigo });
      console.error(`${req.method} ${ruta}:`, (e as Error).message);
      return responder(res, 500, { error: 'error-del-servidor' });
    }
  });
}
