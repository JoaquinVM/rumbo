import { describe, expect, it } from 'vitest';
import { base, HOY } from './base.prueba';
import {
  archivarCuenta, cambiarTipoDeCambio, cuadrar, cuentasAbiertasDespues, diasDelTipoDeCambio, patrimonio, tipoDeCambioDe,
  tipoDeCambioParaGuardar, tipoDeCambioViejo, ultimoCambio,
} from './cuentas';
import { resumenMes } from './desglose';
import { centavos as c, mostrar, mostrarNumero } from './dinero';
import { saldoCuenta } from './saldos';

const compraDeDolares = { id: '3', tipo: 'transferencia' as const, cuentaId: 'bn', cuentaDestinoId: 'us', monto: c(125000), montoDestino: c(10000), fecha: '2026-11-08' };

describe('cuentas', () => {
  it('CTA-02 saldo del Banco: 3550 + 1200 − 320 − 1250 = 3180', () => {
    const S = base();
    S.movs = [
      { id: '1', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: c(120000), fecha: '2026-11-07' },
      { id: '2', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'super', monto: c(32000), fecha: '2026-11-09' },
      compraDeDolares,
    ];
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(318000);
    expect(saldoCuenta(S, S.cuentas[2]!)).toBe(130000);
  });

  it('CTA-03 faltan 45 en efectivo: ajuste de −45, saldo 650 y el gastado no cambia', () => {
    const S = base();
    S.movs = [{ id: 'g', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(4500), fecha: '2026-11-02' }];
    S.cuentas[0]!.saldoInicial = c(74000); // calcula 695
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(69500);
    const gastado = resumenMes(S, '2026-11').salio;
    const aj = cuadrar(S, S.cuentas[0]!, c(65000), HOY, 'aj')!;
    expect(aj).toMatchObject({ tipo: 'ajuste', monto: 4500, sentido: -1, cuentaId: 'ef', fecha: HOY });
    S.movs.push(aj);
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(65000);
    expect(resumenMes(S, '2026-11').salio).toBe(gastado);
    expect(resumenMes(S, '2026-11').ajustes).toBe(-4500);
    expect(cuadrar(S, S.cuentas[0]!, c(65000), HOY, 'otro')).toBeNull();
    expect(cuadrar(S, S.cuentas[0]!, c(70001), HOY, 'mas')).toMatchObject({ monto: 5001, sentido: 1 });
  });

  it('CTA-04 tipo de cambio puesto hace 9 días', () => {
    const S = base();
    expect(diasDelTipoDeCambio(S, HOY)).toBe(9);
    expect(tipoDeCambioViejo(S, HOY)).toBe(true);
    expect(tipoDeCambioViejo(S, '2026-11-08')).toBe(false);
    S.aj.tcFecha = null;
    expect(tipoDeCambioViejo(S, HOY)).toBe(true);
  });

  it('CTA-05 patrimonio con dólares: Bs 19.200, unos US$ 1.536', () => {
    const p = patrimonio(base());
    expect(p).toMatchObject({ cuentas: 1920000, teDeben: 0, deudas: 0, total: 1920000 });
    expect(mostrar(p.total)).toBe('Bs 19.200');
    expect(mostrarNumero(p.enDolares)).toBe('1.536');
  });

  it('CTA-05 te deben suma y las deudas restan; las archivadas no cuentan', () => {
    const S = base();
    S.deudas = [
      { id: 'am', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: c(40000) },
      { id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000) },
      { id: 'pu', tipo: 'persona', nombre: 'Tío', moneda: 'USD', saldoInicial: c(1001) },
      { id: 'vi', tipo: 'persona', nombre: 'Vieja', moneda: 'BOB', saldoInicial: c(99900), archivada: true },
    ];
    const p = patrimonio(S);
    expect(p.teDeben).toBe(40000);
    expect(p.deudas).toBe(150000 + 12513); // US$ 10,01 × 12,5 = Bs 125,125 → 125,13
    expect(p.total).toBe(1920000 + 40000 - 162513);
  });

  it('CTA-06 compra de dólares: «este cambio fue a Bs 12,50 por dólar»', () => {
    const S = base();
    S.movs = [compraDeDolares];
    expect(tipoDeCambioDe(c(125000), c(10000))).toBe(12.5);
    expect(ultimoCambio(S)).toEqual({ tc: 12.5, fecha: '2026-11-08' });
    expect(tipoDeCambioParaGuardar(c(100000), c(7300))).toBe(13.7);
    S.movs.push({ id: '4', tipo: 'transferencia', cuentaId: 'us', cuentaDestinoId: 'ef', monto: c(1000), montoDestino: c(13500), fecha: '2026-11-09' });
    expect(ultimoCambio(S)).toEqual({ tc: 13.5, fecha: '2026-11-09' });
  });

  it('CTA-07 gasto de ayer en una cuenta abierta hoy: el saldo sigue en 650 y el gasto cuenta en el Desglose', () => {
    const S = base();
    S.cuentas[0]!.desde = HOY;
    S.movs = [
      { id: 'g', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(3500), fecha: '2026-11-09' },
      { id: 'g2', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(2000), fecha: HOY },
    ];
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(63000);
    expect(resumenMes(S, '2026-11').salio).toBe(5500);
    expect(cuentasAbiertasDespues(S, S.movs[0]!).map((x) => x.id)).toEqual(['ef']);
    expect(cuentasAbiertasDespues(S, S.movs[1]!)).toEqual([]);
  });

  it('CTA-08 Banco con 120 no se archiva; en cero exacto sí', () => {
    const S = base();
    S.cuentas[1]!.saldoInicial = c(12000);
    expect(archivarCuenta(S, S.cuentas[1]!)).toEqual({ ok: false, codigo: 'saldo-no-es-cero' });
    S.cuentas[1]!.saldoInicial = c(1);
    expect(archivarCuenta(S, S.cuentas[1]!).ok).toBe(false);
    S.cuentas[1]!.saldoInicial = c(0);
    const r = archivarCuenta(S, S.cuentas[1]!);
    expect(r.ok && r.datos.archivada).toBe(true);
  });

  it('AJU-04 cambiar el tipo de 12,50 a 13,00 recalcula el patrimonio y la fecha pasa a hoy', () => {
    const S = base();
    S.aj = cambiarTipoDeCambio(S.aj, 13, HOY);
    expect(S.aj).toMatchObject({ tc: 13, tcFecha: HOY });
    expect(patrimonio(S).total).toBe(65000 + 355000 + 1560000);
    expect(cambiarTipoDeCambio(S.aj, 13, '2026-11-12')).toBe(S.aj);
    expect(cambiarTipoDeCambio({ ...S.aj, tcFecha: null }, 13, '2026-11-12').tcFecha).toBe('2026-11-12');
  });
});
