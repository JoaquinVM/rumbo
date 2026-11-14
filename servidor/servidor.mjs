// Rumbo's server (PUB-01, DAT-03): serves index.html and the save API, only to people Cloudflare Access let in.
// Run: node servidor/servidor.mjs, configured by environment (deploy/.env.example).
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {crearVerificador} from './access.mjs';
import {crearBase, COLS} from './base.mjs';

const MB = 1024 * 1024;
const LIMITE_DOC = 1 * MB;
const LIMITE_TODO = 25 * MB;
const ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const RUTA_DOC = /^\/api\/docs\/([a-z]+)\/([^/]+)$/;

// index.html has no document skeleton (the artifact adds its own): this one adds it, and the meta tells the page to
// save through /api instead of the artifact or the browser
export function armarPagina(html) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    '<meta name="rumbo-api" content="/api"><link rel="icon" href="data:,">\n' + html + '\n</html>\n';
}

const SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' " +
    "https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; " +
    "frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

class Fallo extends Error {
  constructor(estado, codigo) { super(codigo); this.estado = estado; this.codigo = codigo; }
}

function leerCuerpo(req, limite) {
  return new Promise((resolve, reject) => {
    const partes = []; let total = 0, cortado = false;
    req.on('data', c => {
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

const esObjeto = o => o !== null && typeof o === 'object' && !Array.isArray(o);

function validarDoc(col, id, datos) {
  if (!COLS.includes(col)) throw new Fallo(400, 'coleccion-desconocida');
  if (typeof id !== 'string' || !ID.test(id)) throw new Fallo(400, 'id-invalido');
  if (!esObjeto(datos)) throw new Fallo(400, 'documento-invalido');
  if (datos.id !== undefined && datos.id !== id) throw new Fallo(400, 'id-distinto');
}

function validarPrincipal(main) {
  if (!esObjeto(main) || !esObjeto(main.aj)) throw new Fallo(400, 'ajustes-invalidos');
}

// Body of PUT /api/datos: {main: {aj} | null, cols: {<col>: [doc, ...]}} → rows for the transaction
function filasDe(cuerpo) {
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.cols)) throw new Fallo(400, 'respaldo-invalido');
  if (cuerpo.main !== null) validarPrincipal(cuerpo.main);
  const filas = [];
  for (const [col, lista] of Object.entries(cuerpo.cols)) {
    if (!COLS.includes(col)) throw new Fallo(400, 'coleccion-desconocida');
    if (!Array.isArray(lista)) throw new Fallo(400, 'respaldo-invalido');
    const vistos = new Set();
    for (const d of lista) {
      validarDoc(col, d && d.id, d);
      if (vistos.has(d.id)) throw new Fallo(400, 'id-repetido');
      vistos.add(d.id);
      filas.push({col, id: d.id, datos: d});
    }
  }
  return filas;
}

export function crearServidor({base, verificar, correos, pagina}) {
  const permitidos = new Set(correos.map(c => c.trim().toLowerCase()).filter(Boolean));
  if (!permitidos.size) throw new Error('CORREOS_PERMITIDOS está vacío');

  const responder = (res, estado, cuerpo) => {
    const texto = cuerpo === undefined ? '' : JSON.stringify(cuerpo);
    res.writeHead(estado, {...SEGURIDAD, 'Cache-Control': 'no-store',
      ...(texto ? {'Content-Type': 'application/json; charset=utf-8'} : {})});
    res.end(texto);
  };

  async function api(req, res, ruta) {
    let persona;
    try { persona = await verificar(req.headers['cf-access-jwt-assertion']); }
    catch (e) { console.error('Access:', e.message); throw new Fallo(503, 'access-no-responde'); }
    if (!persona) throw new Fallo(401, 'sin-sesion');
    if (!permitidos.has(persona)) throw new Fallo(403, 'correo-no-permitido');

    const m = ruta.match(RUTA_DOC);
    if (m) {
      const [, col, id] = m;
      if (req.method === 'PUT') {
        const datos = await leerCuerpo(req, LIMITE_DOC);
        validarDoc(col, id, datos);
        await base.guardarDoc(persona, col, id, datos);
        return responder(res, 204);
      }
      if (req.method === 'DELETE') {
        validarDoc(col, id, {});
        await base.borrarDoc(persona, col, id); // deleting what is not there is fine: retries repeat it
        return responder(res, 204);
      }
    } else if (ruta === '/api/ajustes' && req.method === 'PUT') {
      const main = await leerCuerpo(req, LIMITE_DOC);
      validarPrincipal(main);
      await base.guardarPrincipal(persona, main);
      return responder(res, 204);
    } else if (ruta === '/api/datos') {
      if (req.method === 'GET') return responder(res, 200, await base.leer(persona));
      if (req.method === 'PUT') {
        const cuerpo = await leerCuerpo(req, LIMITE_TODO);
        const filas = filasDe(cuerpo);
        await base.reemplazar(persona, cuerpo.main, filas);
        return responder(res, 204);
      }
      if (req.method === 'DELETE') { await base.borrarTodo(persona); return responder(res, 204); }
    }
    throw new Fallo(404, 'no-existe');
  }

  return http.createServer(async (req, res) => {
    const ruta = new URL(req.url, 'http://rumbo').pathname;
    try {
      if (ruta.startsWith('/api/')) return await api(req, res, ruta);
      if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
        res.writeHead(200, {...SEGURIDAD, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache'});
        return res.end(pagina);
      }
      if (req.method === 'GET' && ruta === '/salud') {
        await base.salud();
        return responder(res, 200, {ok: true});
      }
      throw new Fallo(404, 'no-existe');
    } catch (e) {
      if (e instanceof Fallo) return responder(res, e.estado, {error: e.codigo});
      console.error(`${req.method} ${ruta}:`, e.message);
      return responder(res, 500, {error: 'error-del-servidor'});
    }
  });
}

async function iniciar() {
  const falta = ['ACCESS_TEAM', 'ACCESS_AUD', 'CORREOS_PERMITIDOS', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE']
    .filter(n => !process.env[n]);
  if (falta.length) { console.error('Faltan variables:', falta.join(', ')); process.exit(1); }
  const base = await crearBase({});
  const verificar = crearVerificador({equipo: process.env.ACCESS_TEAM, aud: process.env.ACCESS_AUD});
  const pagina = armarPagina(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
  const servidor = crearServidor({base, verificar, correos: process.env.CORREOS_PERMITIDOS.split(','), pagina});
  const puerto = Number(process.env.PORT || 8080);
  servidor.listen(puerto, () => console.log(`Rumbo escucha en el puerto ${puerto}`));
  const parar = () => servidor.close(() => base.cerrar().finally(() => process.exit(0)));
  process.on('SIGTERM', parar);
  process.on('SIGINT', parar);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) iniciar().catch(e => { console.error(e); process.exit(1); });
