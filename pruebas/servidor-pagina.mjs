// Prueba el guardado de la página contra el servidor de Rumbo (DAT-03, DAT-07) con una red falsa: nunca cae al ejemplo
// por un error, guarda en orden, reintenta sin perder nada, avisa, y si venció la sesión espera a que se vuelva a entrar.
// Uso: node pruebas/servidor-pagina.mjs (también corre con npm run verificar)
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const FIN = 'iniciarStore();\n})();';
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.ok(src.includes(FIN));
const code = src.replace(FIN, `globalThis.__t = {get S() { return S; }, set S(v) { S = v; }, get demo() { return demo; }, set demo(v) { demo = v; },
  get loaded() { return loaded; }, get store() { return store; }, put, del, guardarAj, vacio, CATS_BASE, AJ_BASE, renders: 0};
const _render = render; render = () => { globalThis.__t.renders++; return _render(); };
iniciarStore();
})();`);

// Red falsa: modo 'ok', 'caida' (sin señal), 'sesion' (Access redirige) o 'malo' (400); guarda lo que se pidió
let modo = 'caida', datos = {main: null, cols: {}};
const pedidos = [];
async function red(url, op) {
  pedidos.push({url, metodo: op.method, cuerpo: op.body ? JSON.parse(op.body) : undefined, modo});
  if (modo === 'caida') throw new TypeError('Failed to fetch');
  if (modo === 'sesion') return {type: 'opaqueredirect', status: 0, ok: false};
  if (modo === 'malo') return {type: 'basic', status: 400, ok: false};
  if (op.method === 'GET') return {type: 'basic', status: 200, ok: true, json: async () => datos};
  return {type: 'basic', status: 204, ok: true};
}

function el() {
  return {innerHTML: '', textContent: '', dataset: {}, value: '', addEventListener() {}, focus() {}, remove() {}, appendChild() {},
    setAttribute() {}, querySelector: () => el(), querySelectorAll: () => []};
}
const guardado = el(), oyentes = {};
const meta = {getAttribute: n => n === 'content' ? '/api' : null};
const ctx = {
  console, setTimeout, clearTimeout, queueMicrotask, AbortController, fetch: red,
  location: {hash: ''},
  document: {querySelector: s => s === 'meta[name="rumbo-api"]' ? meta : s === '#guardado' ? guardado : el(),
    querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), body: el(), head: el(), getElementById: () => el(), visibilityState: 'visible'},
  localStorage: {getItem: () => null, setItem() {}, removeItem() {}},
  scrollTo() {}, addEventListener: (ev, f) => { (oyentes[ev] ||= []).push(f); },
};
ctx.window = ctx;
vm.createContext(ctx);
new vm.Script(code, {filename: 'index.html'}).runInContext(ctx);
const espera = (ms = 20) => new Promise(r => setTimeout(r, ms));
await espera();
const t = ctx.__t;
let n = 0;
const ok = name => { n++; console.log('ok -', name); };
const escrituras = () => pedidos.filter(p => p.metodo !== 'GET' && p.modo === 'ok').map(p => `${p.metodo} ${p.url}`);

// Sin red al abrir: no muestra el ejemplo (desde él se podría «empezar» encima de los datos reales); reintenta
assert.equal(t.store.tipo, 'servidor');
assert.equal(t.loaded, false);
assert.equal(t.renders, 0, 'no dibujó nada mientras no hay datos');
modo = 'ok';
datos = {main: {aj: {...t.AJ_BASE, empezado: true, tc: 13}}, cols: {cuentas: [{id: 'efectivo', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 650}]}};
await espera(3100);
assert.equal(t.loaded, true);
assert.equal(t.demo, false);
assert.equal(t.S.aj.tc, 13);
assert.deepEqual(t.S.cuentas.map(c => c.nombre), ['Efectivo']);
assert.equal(t.S.movs.length, 0, 'las colecciones que no vinieron quedan vacías');
ok('DAT-03 sin red al abrir no cae al ejemplo y carga cuando vuelve');

// Sin señal: un gasto y luego borrarlo. Avisa, no se pierde nada y al volver llega en orden
modo = 'caida';
t.put('movs', {id: 'g1', tipo: 'gasto', cuentaId: 'efectivo', monto: 20, fecha: '2026-11-13'});
t.del('movs', 'g1');
await espera();
assert.match(guardado.innerHTML, /Hay cambios sin guardar/);
assert.equal(t.store.cola.length, 2);
const salir = {preventDefault() { this.parado = true; }};
oyentes.beforeunload.forEach(f => f(salir));
assert.ok(salir.parado, 'advierte antes de cerrar con cambios pendientes');
modo = 'ok';
t.store.reanudar(); await espera();
assert.deepEqual(escrituras(), ['PUT /api/docs/movs/g1', 'DELETE /api/docs/movs/g1']);
assert.equal(guardado.innerHTML, '');
const salir2 = {preventDefault() { this.parado = true; }};
oyentes.beforeunload.forEach(f => f(salir2));
assert.ok(!salir2.parado, 'sin pendientes no advierte');
ok('DAT-07 sin señal guarda después, en orden, y avisa mientras tanto');

// Lo que se guarda es el movimiento como estaba al anotarlo, aunque después cambie en pantalla
pedidos.length = 0;
const m = {id: 'g2', tipo: 'gasto', cuentaId: 'efectivo', monto: 35, fecha: '2026-11-13', nota: 'Salteñas'};
modo = 'caida'; t.put('movs', m); m.monto = 999;
modo = 'ok'; t.store.reanudar(); await espera();
assert.equal(pedidos.find(p => p.modo === 'ok' && p.metodo === 'PUT').cuerpo.monto, 35);
ok('DAT-07 manda el movimiento tal como se anotó');

// Sesión vencida: la cola se detiene sin perder nada y pide volver a entrar; al volver, guarda
pedidos.length = 0;
modo = 'sesion';
t.put('movs', {id: 'i1', tipo: 'ingreso', cuentaId: 'efectivo', monto: 500, fecha: '2026-11-13'});
await espera();
assert.match(guardado.innerHTML, /Tu sesión venció/);
assert.equal(t.store.cola.length, 1);
modo = 'ok';
oyentes.focus.forEach(f => f()); await espera();
assert.deepEqual(escrituras(), ['PUT /api/docs/movs/i1']);
assert.equal(guardado.innerHTML, '');
ok('DAT-07 con la sesión vencida espera a que se vuelva a entrar y no pierde el ingreso');

// Un cambio que el servidor rechaza (400) no traba los siguientes y se avisa
pedidos.length = 0;
modo = 'malo'; t.put('movs', {id: 'x1', monto: 1});
await espera();
modo = 'ok'; t.put('movs', {id: 'x2', monto: 2}); await espera();
assert.deepEqual(escrituras(), ['PUT /api/docs/movs/x2']);
assert.match(guardado.innerHTML, /Un cambio no se pudo guardar/);
ok('DAT-07 un cambio rechazado no traba los demás y se avisa');

// Varios cambios de Ajustes sin señal salen como uno solo, con lo último
pedidos.length = 0;
modo = 'caida';
for (const tc of [12.6, 12.7, 12.8]) { t.S.aj.tc = tc; t.guardarAj(); }
// El primero ya estaba saliendo: queda uno más para lo último, no uno por cada cambio
assert.equal(t.store.cola.length, 2);
modo = 'ok'; t.store.reanudar(); await espera();
assert.ok(escrituras().length <= 2 && escrituras().every(e => e === 'PUT /api/ajustes'), escrituras().join());
assert.equal(pedidos.filter(p => p.modo === 'ok').at(-1).cuerpo.aj.tc, 12.8);
ok('DAT-07 los Ajustes pendientes no se repiten por cada cambio y lo último es lo que queda');

// Cargar un respaldo y borrar todo van completos, en una sola petición cada uno
pedidos.length = 0;
const N = t.vacio(); N.aj = {...t.AJ_BASE, empezado: true}; N.cuentas = [{id: 'banco', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550}];
await t.store.reemplazar(N); await t.store.clear(); await espera();
assert.deepEqual(escrituras(), ['PUT /api/datos', 'DELETE /api/datos']);
const cuerpo = pedidos.find(p => p.metodo === 'PUT').cuerpo;
assert.deepEqual(cuerpo.main, JSON.parse(JSON.stringify({aj: N.aj})));
assert.deepEqual(JSON.parse(JSON.stringify(cuerpo.cols.cuentas)), JSON.parse(JSON.stringify(N.cuentas)));
assert.deepEqual(Object.keys(cuerpo.cols).sort(), Object.keys(t.vacio()).filter(k => k !== 'aj').sort());
ok('DAT-04 cargar un respaldo y borrar todo salen completos');

// Al volver a la pestaña recarga lo anotado en otro equipo, pero no si hay algo pendiente
modo = 'ok';
datos = {main: {aj: {...t.AJ_BASE, empezado: true}}, cols: {cuentas: [{id: 'otra', nombre: 'Desde la compu', moneda: 'BOB', saldoInicial: 1}]}};
await t.store.cargar(false);
assert.deepEqual(t.S.cuentas.map(c => c.nombre), ['Desde la compu']);
modo = 'caida'; t.put('cuentas', {id: 'nueva', nombre: 'Nueva', moneda: 'BOB', saldoInicial: 5});
await t.store.cargar(false);
assert.ok(t.S.cuentas.some(c => c.id === 'nueva'), 'no pisó lo pendiente con lo leído');
modo = 'ok'; t.store.reanudar(); await espera();
ok('DAT-03 al volver recarga lo de otro equipo sin pisar lo pendiente');

console.log(`\n${n} pruebas del guardado en el servidor, todas bien.`);
