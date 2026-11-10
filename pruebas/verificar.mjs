// Verifies Rumbo's money model and that every view renders, without a browser.
// Run: npm run verificar
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(m, 'index.html has an inline script');
const END = 'initStore();\n})();';
assert.ok(m[1].includes(END), 'script ends with initStore()');
// Test-only hook: expose the closure's functions without changing the app.
const code = m[1].replace(END, `globalThis.__t = {parseAmt, project, baseline, whatIfNeto, monthData, render, vRumbo, vMovs, vDesglose, vFijos, ui,
  get S(){return S}, set S(v){S=v}, get demo(){return demo}};
initStore();
})();`);

function fakeEl() {
  return {innerHTML: '', textContent: '', dataset: {}, hidden: false, className: '',
    addEventListener() {}, focus() {}, remove() {}, appendChild() {}, setAttribute() {},
    querySelector: () => fakeEl(), querySelectorAll: () => []};
}
const store = {};
const ctx = {
  console, setTimeout, clearTimeout,
  location: {hash: ''},
  document: {querySelector: () => fakeEl(), querySelectorAll: () => [], addEventListener() {}, createElement: () => fakeEl(), body: fakeEl()},
  localStorage: {getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }},
  scrollTo() {}, addEventListener() {}
};
ctx.window = ctx;
vm.createContext(ctx);
new vm.Script(code, {filename: 'index.html'}).runInContext(ctx);
await new Promise(r => setTimeout(r, 20));
const t = ctx.__t;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok -', name); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

test('RUM-01 sin datos guardados abre el ejemplo y no guarda nada', () => {
  assert.equal(t.demo, true);
  assert.equal(store['rumbo-v1'], undefined);
});

test('RUM-12 montos escritos con punto o coma de miles y decimales', () => {
  const cases = {'1.500': 1500, '1,500': 1500, '12,50': 12.5, '12.5': 12.5, '1.500,50': 1500.5, '1,500.50': 1500.5,
    '1.000.000': 1000000, 'Bs 250': 250, '0.500': 0.5, '250': 250, '': 0, '-300': 300};
  for (const [txt, want] of Object.entries(cases)) assert.equal(t.parseAmt(txt), want, txt);
});

test('RUM-02 proyección sin rendimiento es lineal', () => {
  const p = t.project(1000, 500, 0, 12);
  assert.equal(p.length, 13);
  assert.equal(p[12], 1000 + 500 * 12);
});

test('RUM-02 el rendimiento solo crece saldos positivos', () => {
  const p = t.project(12000, 0, 12, 1);
  assert.ok(Math.abs(p[1] - 12120) < 1e-6);
  const n = t.project(-5000, 0, 12, 12);
  assert.equal(n[12], -5000);
});

test('RUM-03 ritmo: fijos completos y variable promediado', () => {
  t.S = {settings: {currency: 'MXN', patrimonio: 0, rendimiento: 0, metaAhorro: 0, horasMes: 160, onboarded: true},
    fijos: [{id: 'a', tipo: 'ingreso', cat: 'sueldo', nombre: 'Sueldo', monto: 10000},
            {id: 'b', tipo: 'gasto', cat: 'casa', nombre: 'Renta', monto: 3000}],
    movs: [{id: '1', fecha: daysAgo(60), tipo: 'gasto', cat: 'comida', monto: 600},
           {id: '2', fecha: daysAgo(1), tipo: 'gasto', cat: 'comida', monto: 600},
           {id: '3', fecha: daysAgo(200), tipo: 'gasto', cat: 'comida', monto: 99999}]};
  const B = t.baseline();
  assert.equal(B.fijIng, 10000);
  assert.equal(B.fijGas, 3000);
  assert.ok(B.months > 1.95 && B.months < 2.1, 'la ventana va del primer movimiento a hoy');
  assert.ok(Math.abs(B.varCat.comida - 1200 / B.months) < 1e-6, 'movimientos de más de 90 días no cuentan');
  assert.ok(Math.abs(B.neto - (10000 - 3000 - 1200 / B.months)) < 1e-6);
});

test('RUM-04 ¿y si…? recortar 50% suma la mitad del promedio', () => {
  const B = t.baseline();
  t.ui.wi = {comida: 50}; t.ui.wiExtra = 1000;
  const W = t.whatIfNeto(B);
  assert.ok(Math.abs(W.neto - (B.neto + B.varCat.comida / 2 + 1000)) < 1e-6);
  t.ui.wi = {}; t.ui.wiExtra = 0;
});

test('RUM-05 ahorros que se acaban: el titular lo dice', () => {
  t.S.settings.patrimonio = 1000;
  t.S.fijos = [{id: 'b', tipo: 'gasto', cat: 'casa', nombre: 'Renta', monto: 3000}];
  assert.match(t.vRumbo(), /se acaban en/);
});

test('las cuatro vistas se dibujan', () => {
  for (const v of [t.vRumbo, t.vMovs, t.vDesglose, t.vFijos]) assert.ok(v().length > 200);
});

console.log(`\n${passed} pruebas pasaron`);
