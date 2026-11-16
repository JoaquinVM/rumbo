// Rumbo 2's server against a real PostgreSQL (PUB-01, DAT-03 to DAT-06, DAT-09), with Access keys made here. The
// tests of the v1 server (pruebas/servidor.test.mjs), ported to /api/v2 and to documents in cents.
// Use: PG*=… npm run probar-servidor
import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COLECCIONES, type Coleccion } from '@rumbo/contratos';
import { crearVerificador } from './access.js';
import { crearBase, type Base } from './base.js';
import { crearServidor, leerPagina, type Archivo } from './servidor.js';

const EQUIPO = 'prueba', AUD = 'aud-de-rumbo', EMISOR = `https://${EQUIPO}.cloudflareaccess.com`;
const A = 'joaquin@ejemplo.com', B = 'otra@ejemplo.com', FUERA = 'nadie@ejemplo.com';

type Par = { kid: string; privateKey: KeyObject; jwk: object };
function par(kid: string): Par {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { kid, privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
}
const buena = par('k1'), otra = par('k2'), ajena = par('k1'); // `ajena` reuses the kid with another key
let lecturasCerts = 0;
const fetchFalso = async () => {
  lecturasCerts++;
  return { ok: true, status: 200, json: async () => ({ keys: [buena.jwk, otra.jwk] }) };
};

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(claims: Record<string, unknown> = {}, { llave = buena, cab = {} }: { llave?: Par; cab?: object } = {}) {
  const s = Math.floor(Date.now() / 1000);
  const h = b64({ alg: 'RS256', kid: llave.kid, typ: 'JWT', ...cab });
  const p = b64({ iss: EMISOR, aud: [AUD], email: A, iat: s, nbf: s, exp: s + 3600, type: 'app', ...claims });
  const f = createSign('RSA-SHA256').update(`${h}.${p}`).sign(llave.privateKey).toString('base64url');
  return `${h}.${p}.${f}`;
}

const PAGINA = '<!doctype html><html lang="es"><head><title>Rumbo</title></head><body><div id="raiz"></div></body></html>';
const archivos = new Map<string, Archivo>([
  ['/', { tipo: 'text/html; charset=utf-8', cache: 'no-cache', cuerpo: Buffer.from(PAGINA) }],
  ['/assets/index-abc123.js', { tipo: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable', cuerpo: Buffer.from('1') }],
]);

let base: Base, servidor: Server, url: string, pool: pg.Pool;
const escuchar = async (s: Server) => {
  await new Promise<void>((r) => s.listen(0, '127.0.0.1', r));
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
};
beforeAll(async () => {
  pool = new pg.Pool({ max: 2 });
  await pool.query(readFileSync(new URL('../esquema.sql', import.meta.url), 'utf8')); // the v1 tables, to check they stay apart
  base = await crearBase({});
  await base.borrarTodo(A); await base.borrarTodo(B);
  const verificar = crearVerificador({ equipo: EQUIPO, aud: AUD, fetchFn: fetchFalso });
  servidor = crearServidor({ base, verificar, correos: [A, ` ${B.toUpperCase()} `], archivos });
  url = await escuchar(servidor);
});
afterAll(async () => { servidor.close(); await base.cerrar(); await pool.end(); });

const pedir = (ruta: string, { metodo = 'GET', cuerpo, tok = token() }: { metodo?: string; cuerpo?: unknown; tok?: string | null } = {}) =>
  fetch(url + ruta, {
    method: metodo,
    headers: { ...(tok ? { 'Cf-Access-Jwt-Assertion': tok } : {}), ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
const leer = async (tok?: string) => (await pedir('/api/v2/datos', tok ? { tok } : {})).json() as Promise<{ main: unknown; cols: Record<Coleccion, { id: string }[]> }>;
const error = async (r: Response) => ((await r.json()) as { error: string }).error;

const gasto = (id: string, monto = 3500) => ({ id, tipo: 'gasto', fecha: '2026-11-13', monto, cuentaId: 'efectivo', categoriaId: 'comida' });
const aj = { tc: 12.5, tcFecha: null, inflacion: 8, irregular: 0, horas: 160, empezado: true, color: 'rosa' };

describe('PUB-01 solo entra quien Access aprueba', () => {
  it('PUB-01 sin token, firma ajena, otra audiencia, otro emisor, vencido o sin RS256: 401', async () => {
    const s = Math.floor(Date.now() / 1000);
    const malos = [null, 'no-es-un-token', token({}, { llave: ajena }), token({ aud: ['otra-app'] }), token({ aud: 'otra-app' }),
      token({ iss: 'https://otro.cloudflareaccess.com' }), token({ exp: s - 120 }), token({ nbf: s + 600 }),
      token({ email: undefined }), token({}, { cab: { alg: 'none' } }), token({}, { cab: { kid: 'desconocida' } })];
    for (const tok of malos) {
      const r = await pedir('/api/v2/datos', { tok });
      expect(r.status, `token ${tok?.slice(0, 20)}`).toBe(401);
      expect(await error(r)).toBe('sin-sesion');
    }
    for (const metodo of ['PUT', 'DELETE'])
      expect((await pedir('/api/v2/datos', { metodo, cuerpo: { main: null, cols: {} }, tok: null })).status).toBe(401);
    expect((await pedir('/api/v2/docs/movs/m1', { metodo: 'PUT', cuerpo: gasto('m1'), tok: null })).status).toBe(401);
  });

  it('PUB-01 token válido entra; la audiencia puede venir como texto; el correo no aprobado da 403', async () => {
    expect((await pedir('/api/v2/datos')).status).toBe(200);
    expect((await pedir('/api/v2/datos', { tok: token({ aud: AUD }) })).status).toBe(200);
    expect((await pedir('/api/v2/datos', { tok: token({ email: B }) })).status, 'la lista no distingue mayúsculas ni espacios').toBe(200);
    expect((await pedir('/api/v2/datos', { tok: token({}, { llave: otra }) })).status, 'segunda llave del equipo').toBe(200);
    const r = await pedir('/api/v2/datos', { tok: token({ email: FUERA }) });
    expect(r.status).toBe(403);
    expect(await error(r)).toBe('correo-no-permitido');
    const w = await pedir('/api/v2/docs/movs/m9', { metodo: 'PUT', cuerpo: gasto('m9'), tok: token({ email: FUERA }) });
    expect(w.status).toBe(403);
    expect((await pool.query("SELECT 1 FROM v2_docs WHERE id = 'm9'")).rowCount, '403 no escribe nada').toBe(0);
  });

  it('PUB-01 si no se pueden leer las llaves de Access responde 503, no 401', async () => {
    const verificar = crearVerificador({ equipo: EQUIPO, aud: AUD, fetchFn: async () => { throw new Error('sin red'); } });
    const s2 = crearServidor({ base, verificar, correos: [A], archivos });
    const u2 = await escuchar(s2);
    const r = await fetch(`${u2}/api/v2/datos`, { headers: { 'Cf-Access-Jwt-Assertion': token() } });
    s2.close();
    expect(r.status).toBe(503);
    expect(await error(r)).toBe('access-no-responde');
  });

  it('PUB-01 las llaves se leen una vez y no en cada petición', async () => {
    const antes = lecturasCerts;
    for (let i = 0; i < 5; i++) await pedir('/api/v2/datos');
    expect(lecturasCerts).toBe(antes);
  });

  it('PUB-01 sin CORREOS_PERMITIDOS no arranca', () => {
    expect(() => crearServidor({ base, verificar: async () => A, correos: [' ', ''], archivos })).toThrow('CORREOS_PERMITIDOS');
  });
});

describe('DAT-09 el servidor valida con los contratos antes de escribir', () => {
  it('DAT-09 un movimiento con monto 35,5 en lugar de 3550 centavos: 400 y no lo guarda', async () => {
    const r = await pedir('/api/v2/docs/movs/m-decimal', { metodo: 'PUT', cuerpo: { ...gasto('m-decimal'), monto: 35.5 } });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'monto-no-entero', campo: 'monto' });
    expect((await leer()).cols.movs.find((m) => m.id === 'm-decimal')).toBeUndefined();
    expect((await pool.query("SELECT 1 FROM v2_docs WHERE id = 'm-decimal'")).rowCount).toBe(0);
  });

  it('DAT-09 un gasto de Bs 35 sin categoría: 400 falta-categoria y no lo guarda', async () => {
    const { categoriaId: _, ...sin } = gasto('m-sin-cat');
    const r = await pedir('/api/v2/docs/movs/m-sin-cat', { metodo: 'PUT', cuerpo: sin });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'falta-categoria', campo: 'categoriaId' });
    expect((await pool.query("SELECT 1 FROM v2_docs WHERE id = 'm-sin-cat'")).rowCount).toBe(0);
  });

  it('DAT-09 Ajustes con el irregular en decimales: 400 y quedan los de antes', async () => {
    expect((await pedir('/api/v2/ajustes', { metodo: 'PUT', cuerpo: { aj } })).status).toBe(204);
    const r = await pedir('/api/v2/ajustes', { metodo: 'PUT', cuerpo: { aj: { ...aj, irregular: 1500.5 } } });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'monto-no-entero', campo: 'aj.irregular' });
    expect((await leer()).main).toEqual({ aj });
  });

  it('DAT-04 un respaldo con un monto de 3 decimales no reemplaza nada y dice cuál', async () => {
    await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: { main: { aj }, cols: { movs: [gasto('antes')] } } });
    const r = await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: { main: { aj }, cols: { movs: [gasto('m1'), { ...gasto('m2'), monto: 12.555 }] } } });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'monto-no-entero', campo: 'cols.movs.1.monto' });
    expect((await leer()).cols.movs.map((m) => m.id)).toEqual(['antes']);
  });

  it('DAT-05 los campos desconocidos se guardan y vuelven tal cual', async () => {
    const doc = { ...gasto('m-extra'), deOtraVersion: { a: [1, 2.5, 'x'], b: false } };
    expect((await pedir('/api/v2/docs/movs/m-extra', { metodo: 'PUT', cuerpo: doc })).status).toBe(204);
    expect((await leer()).cols.movs.find((m) => m.id === 'm-extra')).toEqual(doc);
    await pedir('/api/v2/docs/movs/m-extra', { metodo: 'DELETE' });
  });
});

describe('Datos de cada persona', () => {
  it('DAT-03 cada correo lee y cambia solo lo suyo', async () => {
    const tA = token(), tB = token({ email: B });
    await pedir('/api/v2/datos', { metodo: 'DELETE', tok: tA });
    expect((await pedir('/api/v2/docs/movs/m1', { metodo: 'PUT', cuerpo: gasto('m1'), tok: tA })).status).toBe(204);
    expect((await pedir('/api/v2/ajustes', { metodo: 'PUT', cuerpo: { aj }, tok: tA })).status).toBe(204);
    const deB = await leer(tB);
    expect(deB.main).toBe(null);
    expect(deB.cols.movs).toEqual([]);
    expect((await pedir('/api/v2/docs/movs/m1', { metodo: 'DELETE', tok: tB })).status).toBe(204);
    expect((await pedir('/api/v2/datos', { metodo: 'DELETE', tok: tB })).status).toBe(204);
    const deA = await leer(tA);
    expect(deA.cols.movs).toEqual([gasto('m1')]);
    expect(deA.main).toEqual({ aj });
  });

  // Every type a saved document can carry, in cents, with every kind of movement
  const respaldo = () => ({
    main: { aj: { ...aj, irregular: 150000 } },
    cols: {
      cuentas: [{ id: 'efectivo', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 65010, desde: '2026-11-01', diaADia: true },
        { id: 'mhw1x2abc', nombre: 'Dólares «ahorro» ñ', moneda: 'USD', saldoInicial: 30, rendimiento: 2.5 }],
      movs: [
        ...Array.from({ length: 300 }, (_, i) => ({ id: `m${i}`, tipo: i % 2 ? 'gasto' : 'ingreso', monto: i * 1337,
          fecha: '2026-11-13', nota: i === 7 ? 'Salteñas 🥟 "dobles"\n2' : '', tc: i % 3 ? null : 12.5, cuentaId: 'efectivo',
          categoriaId: i % 2 ? 'comida' : 'sueldo', extra: { a: [1, 2.5, 'x'], b: false } })),
        { id: 't1', tipo: 'transferencia', fecha: '2026-11-12', monto: 125000, montoDestino: 10000, cuentaId: 'efectivo', cuentaDestinoId: 'mhw1x2abc' },
        { id: 'a1', tipo: 'ajuste', fecha: '2026-11-12', monto: 4500, sentido: -1, cuentaId: 'efectivo', nota: 'Cuadre de cuenta' },
        { id: 'p1', tipo: 'pago', fecha: '2026-11-20', monto: 90000, interes: 21467, capital: 68533, cuentaId: 'efectivo', deudaId: 'd1', fijoId: 'f2', mes: '2026-11' },
        { id: 'i1', tipo: 'interes', fecha: '2026-10-20', monto: 21467, deudaId: 'd1' },
      ],
      fijos: [{ id: 'f1', nombre: 'Sueldo', tipo: 'ingreso', monto: 800000, cuentaId: 'efectivo', categoriaId: 'sueldo', dia: 25, activo: true, desde: '2026-11' },
        { id: 'f2', nombre: 'Cuota', tipo: 'gasto', monto: 90000, cuentaId: 'efectivo', categoriaId: 'intereses', dia: 20, deudaId: 'd1' }],
      ocurrencias: [{ id: 'o1', fijoId: 'f2', mes: '2026-11', estado: 'confirmado', movId: 'p1' }],
      deudas: [{ id: 'd1', tipo: 'prestamo', nombre: 'Banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia: 20 },
        { id: 'd2', tipo: 'teDeben', nombre: 'Mami', moneda: 'BOB', saldoInicial: 125075, fechaEsperada: null }],
      metas: [{ id: 'g1', nombre: 'Viaje', monto: 1500000, mes: '2027-12' }],
      apartados: [{ id: 'ap1', metaId: 'g1', cuentaId: 'efectivo', monto: -5000, fecha: '2026-11-01' }],
      categorias: [{ id: 'comida', nombre: 'Comida', tipo: 'gasto', tope: 80000, base: true }],
    },
  });

  it('DAT-05 ida y vuelta: un respaldo completo vuelve idéntico, campo por campo', async () => {
    const r = respaldo();
    expect((await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: r })).status).toBe(204);
    const leido = await leer();
    expect(leido.main).toEqual(r.main);
    const porId = (l: { id: string }[]) => [...l].sort((x, y) => (x.id < y.id ? -1 : 1));
    for (const c of COLECCIONES) expect(porId(leido.cols[c] ?? []), c).toEqual(porId((r.cols as Record<string, { id: string }[]>)[c] ?? []));
  });

  it('DAT-04 reemplazar es todo o nada: si Postgres rechaza un documento a la mitad, quedan los datos de antes', async () => {
    await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: respaldo() });
    const malo = respaldo();
    malo.main.aj.inflacion = 99;
    malo.cols.movs[150]!.nota = 'texto con \u0000 que jsonb no acepta';
    const r = await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: malo });
    expect(r.status).toBe(500);
    const leido = await leer();
    expect((leido.main as { aj: typeof aj }).aj.inflacion).toBe(8);
    expect(leido.cols.movs).toHaveLength(304);
  });

  it('DAT-06 borrar todo deja a la persona sin empezar', async () => {
    await pedir('/api/v2/datos', { metodo: 'PUT', cuerpo: respaldo() });
    expect((await pedir('/api/v2/datos', { metodo: 'DELETE' })).status).toBe(204);
    const leido = await leer();
    expect(leido.main).toBe(null);
    for (const c of COLECCIONES) expect(leido.cols[c]).toEqual([]);
  });

  it('Guardar un documento lo crea y luego lo reemplaza; borrar lo que no está también responde 204', async () => {
    const meta = { id: 'x1', nombre: 'Viaje', monto: 100, mes: '2027-12' };
    await pedir('/api/v2/docs/metas/x1', { metodo: 'PUT', cuerpo: meta });
    const { id: _, ...sinId } = { ...meta, monto: 200 };
    expect((await pedir('/api/v2/docs/metas/x1', { metodo: 'PUT', cuerpo: sinId })).status).toBe(204);
    expect((await leer()).cols.metas).toEqual([{ ...meta, monto: 200 }]);
    expect((await pedir('/api/v2/docs/metas/x1', { metodo: 'DELETE' })).status).toBe(204);
    expect((await pedir('/api/v2/docs/metas/x1', { metodo: 'DELETE' })).status).toBe(204);
    expect((await leer()).cols.metas).toEqual([]);
  });

  it('Límites: colección, id, forma, tamaño y JSON', async () => {
    const casos: [string, unknown, number, string][] = [
      ['/api/v2/docs/usuarios/x', { id: 'x' }, 400, 'coleccion-desconocida'],
      ['/api/v2/docs/movs/' + 'a'.repeat(101), gasto('a'.repeat(101)), 400, 'id-invalido'],
      ['/api/v2/docs/movs/a%2Fb', {}, 400, 'id-invalido'],
      ['/api/v2/docs/movs/m1', [1, 2], 400, 'documento-invalido'],
      ['/api/v2/docs/movs/m1', gasto('m2'), 400, 'id-distinto'],
      ['/api/v2/docs/movs/m1', '{roto', 400, 'json-invalido'],
      ['/api/v2/docs/movs/m1', { ...gasto('m1'), nota: 'x'.repeat(1024 * 1024) }, 413, 'demasiado-grande'],
      ['/api/v2/ajustes', { aj: null }, 400, 'ajustes-invalidos'],
      ['/api/v2/datos', { main: null, cols: { movs: [gasto('a'), gasto('a')] } }, 400, 'id-repetido'],
      ['/api/v2/datos', { main: null, cols: { otra: [] } }, 400, 'coleccion-desconocida'],
      ['/api/v2/datos', { main: null }, 400, 'respaldo-invalido'],
    ];
    for (const [ruta, cuerpo, estado, codigo] of casos) {
      const r = await pedir(ruta, { metodo: 'PUT', cuerpo });
      expect(r.status, ruta).toBe(estado);
      expect(await error(r), ruta).toBe(codigo);
    }
    expect((await pedir('/api/v2/docs/usuarios/x', { metodo: 'DELETE' })).status).toBe(400);
    expect((await pedir('/api/v2/otra')).status).toBe(404);
  });
});

describe('La v2 vive al lado de la v1', () => {
  it('no responde las rutas de la v1 y no escribe en sus tablas', async () => {
    for (const ruta of ['/api/datos', '/api/ajustes', '/api/docs/movs/m1']) expect((await pedir(ruta)).status, ruta).toBe(404);
    expect((await pedir('/api/docs/movs/m-v1', { metodo: 'PUT', cuerpo: gasto('m-v1') })).status).toBe(404);
    await pedir('/api/v2/docs/movs/m-v2', { metodo: 'PUT', cuerpo: gasto('m-v2') });
    expect((await pool.query("SELECT 1 FROM v2_docs WHERE id = 'm-v2'")).rowCount).toBe(1);
    expect((await pool.query("SELECT 1 FROM docs WHERE id IN ('m-v1', 'm-v2')")).rowCount).toBe(0);
  });

  it('el esquema solo agrega tablas: arrancar dos veces no cambia nada ni borra datos', async () => {
    await pedir('/api/v2/docs/movs/m-queda', { metodo: 'PUT', cuerpo: gasto('m-queda') });
    const otra = await crearBase({});
    await otra.cerrar();
    expect((await leer()).cols.movs.some((m) => m.id === 'm-queda')).toBe(true);
  });
});

describe('Salud y página', () => {
  it('/salud solo responde sano cuando la migración está hecha (una fila en v2_migracion)', async () => {
    await pool.query('DELETE FROM v2_migracion');
    const r = await fetch(url + '/salud');
    expect(r.status).toBe(503);
    expect(await error(r)).toBe('sin-migracion');
    await pool.query(`INSERT INTO v2_migracion (detalle) VALUES ('{"prueba": true}')`);
    const s = await fetch(url + '/salud');
    expect(s.status).toBe(200);
    expect(await s.json()).toEqual({ ok: true });
    await pool.query('DELETE FROM v2_migracion');
  });

  it('La página y sus archivos salen sin token, con cabeceras de seguridad y su caché', async () => {
    const r = await fetch(url + '/');
    expect(r.status).toBe(200);
    expect(await r.text()).toBe(PAGINA);
    expect(r.headers.get('content-security-policy')).toMatch(/frame-ancestors 'none'/);
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    expect(r.headers.get('cache-control')).toBe('no-cache');
    const a = await fetch(url + '/assets/index-abc123.js');
    expect(a.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect((await fetch(url + '/../etc/passwd')).status).toBe(404);
    expect((await fetch(url + '/assets/otro.js')).status).toBe(404);
    expect((await fetch(url + '/', { method: 'POST' })).status).toBe(404);
  });

  it('leerPagina lee la carpeta construida con index.html también en /', () => {
    const dir = new URL('../../pruebas/v1/', import.meta.url);
    expect(() => leerPagina(dir)).not.toThrow();
    const m = leerPagina(dir);
    expect(m.get('/')).toBe(m.get('/index.html'));
    expect(m.get('/index.html')?.cache).toBe('no-cache');
    expect(() => leerPagina(new URL('./', import.meta.url))).toThrow('npm run construir');
  });
});
