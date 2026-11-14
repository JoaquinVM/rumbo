// Ensayo en el navegador del guardado en el servidor (DAT-07), solo para desarrollo: el servidor real con una base
// real, pero con un «Access» de mentira que deja entrar a ensayo@rumbo y que se puede vencer a mano.
//   PGHOST=… PGPORT=… PGUSER=… PGPASSWORD=… PGDATABASE=… node pruebas/ensayo-servidor.mjs [puerto]
//   GET /__ensayo/sesion?vencida=1|0   vence o renueva la sesión
//   GET /__ensayo/caido?s=<segundos>   responde 503 a la API durante esos segundos (sin señal)
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {crearBase} from '../servidor/base.mjs';
import {crearServidor, armarPagina} from '../servidor/servidor.mjs';

const CORREO = 'ensayo@rumbo';
let vencida = false, caidoHasta = 0;
const base = await crearBase({});
const pagina = armarPagina(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
const real = crearServidor({base, verificar: async () => vencida ? null : CORREO, correos: [CORREO], pagina});

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://ensayo');
  if (u.pathname === '/__ensayo/sesion') { vencida = u.searchParams.get('vencida') === '1'; return res.end(`vencida=${vencida}`); }
  if (u.pathname === '/__ensayo/caido') { caidoHasta = Date.now() + 1000 * Number(u.searchParams.get('s') || 10); return res.end('caído'); }
  if (u.pathname.startsWith('/api/') && Date.now() < caidoHasta) { res.writeHead(503); return res.end(); }
  console.log(req.method, u.pathname);
  real.emit('request', req, res);
}).listen(Number(process.argv[2] || 8090), '127.0.0.1', () => console.log('Ensayo en http://127.0.0.1:' + (process.argv[2] || 8090)));
