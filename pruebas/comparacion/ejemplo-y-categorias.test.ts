// DAT-01 and MOV-07 against the frozen v1: the example of Rumbo 2 is the v1's in cents, field by field, and the
// total of each category in Movimientos is the one of the Desglose in hundreds of states at random.
process.env.TZ = 'America/La_Paz'; // where Rumbo is used; the v1 works with local dates

import * as dominio from '@rumbo/dominio';
import { describe, expect, it } from 'vitest';
import { cargarMotor } from '../v1/motor.mjs';
import { azar, generar } from './generador';

describe('el ejemplo es el de la v1 en centavos (DAT-01)', () => {
  for (const hoy of ['2026-11-10', '2026-11-30', '2027-01-03', '2027-02-28', '2026-03-31']) {
    it(`con hoy ${hoy}`, () => {
      const v1 = cargarMotor({ hoy: `${hoy}T12:00:00` });
      const conv = dominio.v1ACentavos(v1.makeDemo());
      if (!conv.ok) throw new Error(JSON.stringify(conv.problemas));
      expect(JSON.parse(JSON.stringify(dominio.ejemplo(hoy)))).toEqual(JSON.parse(JSON.stringify(conv.datos)));
    });
  }
});

describe('MOV-07 suma cada categoría igual que el Desglose', () => {
  it('en 400 estados al azar, cada categoría de cada mes con movimientos', () => {
    const r = azar(20261117), v1 = cargarMotor(), fallas: string[] = [];
    for (let i = 0; i < 400; i++) {
      const { S: S1 } = generar(r, v1.CATS_BASE);
      const conv = dominio.v1ACentavos(S1 as never);
      if (!conv.ok) throw new Error(JSON.stringify(conv.problemas));
      const S = conv.datos as unknown as dominio.Estado;
      const meses = [...new Set(S.movs.map((m) => m.fecha.slice(0, 7)))];
      for (const mes of meses) {
        const cats = dominio.resumenMes(S, mes).cats;
        for (const k of S.categorias.filter((x) => x.tipo === 'gasto')) {
          const t = dominio.movimientosDeCategoria(S, mes, k.id).total;
          if (t !== (cats[k.id] ?? 0)) fallas.push(`estado ${i}, ${mes}, ${k.id}: ${t} ≠ ${cats[k.id]}`);
        }
      }
    }
    expect(fallas).toEqual([]);
  });
});
