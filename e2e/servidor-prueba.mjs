// TEST-ONLY entry point (never in the image: deploy/Dockerfile.v2.dockerignore leaves e2e/ out, and
// pruebas/imagen-v2.sh checks it). It runs Rumbo 2's server (servidor/dist, built with `npm run construir-servidor`)
// with its real PostgreSQL base (PG* variables) and a FAKE Cloudflare Access: the token TOKEN is e2e@rumbo.test, and
// TOKEN-<n> is e2e-<n>@rumbo.test, so each test has its own person. It serves the built page (app/dist), its assets
// gzipped like Cloudflare does in production, and marks the base as migrated so /salud answers.
// Use: npm run construir && npm run construir-servidor && PG*=… node --conditions=rumbo-compilado e2e/servidor-prueba.mjs
import http from 'node:http';
import {gzipSync} from 'node:zlib';
import pg from 'pg';
import {crearServidor, leerPagina} from '../servidor/dist/servidor.js';
import {crearBase} from '../servidor/dist/base.js';

export const TOKEN = 'token-de-prueba-e2e';
export const PERSONAS = 100000;
const PUERTO = Number(process.env.PORT || 4173);

// Lighthouse cannot send a header only to this server (it would go to Google Fonts too): with E2E_ACCESS_ABIERTO=1 a
// request without token is e2e@rumbo.test. Only the Lighthouse run uses it.
const abierto = process.env.E2E_ACCESS_ABIERTO === '1';
const correoDe = token => {
  if (token === TOKEN || (abierto && !token)) return 'e2e@rumbo.test';
  const n = typeof token === 'string' && token.startsWith(`${TOKEN}-`) ? token.slice(TOKEN.length + 1) : '';
  return /^\d+$/.test(n) && Number(n) < PERSONAS ? `e2e-${n}@rumbo.test` : null;
};
const correos = ['e2e@rumbo.test', ...Array.from({length: PERSONAS}, (_, n) => `e2e-${n}@rumbo.test`)];

const base = await crearBase({});
const pool = new pg.Pool({max: 1});
await pool.query(`INSERT INTO v2_migracion (detalle) SELECT '{"e2e": true}' WHERE NOT EXISTS (SELECT 1 FROM v2_migracion)`);
await pool.end();

const archivos = leerPagina(new URL('../app/dist/', import.meta.url));
const rumbo = crearServidor({base, verificar: async token => correoDe(token), correos, archivos});
const atenderRumbo = rumbo.listeners('request')[0];

const servidor = http.createServer((req, res) => {
  const ruta = new URL(req.url, 'http://rumbo').pathname;
  const archivo = req.method === 'GET' && ruta.startsWith('/assets/') ? archivos.get(ruta) : undefined;
  if (archivo && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, {'Content-Type': archivo.tipo, 'Cache-Control': archivo.cache, 'Content-Encoding': 'gzip',
      'X-Content-Type-Options': 'nosniff'});
    return res.end(gzipSync(archivo.cuerpo));
  }
  return atenderRumbo(req, res);
});
servidor.listen(PUERTO, () => console.log(`Rumbo de prueba escucha en http://localhost:${PUERTO}`));
const parar = () => servidor.close(() => base.cerrar().finally(() => process.exit(0)));
process.on('SIGTERM', parar);
process.on('SIGINT', parar);
