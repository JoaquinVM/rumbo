// Prueba el guardado en la base del artifact con una base falsa: al empezar o cargar un respaldo, la app no vuelve
// al ejemplo mientras escribe, y «Borrar todo» no muestra datos a medio borrar.
// Uso: node pruebas/nube.mjs (también corre con npm run verificar)
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const FIN = 'iniciarStore();\n})();';
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.ok(src.includes(FIN));
const code = src.replace(FIN, `globalThis.__t = {get S() { return S; }, set S(v) { S = v; }, get demo() { return demo; }, set demo(v) { demo = v; },
  get store() { return store; }, vacio, CATS_BASE, AJ_BASE, renders: 0};
const _render = render; render = () => { globalThis.__t.renders++; globalThis.__t.vistos.push(demo); return _render(); };
globalThis.__t.vistos = [];
iniciarStore();
})();`);

// Base falsa con la forma que usa la app: doc(), collection(), set(), delete() y onSnapshot() asíncronos
function baseFalsa() {
  const docs = new Map(); // ruta -> datos
  const oyentes = []; // {tipo:'doc'|'col', ruta, cb}
  const avisar = () => queueMicrotask(() => oyentes.forEach(emitir));
  const emitir = o => {
    if (o.tipo === 'doc') { const d = docs.get(o.ruta); o.cb({exists: d !== undefined, data: () => d}); }
    else {
      const pre = o.ruta + '/';
      const lista = [...docs].filter(([k]) => k.startsWith(pre) && !k.slice(pre.length).includes('/')).map(([k, v]) => ({id: k.slice(pre.length), data: () => v}));
      o.cb({docs: lista});
    }
  };
  const docRef = ruta => ({
    set: async d => { await null; docs.set(ruta, JSON.parse(JSON.stringify(d))); avisar(); },
    delete: async () => { await null; docs.delete(ruta); avisar(); },
    onSnapshot: cb => { const o = {tipo: 'doc', ruta, cb}; oyentes.push(o); queueMicrotask(() => emitir(o)); },
    collection: n => colRef(`${ruta}/${n}`)
  });
  const colRef = ruta => ({
    doc: id => docRef(`${ruta}/${id}`),
    onSnapshot: cb => { const o = {tipo: 'col', ruta, cb}; oyentes.push(o); queueMicrotask(() => emitir(o)); }
  });
  return {doc: docRef, docs};
}

function el() {
  return {innerHTML: '', textContent: '', dataset: {}, value: '', addEventListener() {}, focus() {}, remove() {}, appendChild() {},
    setAttribute() {}, querySelector: () => el(), querySelectorAll: () => []};
}
const db = baseFalsa();
const ctx = {
  console, setTimeout, clearTimeout, queueMicrotask,
  location: {hash: ''},
  document: {querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), body: el(), getElementById: () => el()},
  localStorage: {getItem: () => null, setItem() {}, removeItem() {}},
  scrollTo() {}, addEventListener() {},
  claude: {use: async n => n === 'db' ? db : {id: async () => 'u1'}}
};
ctx.window = ctx;
vm.createContext(ctx);
new vm.Script(code, {filename: 'index.html'}).runInContext(ctx);
const espera = () => new Promise(r => setTimeout(r, 20));
await espera();
const t = ctx.__t;
let n = 0;
const ok = name => { n++; console.log('ok -', name); };

assert.equal(t.store.tipo, 'cloud');
assert.equal(t.demo, true, 'sin datos arranca en el ejemplo');
ok('DAT · base vacía muestra el ejemplo');

// Empezar: la app pasa a los datos nuevos y no vuelve al ejemplo mientras guarda
const nuevo = (nombre, saldo) => {
  const N = t.vacio(); N.aj = {...t.AJ_BASE, empezado: true}; N.categorias = t.CATS_BASE.map(c => ({...c}));
  N.cuentas.push({id: 'c_' + nombre, nombre, moneda: 'BOB', saldoInicial: saldo, rendimiento: 0, diaADia: true, archivada: false});
  return N;
};
let N = nuevo('Efectivo', 650);
t.demo = false; t.S = N; t.vistos.length = 0;
await t.store.reemplazar(N); await espera();
assert.ok(!t.vistos.includes(true), `volvió al ejemplo mientras guardaba: ${t.vistos}`);
assert.equal(t.demo, false); assert.equal(t.S.cuentas[0].nombre, 'Efectivo');
assert.ok(db.docs.has('data/users/u1/rumbo/cuentas/c_Efectivo'));
ok('DAT · empezar no vuelve al ejemplo mientras guarda');

// Cargar un respaldo encima: borra lo que sobra, nunca pasa por el ejemplo
N = nuevo('Banco', 3550);
t.S = N; t.vistos.length = 0;
await t.store.reemplazar(N); await espera();
assert.ok(!t.vistos.includes(true), `volvió al ejemplo al cargar el respaldo: ${t.vistos}`);
assert.deepEqual(t.S.cuentas.map(c => c.nombre), ['Banco']);
assert.ok(!db.docs.has('data/users/u1/rumbo/cuentas/c_Efectivo'), 'la cuenta anterior se borró');
ok('DAT · cargar respaldo reemplaza sin pasar por el ejemplo');

// Borrar todo: la base queda vacía y la app en el ejemplo, sin mostrar datos a medio borrar
t.vistos.length = 0;
await t.store.clear(); await espera();
assert.equal(t.demo, true);
assert.equal([...db.docs.keys()].length, 0, 'la base quedó vacía');
assert.ok(!t.vistos.includes(false), `mostró datos a medio borrar: ${t.vistos}`);
ok('DAT · borrar todo deja la base vacía');

console.log(`\n${n} pruebas de la base, todas bien.`);
