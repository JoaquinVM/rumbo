// 2.9 · Rumbo 2 against the frozen v1 (design.md, «Comparación con la v1»): hundreds of states at random with a
// fixed seed, converted to cents with the migration's function (DAT-08) and calculated with both engines.
process.env.TZ = 'America/La_Paz'; // where Rumbo is used; the v1 works with local dates

import * as dominio from '@rumbo/dominio';
import { describe, expect, it } from 'vitest';
import { cargarMotor } from '../v1/motor.mjs';
import { comparar } from '../../migracion/src/comparar';
import { azar, generar } from './generador';

const ESTADOS = 400;
const SEMILLA = 20261116;

describe('Rumbo 2 da los mismos números que la v1', () => {
  const v1 = cargarMotor();

  it(`DAT-08 y FMT-05 en ${ESTADOS} estados al azar (semilla ${SEMILLA}), dentro de las tolerancias de design.md`, () => {
    const r = azar(SEMILLA), fallas: string[] = [];
    for (let i = 0; i < ESTADOS; i++) {
      const { hoy, S } = generar(r, v1.CATS_BASE);
      const dif = comparar(v1, dominio, hoy, S);
      if (dif.length) fallas.push(`estado ${i} (${hoy}): ${dif.slice(0, 5).join(' · ')}`);
    }
    expect(fallas).toEqual([]);
  });

  it('FMT-03 lee lo escrito como la v1 o dice que use hasta 2 decimales', () => {
    const r = azar(SEMILLA + 1), dig = (n: number): string => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');
    for (let i = 0; i < 5000; i++) {
      const sep = (): string => ['.', ',', ''][Math.floor(r() * 3)]!;
      const t = `${r() < 0.1 ? 'Bs ' : ''}${dig(1 + Math.floor(r() * 4))}${sep()}${dig(Math.floor(r() * 4))}${r() < 0.3 ? sep() + dig(Math.floor(r() * 4)) : ''}`;
      const a = v1.parseAmt(t), b = dominio.leer(t);
      const exacto = Math.round(a * 100) === a * 100 || Math.abs(a * 100 - Math.round(a * 100)) < 1e-6;
      if (b.ok) expect(b.centavos, t).toBe(Math.round(a * 100));
      else expect([b.codigo, exacto], t).toEqual(['mas-de-2-decimales', false]);
    }
  });

  it('la comparación falla si una regla cambia', () => {
    const r = azar(SEMILLA);
    let estado = generar(r, v1.CATS_BASE);
    while (!estado.S.movs.length || !estado.S.deudas.some((d) => d.tipo === 'prestamo')) estado = generar(r, v1.CATS_BASE);
    const { hoy, S } = estado;
    expect(comparar(v1, dominio, hoy, S)).toEqual([]);
    const roto = (cambio: Partial<typeof dominio>): string[] => comparar(v1, { ...dominio, ...cambio }, hoy, S);
    expect(roto({ saldoCuenta: (S2, c) => dominio.centavos(dominio.saldoCuenta(S2, c) + 1) })).not.toEqual([]);
    expect(roto({ interesDelMes: () => dominio.centavos(0), amortizar: (s, t, c, e) => dominio.amortizar(s, (t ?? 0) + 1, c, e) })).not.toEqual([]);
    expect(roto({ resumenMes: (S2, m) => ({ ...dominio.resumenMes(S2, m), salio: dominio.centavos(dominio.resumenMes(S2, m).salio + 2) }) })).not.toEqual([]);
    expect(roto({ ritmo: (S2, h) => ({ ...dominio.ritmo(S2, h), neto: dominio.ritmo(S2, h).neto + 1 }) })).not.toEqual([]);
  });
});
