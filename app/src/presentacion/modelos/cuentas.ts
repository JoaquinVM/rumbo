// The icon and color of an account and of a fixed item, as the v1 picks them (docs/DISENO.md, Íconos).
import type { MonedaApp } from '@rumbo/contratos';

export const iconoCuenta = (c: { nombre: string; moneda: MonedaApp }): string =>
  c.moneda === 'USD' ? 'dolar' : /efect/i.test(c.nombre) ? 'billete' : 'banco';
export const colorCuenta = (c: { nombre: string; moneda: MonedaApp }): string =>
  c.moneda === 'USD' ? '#2E8F86' : /efect/i.test(c.nombre) ? '#4A8F3A' : '#5A6CD8';
