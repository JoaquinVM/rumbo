// Server tests (PUB-01, DAT-03, DAT-04, DAT-05) against a real PostgreSQL, with Access keys made here.
// Use: PGHOST=… PGPORT=… PGUSER=… PGPASSWORD=… PGDATABASE=… node --test pruebas/servidor.test.mjs
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, createSign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {crearVerificador} from '../servidor/access.mjs';
import {crearBase, COLS} from '../servidor/base.mjs';
import {crearServidor, armarPagina} from '../servidor/servidor.mjs';

const EQUIPO = 'prueba', AUD = 'aud-de-rumbo', EMISOR = `https://${EQUIPO}.cloudflareaccess.com`;
const A = 'joaquin@ejemplo.com', B = 'otra@ejemplo.com', FUERA = 'nadie@ejemplo.com';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function par(kid) {
  const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
  return {kid, privateKey, jwk: {...publicKey.export({format: 'jwk'}), kid, alg: 'RS256', use: 'sig'}};
}
const buena = par('k1'), otra = par('k2'), ajena = par('k1'); // `ajena` reuses the kid with another key
let certsCaidos = false, lecturasCerts = 0;
const fetchFalso = async () => {
  lecturasCerts++;
  if (certsCaidos) throw new Error('sin red');
  return {ok: true, json: async () => ({keys: [buena.jwk, otra.jwk]})};
};

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(claims = {}, {llave = buena, cab = {}} = {}) {
  const s = Math.floor(Date.now() / 1000);
  const h = b64({alg: 'RS256', kid: llave.kid, typ: 'JWT', ...cab});
  const p = b64({iss: EMISOR, aud: [AUD], email: A, iat: s, nbf: s, exp: s + 3600, type: 'app', ...claims});
  const f = createSign('RSA-SHA256').update(`${h}.${p}`).sign(llave.privateKey).toString('base64url');
  return `${h}.${p}.${f}`;
}

let base, servidor, url;
before(async () => {
  base = await crearBase({});
  await base.reemplazar(A, null, []); await base.reemplazar(B, null, []);
  const verificar = crearVerificador({equipo: EQUIPO, aud: AUD, fetchFn: fetchFalso});
  servidor = crearServidor({base, verificar, correos: [A, ` ${B.toUpperCase()} `], pagina: armarPagina(html)});
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => { servidor.close(); await base.cerrar(); });

const pedir = (ruta, {metodo = 'GET', cuerpo, tok = token()} = {}) => fetch(url + ruta, {
  method: metodo,
  headers: {...(tok ? {'Cf-Access-Jwt-Assertion': tok} : {}), ...(cuerpo !== undefined ? {'Content-Type': 'application/json'} : {})},
  body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
});
const leer = async tok => (await pedir('/api/datos', {tok})).json();
const error = async r => (await r.json()).error;

test('PUB-01 sin token, firma ajena, otra audiencia, otro emisor, vencido o sin RS256: 401', async () => {
  const s = Math.floor(Date.now() / 1000);
  const malos = [null, 'no-es-un-token', token({}, {llave: ajena}), token({aud: ['otra-app']}), token({aud: 'otra-app'}),
    token({iss: 'https://otro.cloudflareaccess.com'}), token({exp: s - 120}), token({nbf: s + 600}),
    token({email: undefined}), token({}, {cab: {alg: 'none'}}), token({}, {cab: {kid: 'desconocida'}})];
  for (const tok of malos) {
    const r = await pedir('/api/datos', {tok});
    assert.equal(r.status, 401, `token ${tok && tok.slice(0, 20)}`);
    assert.equal(await error(r), 'sin-sesion');
  }
  for (const metodo of ['PUT', 'DELETE']) assert.equal((await pedir('/api/datos', {metodo, cuerpo: {main: null, cols: {}}, tok: null})).status, 401);
});

test('PUB-01 token válido entra; la audiencia puede venir como texto; el correo no aprobado da 403', async () => {
  assert.equal((await pedir('/api/datos')).status, 200);
  assert.equal((await pedir('/api/datos', {tok: token({aud: AUD})})).status, 200);
  assert.equal((await pedir('/api/datos', {tok: token({email: B})})).status, 200, 'la lista no distingue mayúsculas ni espacios');
  assert.equal((await pedir('/api/datos', {tok: token({}, {llave: otra})})).status, 200, 'segunda llave del equipo');
  const r = await pedir('/api/datos', {tok: token({email: FUERA})});
  assert.equal(r.status, 403);
  assert.equal(await error(r), 'correo-no-permitido');
});

test('PUB-01 si no se pueden leer las llaves de Access responde 503, no 401', async () => {
  const verificar = crearVerificador({equipo: EQUIPO, aud: AUD, fetchFn: async () => { throw new Error('sin red'); }});
  const s2 = crearServidor({base, verificar, correos: [A], pagina: ''});
  await new Promise(r => s2.listen(0, '127.0.0.1', r));
  const r = await fetch(`http://127.0.0.1:${s2.address().port}/api/datos`, {headers: {'Cf-Access-Jwt-Assertion': token()}});
  s2.close();
  assert.equal(r.status, 503);
  assert.equal(await error(r), 'access-no-responde');
});

test('PUB-01 las llaves se leen una vez y no en cada petición', async () => {
  const antes = lecturasCerts;
  for (let i = 0; i < 5; i++) await pedir('/api/datos');
  assert.equal(lecturasCerts, antes);
});

test('DAT-03 cada correo lee y cambia solo lo suyo', async () => {
  const tA = token(), tB = token({email: B});
  assert.equal((await pedir('/api/docs/movs/m1', {metodo: 'PUT', cuerpo: {id: 'm1', tipo: 'gasto', monto: 35}, tok: tA})).status, 204);
  assert.equal((await pedir('/api/ajustes', {metodo: 'PUT', cuerpo: {aj: {empezado: true, tc: 12.5}}, tok: tA})).status, 204);
  const deB = await leer(tB);
  assert.equal(deB.main, null);
  assert.deepEqual(deB.cols.movs, []);
  assert.equal((await pedir('/api/docs/movs/m1', {metodo: 'DELETE', tok: tB})).status, 204);
  assert.equal((await pedir('/api/datos', {metodo: 'DELETE', tok: tB})).status, 204);
  const deA = await leer(tA);
  assert.deepEqual(deA.cols.movs, [{id: 'm1', tipo: 'gasto', monto: 35}]);
  assert.deepEqual(deA.main, {aj: {empezado: true, tc: 12.5}});
});

// Every type a saved document can carry, including decimals that are not exact in binary
const respaldo = () => ({
  main: {aj: {tc: 12.5, tcFecha: null, inflacion: 8, irregular: 0, horas: 160, empezado: true, color: 'rosa'}},
  cols: {
    cuentas: [{id: 'efectivo', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 650.1, apertura: '2026-11-01'},
      {id: 'mhw1x2abc', nombre: 'Dólares «ahorro» ñ', moneda: 'USD', saldoInicial: 0.30000000000000004}],
    movs: Array.from({length: 300}, (_, i) => ({id: `m${i}`, tipo: i % 2 ? 'gasto' : 'ingreso', monto: Math.round(i * 13.37 * 100) / 100,
      fecha: '2026-11-13', nota: i === 7 ? 'Salteñas 🥟 "dobles"\n2' : '', tc: i % 3 ? null : 12.5, cuentaId: 'efectivo', extra: {a: [1, 2.5, 'x'], b: false}})),
    fijos: [{id: 'f1', nombre: 'Sueldo', tipo: 'ingreso', monto: 8000, dia: 25, activo: true, desde: '2026-11'}],
    ocurrencias: [], deudas: [{id: 'd1', nombre: 'Mami', saldo: -1250.75}], metas: [], apartados: [], categorias: [],
  },
});

test('DAT-05 ida y vuelta: un respaldo completo vuelve idéntico, campo por campo', async () => {
  const r = respaldo();
  assert.equal((await pedir('/api/datos', {metodo: 'PUT', cuerpo: r})).status, 204);
  const leido = await leer();
  assert.deepEqual(leido.main, r.main);
  for (const c of COLS) {
    const porId = l => [...l].sort((x, y) => x.id < y.id ? -1 : 1);
    assert.deepEqual(porId(leido.cols[c]), porId(r.cols[c] || []), c);
  }
});

test('DAT-04 reemplazar es todo o nada: si Postgres rechaza un documento a la mitad, quedan los datos de antes', async () => {
  const bueno = respaldo();
  await pedir('/api/datos', {metodo: 'PUT', cuerpo: bueno});
  const malo = respaldo();
  malo.main.aj.inflacion = 99;
  malo.cols.movs[150].nota = 'texto con \u0000 que jsonb no acepta';
  const r = await pedir('/api/datos', {metodo: 'PUT', cuerpo: malo});
  assert.equal(r.status, 500);
  const leido = await leer();
  assert.equal(leido.main.aj.inflacion, 8);
  assert.equal(leido.cols.movs.length, 300);
});

test('DAT-06 borrar todo deja a la persona sin empezar', async () => {
  await pedir('/api/datos', {metodo: 'PUT', cuerpo: respaldo()});
  assert.equal((await pedir('/api/datos', {metodo: 'DELETE'})).status, 204);
  const leido = await leer();
  assert.equal(leido.main, null);
  for (const c of COLS) assert.deepEqual(leido.cols[c], []);
});

test('Guardar un documento lo crea y luego lo reemplaza; borrar lo que no está también responde 204', async () => {
  await pedir('/api/docs/metas/x1', {metodo: 'PUT', cuerpo: {id: 'x1', monto: 1}});
  await pedir('/api/docs/metas/x1', {metodo: 'PUT', cuerpo: {monto: 2, nombre: 'Viaje'}});
  assert.deepEqual((await leer()).cols.metas, [{id: 'x1', monto: 2, nombre: 'Viaje'}]);
  assert.equal((await pedir('/api/docs/metas/x1', {metodo: 'DELETE'})).status, 204);
  assert.equal((await pedir('/api/docs/metas/x1', {metodo: 'DELETE'})).status, 204);
  assert.deepEqual((await leer()).cols.metas, []);
});

test('Límites: colección, id, forma, tamaño y JSON', async () => {
  const casos = [
    ['/api/docs/usuarios/x', {id: 'x'}, 400, 'coleccion-desconocida'],
    ['/api/docs/movs/' + 'a'.repeat(101), {}, 400, 'id-invalido'],
    ['/api/docs/movs/a%2Fb', {}, 400, 'id-invalido'],
    ['/api/docs/movs/m1', [1, 2], 400, 'documento-invalido'],
    ['/api/docs/movs/m1', {id: 'm2'}, 400, 'id-distinto'],
    ['/api/docs/movs/m1', '{roto', 400, 'json-invalido'],
    ['/api/docs/movs/m1', {id: 'm1', nota: 'x'.repeat(1024 * 1024)}, 413, 'demasiado-grande'],
    ['/api/ajustes', {aj: null}, 400, 'ajustes-invalidos'],
    ['/api/datos', {main: null, cols: {movs: [{id: 'a'}, {id: 'a'}]}}, 400, 'id-repetido'],
    ['/api/datos', {main: null, cols: {otra: []}}, 400, 'coleccion-desconocida'],
    ['/api/datos', {main: null}, 400, 'respaldo-invalido'],
  ];
  for (const [ruta, cuerpo, estado, codigo] of casos) {
    const r = await pedir(ruta, {metodo: 'PUT', cuerpo});
    assert.equal(r.status, estado, ruta);
    assert.equal(await error(r), codigo, ruta);
  }
  assert.equal((await pedir('/api/otra')).status, 404);
});

test('La página sale con su esqueleto, la marca de la API y cabeceras de seguridad, sin token', async () => {
  const r = await fetch(url + '/');
  assert.equal(r.status, 200);
  const texto = await r.text();
  assert.ok(texto.startsWith('<!doctype html>'));
  assert.ok(texto.includes('<meta name="rumbo-api" content="/api">'));
  assert.ok(texto.includes('iniciarStore();'));
  assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(url + '/salud')).status, 200);
  assert.equal((await fetch(url + '/../etc/passwd')).status, 404);
});

test('Las colecciones del servidor son las mismas de la página', () => {
  const m = html.match(/const COLS = \[([^\]]+)\]/);
  assert.deepEqual(COLS, m[1].split(',').map(s => s.trim().replace(/'/g, '')));
});
