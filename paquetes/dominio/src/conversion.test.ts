import { describe, expect, it } from 'vitest';
import { aCentavos, CAMPOS_DE_DINERO, centavosAV1, v1ACentavos, type DatosV1 } from './conversion';
import { calcHoy } from './hoy';
import type { Estado } from './modelo';
import { patrimonio } from './cuentas';
import { saldoCuenta, saldoDeuda } from './saldos';

// A v1 database with every money field, as the v1 keeps it (decimal amounts).
const datosV1 = (): DatosV1 => ({
  aj: { tc: 12.47, tcFecha: '2026-11-01', inflacion: 8, irregular: 1500.5, horas: 160, empezado: true, color: 'rosa' },
  cuentas: [
    { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550, rendimiento: 2, diaADia: true, archivada: false, desde: '2026-11-01' },
    { id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: 1200.37, rendimiento: 0, diaADia: false },
  ],
  categorias: [{ id: 'comida', nombre: 'Comida fuera', tipo: 'gasto', tope: 1000, color: '#E0703A', icono: 'comida', base: true }],
  movs: [
    { id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35.5, fecha: '2026-11-05', nota: 'Almuerzo' },
    { id: 't', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', monto: 1250, montoDestino: 100, tc: 12.5, fecha: '2026-11-06' },
    { id: 'p', tipo: 'pago', deudaId: 'pr', cuentaId: 'bn', monto: 900, interes: 214.67, capital: 685.33, fecha: '2026-11-07', fijoId: 'fc', mes: '2026-11' },
    { id: 'x', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 0.29, fecha: '2026-11-08', campoFuturo: { a: 1 } },
  ],
  fijos: [{ id: 'fc', nombre: 'Cuota', tipo: 'gasto', monto: 900, cuentaId: 'bn', categoriaId: 'intereses', dia: 20, deudaId: 'pr', desde: '2026-11', activo: true }],
  ocurrencias: [{ id: 'fc_2026-11', fijoId: 'fc', mes: '2026-11', estado: 'confirmado', movId: 'p' }],
  deudas: [
    { id: 'pr', tipo: 'prestamo', nombre: 'Préstamo', moneda: 'BOB', saldoInicial: 18400, interes: 14, cuota: 900, dia: 20 },
    { id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: 1500, interes: 0, fechaEsperada: null },
  ],
  metas: [{ id: 'fo', nombre: 'Fondo', monto: 15000, mes: '2027-12', archivada: false }],
  apartados: [{ id: 'a', metaId: 'fo', cuentaId: 'us', monto: -43.68, fecha: '2026-11-02' }],
});

describe('conversión de la v1 a centavos', () => {
  it('DAT-08 migrar los datos de Joaquín: Banco 355000, el gasto 3550, la cuota 90000 y la tasa sigue en 14', () => {
    const r = v1ACentavos({ ...datosV1(), movs: [{ id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35.5, fecha: '2026-11-05' }] });
    if (!r.ok) throw new Error('no convirtió');
    expect(r.datos.cuentas![0]!.saldoInicial).toBe(355000);
    expect(r.datos.movs![0]!.monto).toBe(3550);
    expect(r.datos.deudas![0]).toMatchObject({ cuota: 90000, saldoInicial: 1840000, interes: 14 });
  });

  it('DAT-08 cambian los 12 campos de dinero y nada más', () => {
    expect(Object.values(CAMPOS_DE_DINERO).flat()).toHaveLength(12);
    const v1 = datosV1(), r = v1ACentavos(v1);
    if (!r.ok) throw new Error('no convirtió');
    const d = r.datos;
    expect(d.aj).toEqual({ ...v1.aj, irregular: 150050 });
    expect(d.cuentas).toEqual([{ ...v1.cuentas![0], saldoInicial: 355000 }, { ...v1.cuentas![1], saldoInicial: 120037 }]);
    expect(d.categorias![0]).toEqual({ ...v1.categorias![0], tope: 100000 });
    expect(d.movs![0]).toEqual({ ...v1.movs![0], monto: 3550 });
    expect(d.movs![1]).toEqual({ ...v1.movs![1], monto: 125000, montoDestino: 10000 }); // tc is a rate
    expect(d.movs![2]).toEqual({ ...v1.movs![2], monto: 90000, interes: 21467, capital: 68533 });
    expect(d.movs![3]).toEqual({ ...v1.movs![3], monto: 29 }); // 0,29 × 100 is 28,999… in decimals: exact here
    expect(d.fijos![0]).toEqual({ ...v1.fijos![0], monto: 90000 });
    expect(d.ocurrencias).toEqual(v1.ocurrencias);
    expect(d.deudas).toEqual([{ ...v1.deudas![0], saldoInicial: 1840000, cuota: 90000 }, { ...v1.deudas![1], saldoInicial: 150000 }]);
    expect(d.metas![0]).toEqual({ ...v1.metas![0], monto: 1500000 });
    expect(d.apartados![0]).toEqual({ ...v1.apartados![0], monto: -4368 });
    expect(v1.cuentas![0]!.saldoInicial).toBe(3550); // the v1 data is not touched
  });

  it('DAT-08 el interés de una deuda es una tasa y no cambia', () => {
    const v1 = datosV1();
    (v1.deudas![0] as Record<string, unknown>).interes = 14.5;
    const r = v1ACentavos(v1);
    expect(r.ok && r.datos.deudas![0]!.interes).toBe(14.5);
  });

  it('DAT-08 un movimiento con monto 12,555 no deja convertir nada y se lista', () => {
    const v1 = datosV1();
    v1.movs!.push({ id: 'raro', tipo: 'gasto', cuentaId: 'bn', monto: 12.555, fecha: '2026-11-09' });
    (v1.deudas![1] as Record<string, unknown>).cuota = '15';
    const r = v1ACentavos(v1);
    expect(r).toEqual({
      ok: false,
      problemas: [
        { coleccion: 'movs', id: 'raro', campo: 'monto', valor: 12.555, motivo: 'mas-de-2-decimales' },
        { coleccion: 'deudas', id: 'he', campo: 'cuota', valor: '15', motivo: 'no-es-numero' },
      ],
    });
  });

  it('DAT-08 cuentas de centavos exactas: decimales comunes, negativos, ceros y montos grandes', () => {
    const casos: [number, number | null | undefined][] = [
      [3550, 355000], [35.5, 3550], [0.29, 29], [0.1, 10], [1.005, null], [-45, -4500], [-0, 0], [0, 0], [12.5, 1250],
      [1e-7, null], [1e21, undefined], [90071992547409.9, 9007199254740990], [90071992547409.92, undefined], [Number.NaN, undefined], [Infinity, undefined],
    ];
    for (const [v, esperado] of casos) expect(aCentavos(v), String(v)).toBe(esperado);
  });

  it('DAT-08 la vuelta a decimales es exacta (centavos ÷ 100) y la ida y vuelta da lo mismo', () => {
    const v1 = datosV1(), r = v1ACentavos(v1);
    if (!r.ok) throw new Error('no convirtió');
    expect(centavosAV1(r.datos)).toEqual(v1);
    let semilla = 7;
    const azar = (): number => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20000; i++) {
      const c = Math.round((azar() - 0.3) * 10 ** Math.floor(azar() * 12));
      const ida = aCentavos(c / 100);
      expect(ida).toBe(c === 0 ? 0 : c);
    }
  });

  it('DAT-08 volver a la v1 después del corte: un gasto de Bs 20 anotado en la v2 vuelve como 20', () => {
    const r = v1ACentavos(datosV1());
    if (!r.ok) throw new Error('no convirtió');
    r.datos.movs!.push({ id: 'nuevo', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 2000, fecha: '2026-11-20' });
    const v1 = centavosAV1(r.datos);
    expect(v1.movs!.find((m) => m.id === 'nuevo')!.monto).toBe(20);
    expect(v1.cuentas![0]!.saldoInicial).toBe(3550);
  });

  it('DAT-08 después de convertir, Rumbo 2 da los mismos saldos, patrimonio y libre que la v1', () => {
    const r = v1ACentavos(datosV1());
    if (!r.ok) throw new Error('no convirtió');
    const S = r.datos as unknown as Estado;
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(355000 - 3550 - 125000 - 90000 - 29);
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(120037 + 10000);
    expect(saldoDeuda(S, S.deudas[0]!)).toBe(1840000 - 68533);
    expect(patrimonio(S).total).toBe(136421 + 1621561 - 1771467 - 150000); // US$ 1.300,37 × 12,47 = 16.215,6139
    expect(calcHoy(S, '2026-11-10').disp).toBe(136421);
  });
});
