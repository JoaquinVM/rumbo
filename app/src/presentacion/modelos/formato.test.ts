// The presentation writes amounts exactly like the domain's `mostrar` (FMT-01, 02, 04), which copies the v1.
import { mostrar, mostrarNumero, mostrarUsd } from '@rumbo/dominio';
import { describe, expect, it } from 'vitest';
import { compacto, decimal, dinero, numero, usd } from './formato';

describe('formato igual al del dominio', () => {
  it('en 20.000 montos, enteros y estimaciones, positivos y negativos', () => {
    let s = 7;
    const r = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20000; i++) {
      const c = (r() < 0.5 ? Math.round : (x: number) => x)((r() - 0.3) * 10 ** (1 + Math.floor(r() * 9)));
      for (const dec of [0, 2]) {
        expect(dinero(c, dec), String(c)).toBe(mostrar(c, dec));
        expect(dinero(c, dec, true), String(c)).toBe(mostrar(c, dec, true));
        expect(usd(c, dec), String(c)).toBe(mostrarUsd(c, dec));
        expect(numero(c, dec), String(c)).toBe(mostrarNumero(c, dec));
      }
    }
  });

  it('los textos de las specs', () => {
    expect(dinero(123450, 2)).toBe('Bs 1.234,50');
    expect(dinero(307340)).toBe('Bs 3.073');
    expect(dinero(-3500, 2)).toBe('−Bs 35,00');
    expect(usd(120000, 2)).toBe('US$ 1.200,00');
    expect(decimal(12.5, 2)).toBe('12,50');
    expect([compacto(950), compacto(12000), compacto(1500), compacto(-3000)]).toEqual(['950', '12 k', '1,5 k', '−3 k']);
  });
});
