import { describe, expect, it } from 'vitest';
import { base, conFijos, HOY, prestamo } from './base.prueba';
import { patrimonio } from './cuentas';
import { resumenMes } from './desglose';
import {
  cerrarDeuda, crearDeuda, cuentasPara, devolverAlGasto, maximoDe, montoSugerido, movimientoDeDeuda, separarGasto, teDebenPara,
} from './deudas';
import { centavos as c, mostrar, mostrarEn, monto, restarMontos } from './dinero';
import { pendientes, saltarFijo, confirmarFijo, ocurrenciasDe } from './fijos';
import type { Deuda, Estado, Movimiento } from './modelo';
import { gastoMesCat } from './movimientos';
import { amortizar, infoPrestamo, interesDelMes } from './prestamos';
import { saldoCuenta, saldoDeuda } from './saldos';

const amigo = (extra: Partial<Deuda> = {}): Deuda => ({ id: 'am', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: c(40000), ...extra });
const cena = (extra: Partial<Movimiento> = {}): Movimiento =>
  ({ id: 'g', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(30000), fecha: '2026-11-05', nota: 'Cena', ...extra });
const ids = { deuda: 'nueva', prestamo: 'p' };

function aplicar(S: Estado, r: ReturnType<typeof separarGasto>): Estado {
  if (!r.ok) throw new Error(r.codigo);
  if (r.datos.deuda) S.deudas.push(r.datos.deuda);
  for (const m of r.datos.movs) {
    const i = S.movs.findIndex((x) => x.id === m.id);
    if (i >= 0) S.movs[i] = m; else S.movs.push(m);
  }
  return S;
}
function devolver(S: Estado, r: ReturnType<typeof devolverAlGasto>): Estado {
  if (!r) throw new Error('no se devuelve');
  S.movs = S.movs.filter((m) => !r.borrar.includes(m.id));
  for (const m of r.escribir) {
    const i = S.movs.findIndex((x) => x.id === m.id);
    if (i >= 0) S.movs[i] = m; else S.movs.push(m);
  }
  return S;
}

describe('deudas', () => {
  it('DEU-01 préstamo de Bs 18.400 al 14 % con cuota de Bs 900: resta del patrimonio', () => {
    const S = base();
    const antes = patrimonio(S).total;
    S.deudas = [prestamo(), { id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000) }, amigo()];
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1840000);
    expect(mostrar(S.deudas[0]!.cuota!)).toBe('Bs 900');
    expect(patrimonio(S).total).toBe(antes - 1840000 - 150000 + 40000);
  });

  it('DEU-02 cuota de noviembre: interés 21467, capital 68533 y el saldo queda en 1771467', () => {
    const S = base();
    S.deudas = [prestamo()];
    const r = movimientoDeDeuda(S, S.deudas[0]!, { id: 'p', tipo: 'pago', monto: c(90000), cuentaId: 'bn', fecha: HOY, nota: 'Pagar' }, HOY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos.mov).toMatchObject({ tipo: 'pago', interes: 21467, capital: 68533, monto: 90000 });
    S.movs.push(r.datos.mov);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1771467);
    expect(gastoMesCat(S, '2026-11').intereses).toBe(21467);
  });

  it('DEU-02 pago menor que el interés: 10000 al 24 % y se pagan 150; capital −50 y la deuda sube a 10050', () => {
    const S = base();
    S.deudas = [prestamo({ saldoInicial: c(1000000), interes: 24, cuota: c(15000) })];
    const r = movimientoDeDeuda(S, S.deudas[0]!, { id: 'p', tipo: 'pago', monto: c(15000), cuentaId: 'bn', fecha: HOY, nota: '' }, HOY);
    if (!r.ok) throw new Error(r.codigo);
    expect(r.datos.mov).toMatchObject({ interes: 20000, capital: -5000 });
    S.movs.push(r.datos.mov);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1005000);
    expect(resumenMes(S, '2026-11').cats.intereses).toBe(20000);
  });

  it('DEU-03 el amigo paga 400: Efectivo sube 400, te deben queda en 0 y el patrimonio no cambia', () => {
    const S = base();
    S.deudas = [amigo()];
    const antes = patrimonio(S).total;
    const r = movimientoDeDeuda(S, S.deudas[0]!, { id: 'c', tipo: 'cobro', monto: c(40000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY);
    if (!r.ok) throw new Error(r.codigo);
    expect(r.datos.mov.interes).toBeUndefined();
    S.movs.push(r.datos.mov);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(105000);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(0);
    expect(patrimonio(S).total).toBe(antes);
  });

  it('DEU-03 prestar sube «te deben» y una deuda con una persona no tiene interés', () => {
    const S = base();
    S.deudas = [amigo(), { id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000) }];
    const p = movimientoDeDeuda(S, S.deudas[0]!, { id: 'x', tipo: 'prestamo', monto: c(10000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY);
    const h = movimientoDeDeuda(S, S.deudas[1]!, { id: 'y', tipo: 'pago', monto: c(50000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY);
    if (!p.ok || !h.ok) throw new Error('no guardó');
    expect(h.datos.mov).toMatchObject({ interes: 0, capital: 50000 });
    S.movs.push(p.datos.mov, h.datos.mov);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(50000);
    expect(saldoDeuda(S, S.deudas[1]!)).toBe(100000);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(65000 - 10000 - 50000);
  });

  it('DEU-04 fin del préstamo: termina en octubre de 2028, en 24 cuotas, con Bs 2.744 de interés', () => {
    const S = base();
    S.deudas = [prestamo()];
    const P = infoPrestamo(S, S.deudas[0]!, HOY);
    expect(P.cuotas).toBe(24);
    expect(P.fin).toBe('2028-10');
    expect(P.interes).toBe(274430);
    expect(mostrar(P.interes)).toBe('Bs 2.744');
    expect(P.crece).toBe(false);
  });

  it('DEU-04 si la cuota no cubre el interés, la deuda crece', () => {
    const a = amortizar(c(1000000), 24, c(15000));
    expect(a.crece).toBe(true);
    expect(a.filas).toEqual([]);
    const S = base();
    S.deudas = [prestamo({ saldoInicial: c(1000000), interes: 24, cuota: c(15000) })];
    expect(infoPrestamo(S, S.deudas[0]!, HOY).fin).toBeNull();
  });

  it('DEU-05 próximas tres cuotas: 21467 / 68533 / 1771467, 20667 / 69333 / 1702134 y 19858 / 70142 / 1631992', () => {
    const filas = amortizar(c(1840000), 14, c(90000)).filas.slice(0, 3).map((f) => [f.interes, f.capital, f.saldo]);
    expect(filas).toEqual([[21467, 68533, 1771467], [20667, 69333, 1702134], [19858, 70142, 1631992]]);
  });

  it('DEU-05 la tabla empieza el mes siguiente si la cuota de este mes ya se pagó', () => {
    const S = base();
    S.deudas = [prestamo()];
    expect(infoPrestamo(S, S.deudas[0]!, HOY).desde).toBe('2026-11');
    S.movs = [{ id: 'p', tipo: 'pago', deudaId: 'pr', cuentaId: 'bn', monto: c(90000), interes: c(21467), capital: c(68533), fecha: '2026-11-02' }];
    const P = infoPrestamo(S, S.deudas[0]!, HOY);
    expect(P.desde).toBe('2026-12');
    expect(P.filas[0]).toMatchObject({ interes: 20667, saldo: 1702134 });
  });

  it('DEU-06 una deuda en dólares solo se paga con Dólares, que baja US$ 100, y el patrimonio no cambia', () => {
    const S = base();
    S.deudas = [{ id: 'du', tipo: 'persona', nombre: 'Primo', moneda: 'USD', saldoInicial: c(10000) }];
    expect(cuentasPara(S, 'USD').map((x) => x.id)).toEqual(['us']);
    const d = S.deudas[0]!, antes = patrimonio(S).total;
    expect(movimientoDeDeuda(S, d, { id: 'x', tipo: 'pago', monto: c(10000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY))
      .toEqual({ ok: false, codigo: 'otra-moneda' });
    const r = movimientoDeDeuda(S, d, { id: 'x', tipo: 'pago', monto: c(10000), cuentaId: 'us', fecha: HOY, nota: '' }, HOY);
    if (!r.ok) throw new Error(r.codigo);
    S.movs.push(r.datos.mov);
    expect(saldoCuenta(S, S.cuentas[2]!)).toBe(110000);
    expect(saldoDeuda(S, d)).toBe(0);
    expect(patrimonio(S).total).toBe(antes);
    // @ts-expect-error: a debt in dollars does not mix with bolivianos
    restarMontos(monto(c(10000), 'USD'), monto(c(10000), 'BOB'));
  });

  it('DEU-07 el banco desembolsa 5000 a Banco: el préstamo queda en 5000, el patrimonio no cambia y no es ingreso', () => {
    const S = base(), antes = patrimonio(S).total;
    const n = crearDeuda({ deuda: prestamo({ id: 'nuevo', saldoInicial: c(500000) }), cuentaMov: 'bn', idMov: 'r' }, HOY);
    expect(n.deuda.saldoInicial).toBe(0);
    expect(n.deuda.desde).toBe(HOY);
    expect(n.mov).toMatchObject({ id: 'r', tipo: 'recibido', cuentaId: 'bn', monto: 500000, fecha: HOY });
    S.deudas.push(n.deuda);
    S.movs.push(n.mov!);
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(855000);
    expect(saldoDeuda(S, n.deuda)).toBe(500000);
    expect(patrimonio(S).total).toBe(antes);
    expect(resumenMes(S, '2026-11').entro).toBe(0);
    const te = crearDeuda({ deuda: amigo({ id: 'pt', saldoInicial: c(20000) }), cuentaMov: 'ef' }, HOY);
    expect(te.mov).toMatchObject({ tipo: 'prestamo', monto: 20000 });
  });

  it('DEU-08 saltar noviembre: el saldo pasa a 10200 y el Desglose suma 200 en Intereses', () => {
    const S = conFijos(base(), [{ nombre: 'Cuota', tipo: 'gasto', monto: c(50000), categoriaId: 'intereses', dia: 5, deudaId: 'pr' }]);
    S.deudas = [prestamo({ saldoInicial: c(1000000), interes: 24, cuota: c(50000), dia: 5 })];
    const r = saltarFijo(S, 'f0', '2026-11');
    expect(r.mov).toMatchObject({ id: 'i_f0_2026-11', tipo: 'interes', monto: 20000, fecha: '2026-11-05' });
    expect(r.ocurrencia).toMatchObject({ estado: 'saltado', movId: 'i_f0_2026-11' });
    S.movs.push(r.mov!);
    S.ocurrencias.push(r.ocurrencia);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1020000);
    expect(resumenMes(S, '2026-11').cats.intereses).toBe(20000);
    expect(pendientes(S, HOY)).toEqual([]);
    // borrar el interés devuelve la cuota a «por confirmar»
    expect(ocurrenciasDe(S, 'i_f0_2026-11').map((o) => o.id)).toEqual(['f0_2026-11']);
    S.ocurrencias = [];
    S.movs = [];
    expect(pendientes(S, HOY).map((p) => p.fijo.id)).toEqual(['f0']);
  });

  it('DEU-09 archivar «te deben» de 400 sin cobrarlo: cierre de 400, el patrimonio baja 400 y el Desglose lo muestra', () => {
    const S = conFijos(base(), []);
    S.deudas = [amigo()];
    const antes = patrimonio(S).total;
    const r = cerrarDeuda(S, S.deudas[0]!, HOY, 'ci');
    expect(r.mov).toMatchObject({ tipo: 'cierre', monto: 40000, deudaId: 'am', fecha: HOY });
    S.movs.push(r.mov!);
    S.deudas = [r.deuda];
    expect(saldoDeuda(S, r.deuda)).toBe(0);
    expect(patrimonio(S).total).toBe(antes - 40000);
    expect(resumenMes(S, '2026-11').cierres).toBe(-40000);
    // una deuda propia cerrada sube el patrimonio; una en cero no deja cierre y sus cuotas se apagan
    S.deudas = [prestamo({ saldoInicial: c(0) })];
    S.fijos = [{ id: 'fc', nombre: 'Cuota', tipo: 'gasto', monto: c(90000), cuentaId: 'bn', categoriaId: 'intereses', dia: 20, deudaId: 'pr', activo: true }];
    const z = cerrarDeuda(S, S.deudas[0]!, HOY, 'z');
    expect(z.mov).toBeNull();
    expect(z.fijos).toMatchObject([{ id: 'fc', activo: false }]);
    S.deudas = [{ id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000) }];
    S.movs = [cerrarDeuda(S, S.deudas[0]!, HOY, 'h').mov!];
    expect(resumenMes(S, '2026-11').cierres).toBe(150000);
  });

  it('DEU-10 la deuda con una persona es de 300 y escribe 350: el máximo es 300 y no guarda', () => {
    const S = base();
    S.deudas = [{ id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(30000) }, prestamo(), amigo()];
    const he = S.deudas[0]!;
    expect(movimientoDeDeuda(S, he, { id: 'x', tipo: 'pago', monto: c(35000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY))
      .toEqual({ ok: false, codigo: 'mas-que-el-maximo', maximo: 30000 });
    expect(movimientoDeDeuda(S, he, { id: 'x', tipo: 'pago', monto: c(30000), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY).ok).toBe(true);
    expect(maximoDe(S, S.deudas[1]!, 'pago')).toBe(1840000 + 21467);
    expect(movimientoDeDeuda(S, S.deudas[1]!, { id: 'x', tipo: 'pago', monto: c(1861468), cuentaId: 'bn', fecha: HOY, nota: '' }, HOY).ok).toBe(false);
    expect(movimientoDeDeuda(S, S.deudas[2]!, { id: 'x', tipo: 'cobro', monto: c(40001), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY).ok).toBe(false);
    expect(maximoDe(S, S.deudas[2]!, 'prestamo')).toBeNull();
    expect(movimientoDeDeuda(S, he, { id: 'x', tipo: 'pago', monto: c(0), cuentaId: 'ef', fecha: HOY, nota: '' }, HOY))
      .toEqual({ ok: false, codigo: 'falta-monto' });
    expect(montoSugerido(S, S.deudas[1]!, 'pago')).toBe(90000);
    expect(montoSugerido(S, he, 'pago')).toBe(30000);
    expect(montoSugerido(S, he, 'recibido')).toBe(0);
  });

  it('DEU-11 la mitad de la cena: gasto 150, préstamo dado de 150, Amigo debe 550, Efectivo igual, patrimonio +150', () => {
    const S = base();
    S.deudas = [amigo()];
    S.movs = [cena()];
    const ef0 = saldoCuenta(S, S.cuentas[0]!), p0 = patrimonio(S).total, c0 = gastoMesCat(S, '2026-11').comida;
    const r = separarGasto(S, S.movs[0]!, c(15000), 'am', ids);
    expect(r.ok && r.datos.queda).toBe(15000);
    aplicar(S, r);
    const g = S.movs.find((m) => m.id === 'g')!, p = S.movs.find((m) => m.tipo === 'prestamo')!;
    expect(g).toMatchObject({ tipo: 'gasto', monto: 15000 });
    expect(p).toMatchObject({ id: 'p', monto: 15000, fecha: '2026-11-05', cuentaId: 'ef', deGastoId: 'g', categoriaId: 'comida', nota: 'Cena' });
    expect(g.monto + p.monto).toBe(30000);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(55000);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(ef0);
    expect(patrimonio(S).total).toBe(p0 + 15000);
    expect(gastoMesCat(S, '2026-11').comida).toBe(c0! - 15000);
  });

  it('DEU-11 todo el gasto: el mismo movimiento es un préstamo dado de 300 y Amigo debe 700', () => {
    const S = base();
    S.deudas = [amigo()];
    S.movs = [cena()];
    const ef0 = saldoCuenta(S, S.cuentas[0]!);
    aplicar(S, separarGasto(S, S.movs[0]!, c(30000), 'am', ids));
    expect(S.movs).toHaveLength(1);
    expect(S.movs[0]).toMatchObject({ id: 'g', tipo: 'prestamo', deudaId: 'am', deGastoId: 'g' });
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(70000);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(ef0);
    expect(resumenMes(S, '2026-11').salio).toBe(0);
  });

  it('DEU-11 gasto de un fijo: la renta de 2500 confirmada, entera a Compañero; el fijo sigue confirmado', () => {
    const S = conFijos(base(), [{ nombre: 'Renta', tipo: 'gasto', monto: c(250000), categoriaId: 'casa', dia: 5 }]);
    S.deudas = [amigo({ id: 'co', nombre: 'Compañero', saldoInicial: c(0) })];
    const conf = confirmarFijo(S, 'f0', '2026-11', c(250000))!;
    S.movs.push(conf.mov);
    S.ocurrencias.push(conf.ocurrencia);
    aplicar(S, separarGasto(S, S.movs[0]!, c(250000), 'co', ids));
    expect(S.movs[0]).toMatchObject({ tipo: 'prestamo', fijoId: 'f0', mes: '2026-11' });
    expect(S.ocurrencias[0]!.movId).toBe(S.movs[0]!.id);
    expect(pendientes(S, HOY)).toEqual([]);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(250000);
  });

  it('DEU-11 persona nueva: Prima, que no tenía deuda, debe 150 de un gasto del 5 de noviembre', () => {
    const S = base();
    S.movs = [cena()];
    const r = separarGasto(S, S.movs[0]!, c(15000), { nombre: ' Prima ' }, ids);
    if (!r.ok) throw new Error(r.codigo);
    expect(r.datos.deuda).toMatchObject({ id: 'nueva', nombre: 'Prima', tipo: 'teDeben', moneda: 'BOB', saldoInicial: 0, desde: '2026-11-05' });
    aplicar(S, r);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(15000);
    expect(separarGasto(S, cena(), c(5000), { nombre: '' }, ids)).toEqual({ ok: false, codigo: 'falta-nombre' });
  });

  it('DEU-11 más que el gasto: el máximo es Bs 300 y no guarda; tampoco cero ni un ingreso', () => {
    const S = base();
    S.deudas = [amigo()];
    S.movs = [cena()];
    const r = separarGasto(S, S.movs[0]!, c(35000), 'am', ids);
    expect(r).toEqual({ ok: false, codigo: 'mas-que-el-gasto', maximo: 30000 });
    expect(mostrar(30000, 2)).toBe('Bs 300,00');
    expect(separarGasto(S, S.movs[0]!, c(0), 'am', ids).ok).toBe(false);
    expect(separarGasto(S, cena({ tipo: 'ingreso' }), c(10000), 'am', ids)).toEqual({ ok: false, codigo: 'no-es-gasto' });
    expect(separarGasto(S, cena(), c(10000), 'nadie', ids)).toEqual({ ok: false, codigo: 'falta-quien' });
  });

  it('DEU-11 gasto en dólares: solo «te deben» en US$, Amigo US$ sube US$ 20 y el Desglose baja Bs 250', () => {
    const S = base();
    S.deudas = [amigo(), amigo({ id: 'au', nombre: 'Amigo US$', moneda: 'USD', saldoInicial: c(0) })];
    S.movs = [cena({ cuentaId: 'us', monto: c(2000), tc: 12.5 })];
    expect(teDebenPara(S, S.movs[0]!).map((d) => d.id)).toEqual(['au']);
    expect(separarGasto(S, S.movs[0]!, c(2000), 'am', ids).ok).toBe(false);
    S.aj.tc = 14;
    const antes = resumenMes(S, '2026-11').salio;
    aplicar(S, separarGasto(S, S.movs[0]!, c(2000), 'au', ids));
    expect(saldoDeuda(S, S.deudas[1]!)).toBe(2000);
    expect(S.movs[0]!.tc).toBe(12.5);
    expect(antes - resumenMes(S, '2026-11').salio).toBe(25000);
    expect(mostrarEn(saldoDeuda(S, S.deudas[1]!), 'USD')).toBe('US$ 20');
    const S2 = base();
    S2.deudas = [amigo({ id: 'au', moneda: 'USD', saldoInicial: c(0) })];
    S2.movs = [cena({ cuentaId: 'us', monto: c(2000), tc: 12.5 })];
    aplicar(S2, separarGasto(S2, S2.movs[0]!, c(500), 'au', ids));
    expect(S2.movs[1]!.tc).toBe(12.5);
  });

  it('DEU-11 un «te deben» abierto después del gasto no se ofrece', () => {
    const S = base();
    S.deudas = [amigo({ desde: '2026-11-10' }), amigo({ id: 'a2', desde: '2026-11-05' })];
    S.movs = [cena()];
    expect(teDebenPara(S, S.movs[0]!).map((d) => d.id)).toEqual(['a2']);
    expect(separarGasto(S, S.movs[0]!, c(10000), 'am', ids).ok).toBe(false);
  });

  it('DEU-12 devolver la mitad: el gasto vuelve a 300, el préstamo ya no está y Amigo debe 400', () => {
    const S = base();
    S.deudas = [amigo()];
    S.movs = [cena()];
    const ef0 = saldoCuenta(S, S.cuentas[0]!);
    aplicar(S, separarGasto(S, S.movs[0]!, c(15000), 'am', ids));
    devolver(S, devolverAlGasto(S, S.movs.find((m) => m.tipo === 'prestamo')!));
    expect(S.movs).toHaveLength(1);
    expect(S.movs[0]).toMatchObject({ tipo: 'gasto', monto: 30000 });
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(40000);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(ef0);
  });

  it('DEU-12 devolver un gasto entero: vuelve a ser un gasto de 300 en Comida fuera y Amigo baja 300', () => {
    const S = base();
    S.deudas = [amigo()];
    S.movs = [cena()];
    const ef0 = saldoCuenta(S, S.cuentas[0]!);
    aplicar(S, separarGasto(S, S.movs[0]!, c(30000), 'am', ids));
    devolver(S, devolverAlGasto(S, S.movs[0]!));
    const g = S.movs[0]!;
    expect(g).toMatchObject({ tipo: 'gasto', monto: 30000, categoriaId: 'comida' });
    expect(g.deudaId).toBeUndefined();
    expect(g.deGastoId).toBeUndefined();
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(40000);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(ef0);
    expect(devolverAlGasto(S, g)).toBeNull();
  });

  it('DEU-12 devolver una parte cuando el resto ya se volvió deuda', () => {
    const S = base();
    S.deudas = [amigo(), amigo({ id: 'a2', nombre: 'Otro', saldoInicial: c(0) })];
    S.movs = [cena()];
    const ef0 = saldoCuenta(S, S.cuentas[0]!);
    aplicar(S, separarGasto(S, S.movs[0]!, c(10000), 'am', ids));
    aplicar(S, separarGasto(S, S.movs[0]!, c(20000), 'a2', { deuda: 'x', prestamo: 'p2' }));
    devolver(S, devolverAlGasto(S, S.movs.find((m) => m.id === 'p')!));
    expect(S.movs.find((m) => m.id === 'p')).toMatchObject({ tipo: 'gasto', monto: 10000, categoriaId: 'comida' });
    expect(S.movs.find((m) => m.id === 'g')).toMatchObject({ tipo: 'prestamo', monto: 20000, deudaId: 'a2' });
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(ef0);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(40000);
    expect(saldoDeuda(S, S.deudas[1]!)).toBe(20000);
    expect(interesDelMes(c(0), 14)).toBe(0);
  });
});
