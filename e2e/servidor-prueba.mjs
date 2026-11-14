// TEST-ONLY entry point (never in the image: deploy/Dockerfile copies servidor/*.mjs only). It runs Rumbo's server
// with its real PostgreSQL base (PG* variables) and a FAKE Cloudflare Access that lets in only the request carrying
// TOKEN, and serves the built v2 page (app/dist) with its assets, gzipped like Cloudflare does in production.
// Use: npm run construir && PG*=… node e2e/servidor-prueba.mjs
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {crearServidor} from '../servidor/servidor.mjs';
import {crearBase} from '../servidor/base.mjs';

export const TOKEN = 'token-de-prueba-e2e';
export const CORREO = 'e2e@rumbo.test';
const PUERTO = Number(process.env.PORT || 4173);
const DIST = new URL('../app/dist/', import.meta.url);
const TIPOS = {js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml',
  png: 'image/png', woff2: 'font/woff2', webmanifest: 'application/manifest+json'};
const ARCHIVO = /^\/assets\/[A-Za-z0-9_.-]+\.([a-z0-9]+)$/;

const base = await crearBase({});
const verificar = async token => (token === TOKEN ? CORREO : null);
const pagina = readFileSync(new URL('index.html', DIST), 'utf8');
const rumbo = crearServidor({base, verificar, correos: [CORREO], pagina});
const atenderRumbo = rumbo.listeners('request')[0];

function enviar(req, res, ruta, tipo) {
  let cuerpo;
  try { cuerpo = readFileSync(new URL('.' + ruta, DIST)); }
  catch { res.writeHead(404); return res.end(); }
  const cabeceras = {'Content-Type': tipo, 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'public, max-age=31536000, immutable'};
  if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    cuerpo = gzipSync(cuerpo);
    cabeceras['Content-Encoding'] = 'gzip';
  }
  res.writeHead(200, cabeceras);
  res.end(cuerpo);
}

const servidor = http.createServer((req, res) => {
  const ruta = new URL(req.url, 'http://rumbo').pathname;
  const m = req.method === 'GET' && ruta.match(ARCHIVO);
  if (m && TIPOS[m[1]]) return enviar(req, res, ruta, TIPOS[m[1]]);
  return atenderRumbo(req, res);
});
servidor.listen(PUERTO, () => console.log(`Rumbo de prueba escucha en http://localhost:${PUERTO}`));
const parar = () => servidor.close(() => base.cerrar().finally(() => process.exit(0)));
process.on('SIGTERM', parar);
process.on('SIGINT', parar);
