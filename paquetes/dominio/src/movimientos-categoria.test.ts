// MOV-07: the movements of a category and their total, the same as the Desglose (decision 64).
import { describe, expect, it } from 'vitest';
import { base, conFijos, prestamo } from './base.prueba';
import { resumenMes } from './desglose';
import { separarGasto } from './deudas';
import { centavos as c, mostrar } from './dinero';
import { confirmarFijo } from './fijos';
import type { Estado, Movimiento } from './modelo';
import { categoriasParaElegir, movimientosDeCategoria } from './movimientos';

const gasto = (id: string, cuentaId: string, categoriaId: string, monto: number, fecha: string, extra: Partial<Movimiento> = {}): Movimiento =>
  ({ id, tipo: 'gasto', cuentaId, categoriaId, monto: c(monto), fecha, nota: '', ...extra });

// Comida fuera in November: Bs 1.150 between Efectivo, Banco and US$ 4 with the exchange rate of 12,5 saved in it.
function noviembre(): Estado {
  const S = base();
  S.movs = [
    gasto('a', 'ef', 'comida', 35000, '2026-11-02'),
    gasto('b', 'bn', 'comida', 45000, '2026-11-05'),
    gasto('c', 'ef', 'comida', 30000, '2026-11-09'),
    gasto('d', 'us', 'comida', 400, '2026-11-09', { tc: 12.5 }), // US$ 4 → Bs 50
    gasto('e', 'ef', 'super', 99900, '2026-11-09'),
    gasto('f', 'ef', 'comida', 12000, '2026-10-30'),
    { id: 'g', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'negocio', monto: c(150000), fecha: '2026-11-03' },
  ];
  return S;
}

describe('MOV-07 movimientos de una categoría', () => {
  it('Comida fuera en noviembre: solo sus gastos y arriba su total, Bs 1.150, igual que el Desglose', () => {
    const S = noviembre(), r = movimientosDeCategoria(S, '2026-11', 'comida');
    expect(r.dias.flatMap((d) => d.movs.map((m) => m.id))).toEqual(['d', 'c', 'b', 'a']);
    expect(r.total).toBe(115000);
    expect(r.total).toBe(resumenMes(S, '2026-11').cats.comida);
    expect(mostrar(r.total)).toBe('Bs 1.150');
    expect(r.cantidad).toBe(4);
    expect(r.dias.map((d) => [d.fecha, d.gastado])).toEqual([['2026-11-09', 35000], ['2026-11-05', 45000], ['2026-11-02', 35000]]);
  });

  it('cuenta los gastos de los fijos confirmados', () => {
    const S = conFijos(base(), [{ nombre: 'Luz', tipo: 'gasto', monto: c(18000), categoriaId: 'casa', dia: 8 }]);
    const r0 = confirmarFijo(S, 'f0', '2026-11', c(18000))!;
    S.movs.push(r0.mov);
    S.ocurrencias.push(r0.ocurrencia);
    const r = movimientosDeCategoria(S, '2026-11', 'casa');
    expect([r.total, r.cantidad]).toEqual([18000, 1]);
    expect(r.total).toBe(resumenMes(S, '2026-11').cats.casa);
  });

  it('la cuota en Intereses: muestra el pago de 900 con su interés y suma Bs 214,67, igual que el Desglose', () => {
    const S = conFijos(base(), [{ nombre: 'Cuota', tipo: 'gasto', monto: c(90000), categoriaId: 'intereses', dia: 20, deudaId: 'pr' }]);
    S.deudas = [prestamo()];
    const r0 = confirmarFijo(S, 'f0', '2026-11', c(90000))!;
    S.movs.push(r0.mov);
    S.movs.push({ id: 'i', tipo: 'interes', deudaId: 'pr', monto: c(1000), fecha: '2026-11-21', nota: 'Interés sin pagar' });
    let r = movimientosDeCategoria(S, '2026-11', 'intereses');
    expect(r.dias.flatMap((d) => d.movs.map((m) => [m.tipo, m.monto]))).toEqual([['interes', 1000], ['pago', 90000]]);
    expect(r.total).toBe(21467 + 1000);
    expect(r.total).toBe(resumenMes(S, '2026-11').cats.intereses);
    S.movs = S.movs.filter((m) => m.id !== 'i');
    r = movimientosDeCategoria(S, '2026-11', 'intereses');
    expect(mostrar(r.total, 2)).toBe('Bs 214,67');
  });

  it('la mitad de la cena: muestra el gasto por 150 y el préstamo dado de 150 no aparece', () => {
    const S = base();
    S.deudas = [{ id: 'amigo', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: c(0) }];
    const cena = gasto('cena', 'ef', 'comida', 30000, '2026-11-08', { nota: 'Cena' });
    S.movs = [cena];
    const sep = separarGasto(S, cena, c(15000), 'amigo', { deuda: 'x', prestamo: 'p' });
    if (!sep.ok) throw new Error(sep.codigo);
    S.movs = sep.datos.movs;
    expect(S.movs.map((m) => [m.tipo, m.categoriaId])).toEqual([['gasto', 'comida'], ['prestamo', 'comida']]);
    const r = movimientosDeCategoria(S, '2026-11', 'comida');
    expect(r.dias.flatMap((d) => d.movs.map((m) => [m.id, m.monto]))).toEqual([['cena', 15000]]);
    expect(r.total).toBe(15000);
    expect(r.total).toBe(resumenMes(S, '2026-11').cats.comida);
  });

  it('con una cuenta: solo los de Comida fuera desde Efectivo, y el total suma solo esos', () => {
    const r = movimientosDeCategoria(noviembre(), '2026-11', 'comida', 'ef');
    expect(r.dias.flatMap((d) => d.movs.map((m) => m.id))).toEqual(['c', 'a']);
    expect([r.total, r.cantidad]).toEqual([65000, 2]);
  });

  it('otro mes: en octubre se ven los gastos de Comida fuera de octubre', () => {
    const r = movimientosDeCategoria(noviembre(), '2026-10', 'comida');
    expect(r.dias.flatMap((d) => d.movs.map((m) => m.id))).toEqual(['f']);
    expect(r.total).toBe(12000);
  });

  it('una categoría de ingreso cuenta sus ingresos', () => {
    const r = movimientosDeCategoria(noviembre(), '2026-11', 'negocio');
    expect([r.total, r.cantidad]).toEqual([150000, 1]);
  });

  it('se elige entre las activas y las archivadas con movimientos en ese mes', () => {
    const S = noviembre();
    S.categorias.find((k) => k.id === 'super')!.archivada = true;
    S.categorias.find((k) => k.id === 'ocio')!.archivada = true;
    const ids = categoriasParaElegir(S, '2026-11').map((k) => k.id);
    expect(ids).toContain('super');
    expect(ids).not.toContain('ocio');
    expect(categoriasParaElegir(S, '2026-10').map((k) => k.id)).not.toContain('super');
  });
});
