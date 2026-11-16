// The frozen v1 (pruebas/v1/index.html, v1.0.0) loaded in Node: the oracle Rumbo 2 is compared against (design.md,
// "Comparación con la v1"). It runs the page's script in a context with a fake document and localStorage, and
// returns its money functions. Each call gives a fresh engine with its own state.
// Use: const v1 = cargarMotor({hoy: '2026-11-10T12:00:00'}); v1.amortizar(18400, 14, 900)
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ARCHIVO = new URL('./index.html', import.meta.url);
const FIN = 'iniciarStore();\n})();';

// The pure functions of the v1 engine (money, accounts, debts, Hoy, goals, limits, summary, projection, backup)
export const FUNCIONES = ['money', 'usd', 'fmtN', 'parseAmt', 'fechaFijo', 'saldoCuenta', 'apartadoCuenta', 'saldoDeuda',
  'patrimonio', 'tcDias', 'ultimoCambio', 'ritmo', 'promedioIrregular', 'amortizar', 'infoPrestamo', 'proyectar',
  'pendientes', 'proximoIngreso', 'calcHoy', 'infoMeta', 'estadoMetas', 'gastoMesCat', 'avanceTopes', 'nivelTope',
  'resumenMes', 'indicadores', 'respaldo', 'leerRespaldo', 'vacio', 'makeDemo', 'separarGasto', 'devolverAlGasto',
  'teDebenPara', 'CATS_BASE'];

function el() {
  return {innerHTML: '', textContent: '', dataset: {}, value: '', style: {}, addEventListener() {}, focus() {}, remove() {},
    appendChild() {}, setAttribute() {}, querySelector: () => el(), querySelectorAll: () => []};
}

export function cargarMotor({hoy} = {}) {
  const html = readFileSync(ARCHIVO, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script || !script.includes(FIN)) throw new Error('pruebas/v1/index.html no tiene el script de la v1');
  const codigo = script.replace(FIN, `globalThis.__motor = {${FUNCIONES.join(',')},
    setHoy: d => { HOY = d; }, get S() { return S; }, set S(v) { S = v; }};
  iniciarStore();
})();`);
  const guardado = {};
  const ctx = {
    console, setTimeout, clearTimeout,
    location: {hash: ''},
    document: {querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(),
      body: el(), head: el(), getElementById: () => el()},
    localStorage: {getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = String(v); },
      removeItem: k => { delete guardado[k]; }},
    scrollTo() {}, addEventListener() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  new vm.Script(codigo, {filename: 'pruebas/v1/index.html'}).runInContext(ctx);
  const motor = ctx.__motor;
  if (hoy) motor.setHoy(new Date(hoy));
  return motor;
}
