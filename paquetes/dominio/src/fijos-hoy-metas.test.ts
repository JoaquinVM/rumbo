import { describe, expect, it } from 'vitest';
import { base, conFijos, escenarioHoy, HOY, prestamo, vacio } from './base.prueba';
import { resumenMes } from './desglose';
import { crearDeuda, movimientoDeDeuda } from './deudas';
import { centavos as c, mostrar } from './dinero';
import { fechaFijo } from './fechas';
import { confirmarFijo, pendientes, primerMesDeCuota, saltarFijo } from './fijos';
import { calcHoy } from './hoy';
import { apartar, archivarMeta, estadoMetas, infoMeta } from './metas';
import type { Estado } from './modelo';
import { rumbo } from './proyeccion';
import { gastoMesCat } from './movimientos';
import { apartadoCuenta, saldoCuenta, saldoDeuda } from './saldos';

const confirmar = (S: Estado, fijoId: string, mes: string, monto: number): void => {
  const r = confirmarFijo(S, fijoId, mes, c(monto));
  if (!r) throw new Error('ya estaba');
  S.movs.push(r.mov);
  S.ocurrencias.push(r.ocurrencia);
};

describe('fijos', () => {
  it('FIJ-01 un fijo del día 31 en febrero de 2027 cae el 28', () => {
    expect(fechaFijo(31, '2027-02')).toBe('2027-02-28');
    expect(fechaFijo(31, '2028-02')).toBe('2028-02-29');
    expect(fechaFijo(5, '2026-11')).toBe('2026-11-05');
  });

  it('FIJ-02 confirmar la Luz de 180 por 195: gasto de 195 en Banco en Casa y sale de Por confirmar', () => {
    const S = escenarioHoy();
    expect(pendientes(S, HOY).map((p) => p.fijo.nombre)).toEqual(['Luz']);
    confirmar(S, 'f1', '2026-11', 19500);
    expect(S.movs[0]).toMatchObject({ id: 'm_f1_2026-11', tipo: 'gasto', monto: 19500, cuentaId: 'bn', categoriaId: 'casa', fecha: '2026-11-08', fijoId: 'f1', mes: '2026-11' });
    expect(pendientes(S, HOY)).toEqual([]);
    expect(confirmarFijo(S, 'f1', '2026-11', c(18000))).toBeNull();
  });

  it('FIJ-02 saltar el Streaming de 60: no se crea ningún movimiento y sale hasta el mes siguiente', () => {
    const S = escenarioHoy();
    const r = saltarFijo(S, 'f2', '2026-11');
    expect(r.mov).toBeNull();
    expect(r.ocurrencia).toEqual({ id: 'f2_2026-11', fijoId: 'f2', mes: '2026-11', estado: 'saltado', movId: null });
    S.ocurrencias.push(r.ocurrencia);
    expect(pendientes(S, '2026-11-20').map((p) => p.fijo.id)).not.toContain('f2');
    expect(pendientes(S, '2026-12-12').map((p) => `${p.fijo.id}_${p.mes}`)).toContain('f2_2026-12');
  });

  it('FIJ-02 dos pestañas que confirman el mismo mes escriben el mismo movimiento', () => {
    const S = escenarioHoy();
    const a = confirmarFijo(S, 'f1', '2026-11', c(18000))!, b = confirmarFijo(S, 'f1', '2026-11', c(18000))!;
    expect(a.mov.id).toBe(b.mov.id);
  });

  it('FIJ-04 confirmar la cuota de 900 registra un pago: 214,67 de interés, 685,33 de capital y el préstamo baja a 17714,67', () => {
    const S = base();
    S.deudas = [prestamo()];
    S.fijos = [{ id: 'fc', nombre: 'Cuota', tipo: 'gasto', monto: c(90000), cuentaId: 'bn', categoriaId: 'intereses', dia: 20, deudaId: 'pr', desde: '2026-11', activo: true }];
    confirmar(S, 'fc', '2026-11', 90000);
    expect(S.movs[0]).toMatchObject({ tipo: 'pago', deudaId: 'pr', interes: 21467, capital: 68533, monto: 90000 });
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1771467);
    expect(gastoMesCat(S, '2026-11').intereses).toBe(21467);
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(355000 - 90000);
  });

  it('FIJ-05 la Renta de 2500 vencida y sin confirmar no baja el Banco ni entra al Desglose', () => {
    const S = conFijos(base(), [{ nombre: 'Renta', tipo: 'gasto', monto: c(250000), categoriaId: 'casa', dia: 5 }]);
    expect(pendientes(S, HOY)).toHaveLength(1);
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(355000);
    expect(resumenMes(S, '2026-11').salio).toBe(0);
  });

  it('FIJ-06 pagar en el banco la cuota del 5 por confirmar: deja de estar por confirmar y Hoy no la vuelve a restar', () => {
    const S = conFijos(base(), [{ nombre: 'Cuota', tipo: 'gasto', monto: c(90000), categoriaId: 'intereses', dia: 5, deudaId: 'pr' }]);
    S.deudas = [prestamo({ dia: 5 })];
    const antes = calcHoy(S, HOY);
    expect(antes.compBs).toBe(90000);
    const r = movimientoDeDeuda(S, S.deudas[0]!, { id: 'pg', tipo: 'pago', monto: c(90000), cuentaId: 'bn', fecha: HOY, nota: '' }, HOY);
    if (!r.ok) throw new Error(r.codigo);
    expect(r.datos.mov).toMatchObject({ fijoId: 'f0', mes: '2026-11' });
    expect(r.datos.ocurrencia).toEqual({ id: 'f0_2026-11', fijoId: 'f0', mes: '2026-11', estado: 'confirmado', movId: 'pg' });
    S.movs.push(r.datos.mov);
    S.ocurrencias.push(r.datos.ocurrencia!);
    expect(pendientes(S, HOY)).toEqual([]);
    const despues = calcHoy(S, HOY);
    expect(despues.compBs).toBe(0);
    expect(despues.libre).toBe(antes.libre); // the bank went down 900 and stopped owing 900
    // the month already settled: a second payment is not a payment item
    const otra = movimientoDeDeuda(S, S.deudas[0]!, { id: 'p2', tipo: 'pago', monto: c(10000), cuentaId: 'bn', fecha: HOY, nota: '' }, HOY);
    expect(otra.ok && otra.datos.ocurrencia).toBeNull();
  });

  it('FIJ-07 préstamo creado el 12 de noviembre con cuota el 5: la primera cuota por confirmar es la del 5 de diciembre', () => {
    expect(primerMesDeCuota(5, '2026-11-12')).toBe('2026-12');
    expect(primerMesDeCuota(12, '2026-11-12')).toBe('2026-11');
    const n = crearDeuda({ deuda: prestamo({ id: 'n', dia: 5 }), cuentaFijo: 'bn', idFijo: 'fc' }, '2026-11-12');
    expect(n.fijo).toMatchObject({ id: 'fc', monto: 90000, desde: '2026-12', deudaId: 'n', categoriaId: 'intereses', dia: 5 });
    const S = base();
    S.deudas = [n.deuda];
    S.fijos = [n.fijo!];
    expect(pendientes(S, '2026-11-12')).toEqual([]);
    expect(pendientes(S, '2026-12-05').map((p) => p.fecha)).toEqual(['2026-12-05']);
  });
});

describe('hoy', () => {
  it('HOY-01 dos cuentas del día a día: disponible 4200', () => {
    const S = base();
    expect(calcHoy(S, HOY).disp).toBe(420000);
  });

  it('HOY-01 con 500 apartados en Banco el disponible es 3700', () => {
    const S = base();
    S.apartados = [{ id: 'a', metaId: 'x', cuentaId: 'bn', monto: c(50000), fecha: '2026-11-02' }];
    expect(calcHoy(S, HOY).disp).toBe(370000);
  });

  it('HOY-02 libre calculado: 4200 − 180 − 60 − 200 − 900 − 500 = 2360', () => {
    const H = calcHoy(escenarioHoy(), HOY);
    expect(H.compBs).toBe(134000);
    expect(H.metas).toBe(50000);
    expect(H.libre).toBe(236000);
    expect(H.prox?.fecha).toBe('2026-11-25');
  });

  it('HOY-02 un fijo de una cuenta que no es del día a día no resta del libre', () => {
    const S = conFijos(base(), [{ nombre: 'Curso', tipo: 'gasto', monto: c(5000), categoriaId: 'educacion', dia: 20, cuentaId: 'us' }]);
    expect(calcHoy(S, HOY).compBs).toBe(0);
  });

  it('HOY-03 libre 2360, hoy 10 y sueldo el 25: Bs 157 al día por 15 días', () => {
    const H = calcHoy(escenarioHoy(), HOY);
    expect(H.dias).toBe(15);
    expect(mostrar(H.alDia)).toBe('Bs 157');
  });

  it('HOY-03 sin ingresos fijos, libre 600 el 25 de un mes de 30 días: Bs 100 al día por 6 días', () => {
    const S = vacio();
    S.cuentas = [{ id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: c(60000), diaADia: true }];
    const H = calcHoy(S, '2026-11-25');
    expect(H.dias).toBe(6);
    expect(H.alDia).toBe(10000);
    expect(mostrar(H.alDia)).toBe('Bs 100');
  });

  it('HOY-04 un ingreso de 1200 en Banco sube el libre de 2360 a 3560', () => {
    const S = escenarioHoy();
    S.movs.push({ id: 'n', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: c(120000), fecha: HOY });
    expect(calcHoy(S, HOY).libre).toBe(356000);
  });

  it('HOY-05 libre negativo: −Bs 300 y «te pasaste Bs 300 de lo disponible»', () => {
    const S = escenarioHoy();
    S.movs.push({ id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'compras', monto: c(266000), fecha: HOY });
    const H = calcHoy(S, HOY);
    expect(H.libre).toBe(-30000);
    expect(mostrar(H.libre)).toBe('−Bs 300');
    expect(mostrar(-H.libre)).toBe('Bs 300');
  });
});

describe('metas', () => {
  it('MET-01 Fondo de emergencia de Bs 15.000 para diciembre de 2027: Bs 0 de Bs 15.000', () => {
    const S = base();
    S.metas = [{ id: 'fo', nombre: 'Fondo de emergencia', monto: c(1500000), mes: '2027-12' }];
    const I = infoMeta(S, S.metas[0]!, HOY);
    expect(I.ap).toBe(0);
    expect(`${mostrar(I.ap)} de ${mostrar(S.metas[0]!.monto)}`).toBe('Bs 0 de Bs 15.000');
    const a = archivarMeta({ ...S, apartados: [{ id: 'x', metaId: 'fo', cuentaId: 'bn', monto: c(100), fecha: HOY }] }, S.metas[0]!);
    expect(a).toEqual({ meta: { ...S.metas[0], archivada: true }, borrarApartados: ['x'] });
  });

  it('MET-02 apartar US$ 320 de Dólares con el tipo en 12,50: la meta lleva Bs 4.000 y Dólares sigue en US$ 1.200', () => {
    const S = base();
    S.metas = [{ id: 'fo', nombre: 'Fondo', monto: c(1500000), mes: '2027-12' }];
    const r = apartar(S, 'fo', 'us', c(32000), 1, HOY, 'a');
    if (!r.ok) throw new Error(r.codigo);
    S.apartados.push(r.datos);
    expect(infoMeta(S, S.metas[0]!, HOY).ap).toBe(400000);
    expect(saldoCuenta(S, S.cuentas[2]!)).toBe(120000);
    expect(apartadoCuenta(S, 'us')).toBe(32000);
  });

  it('MET-02 Efectivo tiene 650 y se intenta apartar 800: no se permite y dice cuánto se puede', () => {
    const S = base();
    S.metas = [{ id: 'fo', nombre: 'Fondo', monto: c(1500000), mes: '2027-12' }];
    expect(apartar(S, 'fo', 'ef', c(80000), 1, HOY, 'a')).toEqual({ ok: false, codigo: 'mas-que-el-libre', maximo: 65000 });
    expect(apartar(S, 'fo', 'ef', c(65000), 1, HOY, 'a').ok).toBe(true);
    S.apartados = [{ id: 'a', metaId: 'fo', cuentaId: 'ef', monto: c(65000), fecha: HOY }];
    expect(apartar(S, 'fo', 'ef', c(1), 1, HOY, 'b')).toEqual({ ok: false, codigo: 'mas-que-el-libre', maximo: 0 });
    expect(apartar(S, 'fo', 'ef', c(65001), -1, HOY, 'b')).toEqual({ ok: false, codigo: 'mas-que-lo-apartado', maximo: 65000 });
    const d = apartar(S, 'fo', 'ef', c(20000), -1, HOY, 'b');
    expect(d.ok && d.datos.monto).toBe(-20000);
  });

  it('MET-03 Fondo de Bs 15.000 para dic 2027 con Bs 4.000, Bs 546 de este mes: aporte Bs 846 y falta Bs 300', () => {
    const S = base();
    S.metas = [{ id: 'fo', nombre: 'Fondo', monto: c(1500000), mes: '2027-12' }];
    S.apartados = [
      { id: 'a', metaId: 'fo', cuentaId: 'bn', monto: c(345400), fecha: '2026-10-01' },
      { id: 'b', metaId: 'fo', cuentaId: 'bn', monto: c(54600), fecha: '2026-11-02' },
    ];
    const I = infoMeta(S, S.metas[0]!, HOY);
    expect(I.meses).toBe(13);
    expect(I.aporte).toBe(84615); // 1.100.000 ÷ 13 = 84615,38
    expect(I.falta).toBe(30015);
    expect(mostrar(I.aporte)).toBe('Bs 846');
    expect(mostrar(I.falta)).toBe('Bs 300');
  });

  it('MET-04 la meta Viaje para julio de 2027 se marca en la gráfica en su fecha', () => {
    const S = base();
    S.metas = [{ id: 'vi', nombre: 'Viaje', monto: c(900000), mes: '2027-07' }];
    expect(rumbo(S, HOY, 1).metas).toEqual([{ metaId: 'vi', nombre: 'Viaje', mes: '2027-07', indice: 8 }]);
  });

  it('MET-05 neto 2060 y metas que piden 846 + 975 = 1821: vas bien', () => {
    const S = conFijos(base(), [{ nombre: 'Sueldo', tipo: 'ingreso', monto: c(206000), categoriaId: 'sueldo', dia: 25 }]);
    S.metas = [{ id: 'a', nombre: 'A', monto: c(84600 * 13), mes: '2027-12' }, { id: 'b', nombre: 'B', monto: c(97500 * 8), mes: '2027-07' }];
    const E = estadoMetas(S, HOY);
    expect(E.pide).toBe(182100);
    expect(E.vasBien).toBe(true);
  });

  it('MET-05 neto 1500 y metas que piden 1821: no alcanza, faltan Bs 321 al mes', () => {
    const S = conFijos(base(), [{ nombre: 'Sueldo', tipo: 'ingreso', monto: c(150000), categoriaId: 'sueldo', dia: 25 }]);
    S.metas = [{ id: 'a', nombre: 'A', monto: c(84600 * 13), mes: '2027-12' }, { id: 'b', nombre: 'B', monto: c(97500 * 8), mes: '2027-07' }];
    const E = estadoMetas(S, HOY);
    expect(E.vasBien).toBe(false);
    expect(E.faltaMes).toBe(32100);
    expect(mostrar(E.faltaMes)).toBe('Bs 321');
  });
});
