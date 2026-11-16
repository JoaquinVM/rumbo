import { describe, expect, it } from 'vitest';
import { base, conFijos, escenarioHoy, HOY, prestamo, vacio } from './base.prueba';
import { centavos as c, mostrar, mostrarUsd } from './dinero';
import { calcHoy, alDiaCon } from './hoy';
import { infoPrestamo } from './prestamos';
import { paraRecortar, proyectar, rumbo, ySi } from './proyeccion';
import { promedioIrregular, ritmo } from './ritmo';

describe('ritmo y proyección', () => {
  it('AJU-01 ingresos variables de 1500, 2200 y 1520: «Tu promedio real de los últimos 3 meses: Bs 1.740»', () => {
    const S = base();
    S.movs = [150000, 220000, 152000].map((v, i) => ({ id: 'i' + i, tipo: 'ingreso' as const, cuentaId: 'bn', categoriaId: 'negocio', monto: c(v), fecha: ['2026-08-20', '2026-09-20', '2026-10-20'][i]! }));
    S.movs.push({ id: 'f', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'sueldo', monto: c(800000), fecha: '2026-10-25', fijoId: 'x', mes: '2026-10' });
    expect(promedioIrregular(S, HOY)).toBeCloseTo(174000, 9);
    expect(mostrar(promedioIrregular(S, HOY))).toBe('Bs 1.740');
  });

  it('PRO-01 a 5 años: «A este ritmo, en 5 años tendrás …» y la gráfica cubre 60 meses', () => {
    const S = conFijos(base(), [{ nombre: 'Sueldo', tipo: 'ingreso', monto: c(100000), categoriaId: 'sueldo', dia: 25 }]);
    const R = rumbo(S, HOY, 5);
    expect(R.meses).toBe(60);
    expect(R.proyeccion.pts).toHaveLength(61);
    expect(R.final).toBeCloseTo(1920000 + 100000 * 60, 6);
    expect(R.seAcabaEn).toBeNull();
  });

  it('PRO-02 fijos de 10000 y 3000 y 1200 de comida en 2 meses: comida promedia unos 600 y el neto es unos 6400', () => {
    const S = conFijos(base(), [
      { nombre: 'Sueldo', tipo: 'ingreso', monto: c(1000000), categoriaId: 'sueldo', dia: 25 },
      { nombre: 'Renta', tipo: 'gasto', monto: c(300000), categoriaId: 'casa', dia: 5 },
    ]);
    S.movs = [
      { id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(60000), fecha: '2026-09-12' },
      { id: '2', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(60000), fecha: '2026-11-09' },
    ];
    const R = ritmo(S, HOY);
    expect(R.months).toBeCloseTo(60.5 / 30.44, 12); // from the first expense of the window: about 2 months
    expect(R.varCat.comida).toBeCloseTo(120000 / R.months, 9);
    expect(mostrar(R.varCat.comida!)).toBe('Bs 604');
    expect(R.neto).toBeCloseTo(700000 - 120000 / R.months, 9);
  });

  it('PRO-02 un gasto de hace 200 días no entra en el promedio; la ventana es de 90 días', () => {
    const S = base();
    S.movs = [
      { id: 'v', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(9999900), fecha: '2026-04-24' },
      { id: 'a', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'ocio', monto: c(100), fecha: '2026-08-12' }, // 90 days ago: out
      { id: 'b', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'super', monto: c(100), fecha: '2026-08-13' }, // 89 days ago: in
      { id: 'f', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'super', monto: c(100), fecha: '2026-11-11' }, // tomorrow: out
    ];
    const R = ritmo(S, HOY);
    expect(R.varCat.comida).toBeUndefined();
    expect(R.varCat.ocio).toBeUndefined();
    expect(R.varCat.super).toBeCloseTo(100 / R.months, 12);
    expect(R.months).toBe(Math.min(3, (89 + 1.5) / 30.44));
  });

  it('PRO-02 el irregular esperado de 1500 entra en vez del promedio real', () => {
    const S = base();
    S.aj.irregular = c(150000);
    S.movs = [{ id: '1', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: c(522000), fecha: '2026-10-20' }];
    expect(ritmo(S, HOY).ingreso).toBe(150000);
  });

  it('PRO-03 Banco 12000 al 12 % y Efectivo 1000 al 0 % con neto 0: el mes siguiente el patrimonio es 13120', () => {
    const S = vacio();
    S.aj.inflacion = 0;
    S.cuentas = [
      { id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(1200000), rendimiento: 12 },
      { id: 'e', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: c(100000), rendimiento: 0 },
    ];
    expect(proyectar(S, HOY, 1, { nominal: true }).pts[1]).toBeCloseTo(1312000, 6);
  });

  it('PRO-03 con patrimonio −5000 y neto 0 sigue en −5000 al cabo de 12 meses', () => {
    const S = vacio();
    S.cuentas = [{ id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(-500000), rendimiento: 12 }];
    expect(proyectar(S, HOY, 12, { nominal: true }).pts[12]).toBeCloseTo(-500000, 6);
  });

  it('PRO-04 el préstamo termina en octubre de 2028 con cuota de 900: la gráfica lo marca y desde ahí el neto sube 900', () => {
    const S = conFijos(base(), [{ nombre: 'Cuota', tipo: 'gasto', monto: c(90000), categoriaId: 'intereses', dia: 20, deudaId: 'pr' }]);
    S.deudas = [prestamo()];
    const R = rumbo(S, HOY, 5, true);
    expect(R.finesDePrestamos).toEqual([{ deudaId: 'pr', nombre: 'Préstamo del banco', fin: '2028-10' }]);
    const P = R.proyeccion, k = P.prest[0]!.fin!;
    expect(k).toBe(24);
    // while it runs, each month the payment leaves and only its interest is lost; once it ends, nothing leaves
    expect(P.nom[2]! - P.nom[1]!).toBeLessThan(-15000);
    expect(P.nom[k + 2]! - P.nom[k + 1]!).toBeCloseTo(0, 6);
  });

  it('PRO-04 un préstamo de 1800 sin interés con cuota 900 termina en el mes 2 y el patrimonio no cambia', () => {
    const S = vacio();
    S.cuentas = [{ id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(0) }];
    S.deudas = [{ id: 'p', tipo: 'prestamo', nombre: 'Préstamo', moneda: 'BOB', saldoInicial: c(180000), interes: 0, cuota: c(90000), dia: 20 }];
    S.fijos = [{ id: 'cu', nombre: 'Cuota', tipo: 'gasto', monto: c(90000), cuentaId: 'b', categoriaId: 'intereses', dia: 20, deudaId: 'p', desde: '2026-11', activo: true }];
    const P = proyectar(S, HOY, 4, { nominal: true });
    expect(P.prest[0]!.fin).toBe(2);
    P.pts.forEach((v) => expect(v).toBeCloseTo(-180000, 6));
  });

  it('PRO-05 la proyección nominal a 5 años es Bs 146.933 con 8 %: en plata de hoy Bs 100.000', () => {
    const S = vacio();
    S.aj.inflacion = 8;
    S.cuentas = [{ id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(14693280), rendimiento: 0 }];
    const R = rumbo(S, HOY, 5);
    expect(mostrar(R.final)).toBe('Bs 100.000');
    expect(mostrar(R.nominalFinal)).toBe('Bs 146.933');
    expect(mostrar(rumbo(S, HOY, 5, true).final)).toBe('Bs 146.933');
  });

  it('PRO-05 neto 1000 al mes sin cuentas ni rendimiento al 8 %: a 10 años cerca de Bs 83.400 en plata de hoy', () => {
    const S = conFijos(base(), [{ nombre: 'S', tipo: 'ingreso', monto: c(100000), categoriaId: 'sueldo', dia: 25 }]);
    S.cuentas = [{ id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(0), rendimiento: 0, diaADia: true }];
    S.aj.inflacion = 8;
    expect(Math.abs(proyectar(S, HOY, 120).pts[120]! - 8343200)).toBeLessThan(5000);
    // the loan payment does not follow inflation
    const S2 = conFijos(base(), [
      { nombre: 'S', tipo: 'ingreso', monto: c(300000), categoriaId: 'sueldo', dia: 25 },
      { nombre: 'Cuota', tipo: 'gasto', monto: c(100000), categoriaId: 'intereses', dia: 20, deudaId: 'pr' },
    ]);
    S2.cuentas = [{ id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(0), rendimiento: 0, diaADia: true }];
    S2.aj.inflacion = 8;
    S2.deudas = [prestamo({ saldoInicial: c(1200000), interes: 12, cuota: c(100000) })];
    expect(proyectar(S2, HOY, 1, { nominal: true }).nom[1]).toBeCloseTo(-1200000 + 300000 - 12000, 0);
  });

  it('PRO-06 con una cuenta en dólares y el tipo en 12,50: «Tipo de cambio fijo en Bs 12,50»', () => {
    const R = rumbo(base(), HOY, 1);
    expect(R.tcFijo).toBe(12.5);
    const S = vacio();
    expect(rumbo(S, HOY, 1).tcFijo).toBeNull();
  });

  it('PRO-07 tiene 1000 y el neto es −3000 al mes: «tus ahorros se acaban en» el mes siguiente', () => {
    const S = conFijos(vacio(), [{ nombre: 'Renta', tipo: 'gasto', monto: c(300000), categoriaId: 'casa', dia: 5, cuentaId: 'b' }]);
    S.aj.inflacion = 0;
    S.cuentas = [{ id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(100000), diaADia: true }];
    const R = rumbo(S, HOY, 1);
    expect(R.seAcabaEn).toBe('2026-12');
    expect(mostrar(R.netoNegativo)).toBe('Bs 3.000');
  });

  it('PRO-08 comida promedia 600 al mes, se recorta 50 % y se suman 1000 de ingreso extra: el neto ajustado sube 1300', () => {
    const S = base();
    S.movs = [{ id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(60000), fecha: '2026-11-09' }];
    const a = proyectar(S, HOY, 12), b = proyectar(S, HOY, 12, { recortes: { comida: 50 }, extra: 100000 });
    expect(b.neto - a.neto).toBeCloseTo(130000, 9);
    expect(paraRecortar(a.R).map(([k]) => k)).toEqual(['comida']);
    const y = ySi(S, HOY, 1, { recortes: { comida: 50 }, extra: 100000 });
    expect(y.netoAjustado - a.neto).toBeCloseTo(130000, 9);
    expect(y.diferencia).toBeCloseTo(130000 * 12, 6);
    expect(y.adelanto).toBeNull();
  });

  it('PRO-08 adelantar 300 al mes al préstamo de 18400: termina en marzo de 2028, 7 meses antes, Bs 753 menos de interés y el libre baja a Bs 137 al día', () => {
    const S = escenarioHoy();
    S.deudas = [prestamo()];
    const a = infoPrestamo(S, S.deudas[0]!, HOY), b = infoPrestamo(S, S.deudas[0]!, HOY, c(30000));
    expect(b.fin).toBe('2028-03');
    expect(a.cuotas - b.cuotas).toBe(7);
    expect(a.interes - b.interes).toBe(75342);
    const y = ySi(S, HOY, 5, { adelanto: 30000 });
    expect(y.adelanto).toMatchObject({ deudaId: 'pr', fin: '2028-03', mesesAntes: 7, interesAhorrado: 75342 });
    expect(mostrar(y.adelanto!.interesAhorrado)).toBe('Bs 753');
    const H = calcHoy(S, HOY);
    expect(H.libre).toBe(236000);
    expect(mostrar(alDiaCon(H, 30000))).toBe('Bs 137');
    expect(mostrar(y.adelanto!.alDia)).toBe('Bs 137');
    expect(mostrarUsd(y.final / 12.5)).toMatch(/^(−)?US\$ /);
  });
});
