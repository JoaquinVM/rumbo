// Verifica las reglas de dinero de Rumbo (IDs de openspec) y que cada vista se dibuje, sin navegador.
// Uso: npm run verificar
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(m, 'index.html tiene un script');
const FIN = 'iniciarStore();\n})();';
assert.ok(m[1].includes(FIN), 'el script termina con iniciarStore()');
const expuestas = ['money','usd','fmtN','parseAmt','fechaFijo','saldoCuenta','apartadoCuenta','saldoDeuda','patrimonio','tcDias','ultimoCambio',
  'ritmo','promedioIrregular','amortizar','infoPrestamo','proyectar','pendientes','proximoIngreso','calcHoy','infoMeta','estadoMetas',
  'gastoMesCat','avanceTopes','nivelTope','resumenMes','indicadores','catsPorUso','notasSugeridas','respaldo','leerRespaldo','vacio',
  'makeDemo','confirmarFijo','saltarFijo','vRumbo','vMovimientos','vDesglose','vPlan','vDeuda','vMeta','vCategorias','vAjustes','CATS_BASE','ui'];
const code = m[1].replace(FIN, `globalThis.__t = {${expuestas.join(',')},
  setHoy: d => { HOY = d; }, get S() { return S; }, set S(v) { S = v; }, get demo() { return demo; }, set demo(v) { demo = v; }};
iniciarStore();
})();`);

function el() {
  return {innerHTML: '', textContent: '', dataset: {}, value: '', addEventListener() {}, focus() {}, remove() {}, appendChild() {},
    setAttribute() {}, querySelector: () => el(), querySelectorAll: () => []};
}
const ls = {};
const ctx = {
  console, setTimeout, clearTimeout,
  location: {hash: ''},
  document: {querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), body: el(), getElementById: () => el()},
  localStorage: {getItem: k => ls[k] ?? null, setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; }},
  scrollTo() {}, addEventListener() {}
};
ctx.window = ctx;
vm.createContext(ctx);
new vm.Script(code, {filename: 'index.html'}).runInContext(ctx);
await new Promise(r => setTimeout(r, 20));
const t = ctx.__t;
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok -', name); };
const cerca = (a, b, tol = 0.01, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} esperaba ${b}, dio ${a}`);
const HOY = '2026-11-10T12:00:00';
const h = new Date(HOY);

// Estado de base: Efectivo 650, Banco 3550, Dólares US$ 1.200, tipo 12,50
function base() {
  const S = t.vacio();
  S.aj = {...S.aj, tc: 12.5, tcFecha: '2026-11-01', inflacion: 0, irregular: 0, horas: 160, empezado: true};
  S.categorias = t.CATS_BASE.map(c => ({...c}));
  S.cuentas = [
    {id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 650, rendimiento: 0, diaADia: true},
    {id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550, rendimiento: 0, diaADia: true},
    {id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: 1200, rendimiento: 0, diaADia: false}];
  return S;
}
const prestamo = (extra = {}) => ({id: 'pr', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: 18400, interes: 14, cuota: 900, dia: 20, ...extra});
const conFijos = (S, lista) => { S.fijos = lista.map((f, i) => ({id: 'f' + i, cuentaId: 'bn', desde: '2026-11', activo: true, ...f})); return S; };

// ---------- datos y formato ----------
test('DAT-01 sin datos guardados abre el ejemplo y no guarda nada', () => {
  assert.equal(t.demo, true); assert.equal(Object.keys(ls).length, 0);
});
t.setHoy(HOY);
test('FMT-01 montos en bolivianos', () => assert.equal(t.money(1500), 'Bs 1.500'));
test('FMT-02 dos decimales en movimientos y ninguno en resúmenes', () => { assert.equal(t.money(35, 2), 'Bs 35,00'); assert.equal(t.money(3073.4), 'Bs 3.073'); });
test('FMT-03 montos escritos con punto o coma', () => {
  const casos = {'1.500': 1500, '1,500': 1500, '12,50': 12.5, '12.5': 12.5, '1.500,50': 1500.5, '1,500.50': 1500.5, '1.000.000': 1000000, 'Bs 250': 250, '0.500': 0.5, '': 0};
  for (const [txt, v] of Object.entries(casos)) assert.equal(t.parseAmt(txt), v, txt);
});
test('FMT-04 montos en dólares', () => assert.equal(t.usd(1200), 'US$ 1.200'));

// ---------- cuentas ----------
test('CTA-02 saldo calculado de los movimientos', () => {
  const S = base();
  S.movs = [{id: '1', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: 1200, fecha: '2026-11-07'},
    {id: '2', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'super', monto: 320, fecha: '2026-11-09'},
    {id: '3', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', monto: 1250, montoDestino: 100, fecha: '2026-11-08'}];
  assert.equal(t.saldoCuenta(S, S.cuentas[1]), 3180);
});
test('CTA-03 un ajuste no es gasto', () => {
  const S = base(); S.movs = [{id: '1', tipo: 'ajuste', cuentaId: 'ef', monto: 45, sentido: -1, fecha: '2026-11-03'}];
  assert.equal(t.saldoCuenta(S, S.cuentas[0]), 605); assert.equal(t.resumenMes(S, '2026-11').salio, 0);
});
test('CTA-04 días del tipo de cambio', () => assert.equal(t.tcDias(base(), h), 9));
test('CTA-05 patrimonio en Bs y su equivalente en US$', () => {
  const S = base(), p = t.patrimonio(S); assert.equal(p.total, 19200); assert.equal(Math.round(p.total / S.aj.tc), 1536);
});
test('CTA-06 tipo de cambio desde un cambio real', () => {
  const S = base(); S.movs = [{id: '3', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', monto: 1250, montoDestino: 100, fecha: '2026-11-08'}];
  assert.equal(t.ultimoCambio(S).tc, 12.5);
});
test('MOV-03 una transferencia no es gasto ni ingreso', () => {
  const S = base(); S.movs = [{id: '3', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', monto: 1250, montoDestino: 100, fecha: '2026-11-08'}];
  assert.equal(t.saldoCuenta(S, S.cuentas[1]), 2300); assert.equal(t.saldoCuenta(S, S.cuentas[2]), 1300);
  const r = t.resumenMes(S, '2026-11'); assert.equal(r.salio, 0); assert.equal(r.entro, 0);
});
test('MOV-02 categorías por uso y notas sugeridas', () => {
  const S = base(); S.movs = [1, 2, 3].map(i => ({id: 'c' + i, tipo: 'gasto', cuentaId: 'ef', categoriaId: 'transporte', monto: 10, fecha: '2026-11-0' + i, nota: 'Taxi'}));
  assert.equal(t.catsPorUso(S, 'gasto', h)[0].id, 'transporte'); assert.deepEqual([...t.notasSugeridas(S, 'transporte')], ['Taxi']);
});

// ---------- ritmo y proyección ----------
test('PRO-02 ritmo con variable de dos meses', () => {
  const S = conFijos(base(), [{nombre: 'Sueldo', tipo: 'ingreso', monto: 10000, categoriaId: 'sueldo', dia: 25}, {nombre: 'Renta', tipo: 'gasto', monto: 3000, categoriaId: 'casa', dia: 5}]);
  S.movs = [{id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 600, fecha: '2026-09-10'},
    {id: '2', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 600, fecha: '2026-11-09'},
    {id: '3', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 99999, fecha: '2026-04-01'}];
  const R = t.ritmo(S, h);
  assert.ok(R.months > 1.95 && R.months < 2.1); cerca(R.varCat.comida, 1200 / R.months, 1e-6); cerca(R.neto, 7000 - 1200 / R.months, 1e-6);
});
test('PRO-02 irregular esperado en vez del real', () => {
  const S = base(); S.aj.irregular = 1500;
  S.movs = [{id: '1', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: 5220, fecha: '2026-10-20'}];
  assert.equal(t.ritmo(S, h).ingreso, 1500);
});
test('AJU-01 promedio real de 3 meses', () => {
  const S = base(); S.movs = [1500, 2200, 1520].map((v, i) => ({id: 'i' + i, tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: v, fecha: ['2026-08-20', '2026-09-20', '2026-10-20'][i]}));
  cerca(t.promedioIrregular(S, h), 1740);
});
test('PRO-03 rendimiento por cuenta sobre saldo positivo', () => {
  const S = t.vacio(); S.aj.inflacion = 0;
  S.cuentas = [{id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: 12000, rendimiento: 12}, {id: 'e', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 1000, rendimiento: 0}];
  cerca(t.proyectar(S, h, 1, {nominal: true}).pts[1], 13120);
});
test('PRO-03 una deuda no rinde', () => {
  const S = t.vacio(); S.cuentas = [{id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: -5000, rendimiento: 12}];
  cerca(t.proyectar(S, h, 12, {nominal: true}).pts[12], -5000);
});
test('PRO-04 al terminar el préstamo su cuota deja de salir', () => {
  const S = t.vacio(); S.cuentas = [{id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: 0}];
  S.deudas = [{id: 'p', tipo: 'prestamo', nombre: 'Préstamo', moneda: 'BOB', saldoInicial: 1800, interes: 0, cuota: 900, dia: 20}];
  S.fijos = [{id: 'c', nombre: 'Cuota', tipo: 'gasto', monto: 900, cuentaId: 'b', categoriaId: 'intereses', dia: 20, deudaId: 'p', desde: '2026-11', activo: true}];
  const P = t.proyectar(S, h, 4, {nominal: true});
  assert.equal(P.prest[0].fin, 2); P.pts.forEach(v => cerca(v, -1800));
});
test('PRO-05 plata de hoy con inflación', () => {
  const S = t.vacio(); S.aj.inflacion = 8; S.cuentas = [{id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: 146932.8, rendimiento: 0}];
  const P = t.proyectar(S, h, 60); cerca(P.pts[60], 100000, 1); cerca(P.nom[60], 146932.8);
});
test('PRO-07 ahorros que se acaban', () => {
  t.S = conFijos(base(), [{nombre: 'Renta', tipo: 'gasto', monto: 30000, categoriaId: 'casa', dia: 5}]); t.demo = false;
  assert.match(t.vRumbo(), /se acaban en/);
});
test('PRO-08 recortar y sumar ingreso extra', () => {
  const S = base(); S.movs = [{id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 600, fecha: '2026-11-09'}];
  const a = t.proyectar(S, h, 12), b = t.proyectar(S, h, 12, {recortes: {comida: 50}, extra: 1000});
  cerca(b.neto - a.neto, 300 + 1000);
});
test('PRO-08 adelantar el préstamo', () => {
  const S = base(); S.deudas = [prestamo()];
  const a = t.infoPrestamo(S, S.deudas[0], h), b = t.infoPrestamo(S, S.deudas[0], h, 300);
  assert.equal(b.fin, '2028-03'); assert.equal(a.cuotas - b.cuotas, 7); cerca(a.interes - b.interes, 753.42);
});

// ---------- fijos y hoy ----------
test('FIJ-01 el día 31 cae el último día del mes', () => assert.equal(t.fechaFijo(31, '2027-02'), '2027-02-28'));
function escenarioHoy() {
  const S = conFijos(base(), [
    {nombre: 'Sueldo', tipo: 'ingreso', monto: 8000, categoriaId: 'sueldo', dia: 25},
    {nombre: 'Luz', tipo: 'gasto', monto: 180, categoriaId: 'casa', dia: 8},
    {nombre: 'Streaming', tipo: 'gasto', monto: 60, categoriaId: 'suscripciones', dia: 12},
    {nombre: 'Internet', tipo: 'gasto', monto: 200, categoriaId: 'casa', dia: 15},
    {nombre: 'Cuota', tipo: 'gasto', monto: 900, categoriaId: 'intereses', dia: 20}]);
  S.metas = [{id: 'm', nombre: 'Meta', monto: 6500, mes: '2027-12'}];
  return S;
}
test('HOY-01 disponible de las cuentas del día a día', () => {
  const S = base(); assert.equal(t.calcHoy(S, h).disp, 4200);
  S.apartados = [{id: 'a', metaId: 'x', cuentaId: 'bn', monto: 500, fecha: '2026-11-02'}]; assert.equal(t.calcHoy(S, h).disp, 3700);
});
test('HOY-02 libre hasta el próximo ingreso', () => { const H = t.calcHoy(escenarioHoy(), h); assert.equal(H.compBs, 1340); cerca(H.metas, 500); cerca(H.libre, 2360); });
test('HOY-03 monto al día', () => {
  const H = t.calcHoy(escenarioHoy(), h); assert.equal(H.dias, 15); assert.equal(Math.round(H.alDia), 157);
  const S = t.vacio(); S.cuentas = [{id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 600, diaADia: true}];
  const H2 = t.calcHoy(S, new Date('2026-11-25T12:00:00')); assert.equal(H2.dias, 6); assert.equal(H2.alDia, 100);
});
test('HOY-04 un ingreso irregular sube el libre', () => {
  const S = escenarioHoy(), a = t.calcHoy(S, h).libre;
  S.movs.push({id: 'n', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: 1200, fecha: '2026-11-10'});
  cerca(t.calcHoy(S, h).libre - a, 1200);
});
test('FIJ-02 confirmar con otro monto y saltar', () => {
  t.S = escenarioHoy(); t.demo = false;
  assert.equal(t.pendientes(t.S, h).length, 1);
  t.confirmarFijo('f1_2026-11', 195);
  const mv = t.S.movs.find(x => x.fijoId === 'f1'); assert.equal(mv.monto, 195); assert.equal(mv.tipo, 'gasto');
  assert.equal(t.pendientes(t.S, h).length, 0);
  t.saltarFijo('f2_2026-11'); assert.equal(t.S.ocurrencias.find(o => o.id === 'f2_2026-11').estado, 'saltado');
});
test('FIJ-02 confirmar dos veces el mismo mes deja un solo movimiento', () => {
  t.S = escenarioHoy(); t.confirmarFijo('f1_2026-11', 180);
  const copia = {...t.S, ocurrencias: []}; t.S = copia; t.confirmarFijo('f1_2026-11', 180); // otra pestaña sin la ocurrencia todavía
  assert.equal(t.S.movs.filter(x => x.fijoId === 'f1').length, 1); assert.equal(t.S.movs[0].id, 'm_f1_2026-11');
});
test('FIJ-05 un fijo pendiente no cambia el saldo', () => {
  const S = escenarioHoy(); assert.equal(t.saldoCuenta(S, S.cuentas[1]), 3550); assert.equal(t.resumenMes(S, '2026-11').salio, 0);
});

// ---------- deudas ----------
test('DEU-02 interés y capital de la cuota', () => {
  const f = t.amortizar(18400, 14, 900).filas[0]; assert.equal(f.interes, 214.67); assert.equal(f.capital, 685.33); assert.equal(f.saldo, 17714.67);
});
test('FIJ-04 confirmar la cuota registra un pago de deuda', () => {
  const S = base(); S.deudas = [prestamo()];
  S.fijos = [{id: 'fc', nombre: 'Cuota', tipo: 'gasto', monto: 900, cuentaId: 'bn', categoriaId: 'intereses', dia: 5, deudaId: 'pr', desde: '2026-11', activo: true}];
  t.S = S; t.confirmarFijo('fc_2026-11', 900);
  const p = t.S.movs[0]; assert.equal(p.tipo, 'pago'); assert.equal(p.interes, 214.67); assert.equal(p.capital, 685.33);
  assert.equal(t.saldoDeuda(t.S, t.S.deudas[0]), 17714.67); cerca(t.gastoMesCat(t.S, '2026-11').intereses, 214.67);
});
test('DEU-03 el amigo paga y el patrimonio no cambia', () => {
  const S = base(); S.deudas = [{id: 'am', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: 400}];
  const antes = t.patrimonio(S).total;
  S.movs = [{id: 'c', tipo: 'cobro', deudaId: 'am', cuentaId: 'ef', monto: 400, fecha: '2026-11-10'}];
  assert.equal(t.saldoCuenta(S, S.cuentas[0]), 1050); assert.equal(t.saldoDeuda(S, S.deudas[0]), 0); assert.equal(t.patrimonio(S).total, antes);
});
test('DEU-04 fin del préstamo, interés total y deuda que crece', () => {
  const S = base(); S.deudas = [prestamo()]; const P = t.infoPrestamo(S, S.deudas[0], h);
  assert.equal(P.cuotas, 24); assert.equal(P.fin, '2028-10'); cerca(P.interes, 2744.3);
  assert.equal(t.amortizar(10000, 24, 150).crece, true);
});
test('DEU-05 próximas tres cuotas', () => {
  const f = t.amortizar(18400, 14, 900).filas.slice(0, 3).map(x => [x.interes, x.capital, x.saldo]);
  assert.deepEqual(JSON.parse(JSON.stringify(f)), [[214.67, 685.33, 17714.67], [206.67, 693.33, 17021.34], [198.58, 701.42, 16319.92]]);
});
test('IND-04 deuda total y fin de los préstamos', () => {
  const S = base(); S.deudas = [prestamo(), {id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: 1500}];
  const I = t.indicadores(S, h); assert.equal(I.deudaTotal, 19900); assert.equal(I.libreDePrestamos, '2028-10');
});
test('IND-02 colchón con las cuentas', () => {
  const S = conFijos(base(), [{nombre: 'Gastos', tipo: 'gasto', monto: 7440, categoriaId: 'casa', dia: 5}]);
  cerca(t.indicadores(S, h).colchon, 19200 / 7440, 1e-9);
});

// ---------- metas ----------
test('MET-02 apartar sin mover', () => {
  const S = base(); S.metas = [{id: 'fo', nombre: 'Fondo', monto: 15000, mes: '2027-12'}];
  S.apartados = [{id: 'a', metaId: 'fo', cuentaId: 'us', monto: 320, fecha: '2026-10-01'}];
  assert.equal(t.infoMeta(S, S.metas[0], h).ap, 4000); assert.equal(t.saldoCuenta(S, S.cuentas[2]), 1200); assert.equal(t.apartadoCuenta(S, 'us'), 320);
});
test('MET-03 aporte sugerido y lo que falta este mes', () => {
  const S = base(); S.metas = [{id: 'fo', nombre: 'Fondo', monto: 15000, mes: '2027-12'}];
  S.apartados = [{id: 'a', metaId: 'fo', cuentaId: 'bn', monto: 3454, fecha: '2026-10-01'}, {id: 'b', metaId: 'fo', cuentaId: 'bn', monto: 546, fecha: '2026-11-02'}];
  const I = t.infoMeta(S, S.metas[0], h); assert.equal(I.meses, 13); assert.equal(Math.round(I.aporte), 846); assert.equal(Math.round(I.falta), 300);
});
test('MET-05 vas bien o no alcanza', () => {
  const S = conFijos(base(), [{nombre: 'Sueldo', tipo: 'ingreso', monto: 2060, categoriaId: 'sueldo', dia: 25}]);
  S.metas = [{id: 'a', nombre: 'A', monto: 846 * 13, mes: '2027-12'}, {id: 'b', nombre: 'B', monto: 975 * 8, mes: '2027-07'}];
  assert.equal(t.estadoMetas(S, h).vasBien, true);
  S.fijos[0].monto = 1500; const E = t.estadoMetas(S, h); assert.equal(E.vasBien, false); assert.equal(Math.round(E.faltaMes), 321);
});

// ---------- categorías y topes ----------
test('LIM-01 una categoría archivada conserva sus movimientos', () => {
  const S = base(); S.categorias.find(c => c.id === 'educacion').archivada = true;
  S.movs = [{id: '1', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'educacion', monto: 100, fecha: '2026-11-03'}];
  assert.equal(t.resumenMes(S, '2026-11').cats.educacion, 100); assert.ok(!t.catsPorUso(S, 'gasto', h).some(c => c.id === 'educacion'));
});
test('LIM-03 tope mensual que no pasa al mes siguiente', () => {
  const S = base(); S.categorias.find(c => c.id === 'comida').tope = 1000;
  S.movs = [{id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 1150, fecha: '2026-10-15'}];
  cerca(t.avanceTopes(S, '2026-10')[0].pct, 1.15); assert.equal(t.avanceTopes(S, '2026-11')[0].gastado, 0);
});
test('LIM-04 avisos ámbar y rojo', () => { assert.equal(t.nivelTope(0.85), 'ambar'); assert.equal(t.nivelTope(1.15), 'rojo'); assert.equal(t.nivelTope(0.5), 'ok'); });
test('MOV-05 aviso de tope al anotar', () => {
  const S = base(); S.categorias.find(c => c.id === 'comida').tope = 1000;
  S.movs = [{id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 850, fecha: '2026-11-03'}];
  assert.equal(Math.round(t.avanceTopes(S, '2026-11', {cat: 'comida', monto: 35})[0].pct * 100), 89);
});
test('DES-02 de cada 100 y horas de trabajo', () => {
  const S = base(); S.movs = [{id: 'i', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'sueldo', monto: 9800, fecha: '2026-10-25'}, {id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'casa', monto: 2880, fecha: '2026-10-05'}];
  const r = t.resumenMes(S, '2026-10'); assert.equal(Math.round(r.cats.casa / r.entro * 100), 29); assert.equal(Math.round(r.cats.casa / (r.entro / 160)), 47);
});

// ---------- respaldo ----------
test('DAT-04 respaldo de ida y vuelta, y archivo ajeno', () => {
  const S = t.makeDemo(), r = t.leerRespaldo(JSON.stringify(t.respaldo(S)));
  assert.equal(r.conteo.cuentas, 3); assert.equal(r.conteo.movs, S.movs.length);
  assert.ok(t.leerRespaldo('hola').error); assert.ok(t.leerRespaldo('{"app":"otra"}').error);
});

// ---------- pantallas ----------
test('PAN las vistas se dibujan con el ejemplo y sin letras en los íconos', () => {
  t.S = t.makeDemo(); t.demo = true; t.ui.mes = '2026-11';
  for (const v of [t.vRumbo, t.vMovimientos, t.vDesglose, t.vPlan, t.vCategorias, t.vAjustes]) assert.ok(v().length > 500);
  assert.ok(t.vDeuda(t.S.deudas[0]).includes('Próximas cuotas')); assert.ok(t.vDeuda(t.S.deudas[2]).length > 200); assert.ok(t.vMeta(t.S.metas[0]).includes('Apartar'));
  assert.ok(!/class="dt"[^>]*>[A-Za-z]/.test(t.vMovimientos() + t.vPlan()), 'PAN-06');
});

console.log(`\n${n} pruebas pasaron`);
