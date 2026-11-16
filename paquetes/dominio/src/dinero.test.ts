import { describe, expect, it } from 'vitest';
import { base } from './base.prueba';
import { cambiarTipoDeCambio } from './cuentas';
import {
  aBs, centavos as c, DineroInvalido, dividir, leer, leerConSigno, monto, mostrar, mostrarEn, mostrarUsd, porTasa, redondear,
  repartir, sumar, sumarMontos, type Centavos,
} from './dinero';
import { interesDelMes } from './prestamos';
import { saldoCuenta } from './saldos';

const leido = (t: string): number | string => { const r = leer(t); return r.ok ? r.centavos : r.codigo; };

describe('formato y dinero', () => {
  it('FMT-01 montos en bolivianos: un gasto de 1500 se muestra «Bs 1.500»', () => {
    expect(mostrar(c(150000))).toBe('Bs 1.500');
    expect(mostrar(c(123450), 2)).toBe('Bs 1.234,50');
    expect(mostrar(c(-30000))).toBe('−Bs 300');
    expect(mostrar(c(206000), 0, true)).toBe('+Bs 2.060');
  });

  it('FMT-02 dos decimales en movimientos y ninguno en resúmenes', () => {
    expect(mostrar(c(3500), 2)).toBe('Bs 35,00');
    expect(mostrar(c(307340))).toBe('Bs 3.073');
    expect(mostrar(15649.6)).toBe('Bs 156'); // an estimate in cents is rounded only when shown
  });

  it('FMT-03 lee los montos como se escriben y los guarda en centavos', () => {
    const casos: Record<string, number> = {
      '1.500': 150000, '1,500': 150000, '12,50': 1250, '12.5': 1250, '1.500,50': 150050, '1,500.50': 150050,
      '1.000.000': 100000000, 'Bs 250': 25000, '0.500': 50, '': 0, '12,345': 1234500,
    };
    for (const [t, v] of Object.entries(casos)) expect(leido(t), t).toBe(v);
    expect(mostrar(leido('1.500') as Centavos)).toBe('Bs 1.500');
  });

  it('FMT-03 con más de 2 decimales no guarda: «Usa hasta 2 decimales»', () => {
    expect(leido('0,125')).toBe('mas-de-2-decimales');
    expect(leido('1.500,125')).toBe('mas-de-2-decimales');
    expect(leido('99999999999999999999')).toBe('muy-grande');
    const neg = leerConSigno('−45');
    expect(neg.ok && neg.centavos).toBe(-4500);
  });

  it('FMT-04 montos en dólares: «US$ 1.200»', () => {
    expect(mostrarUsd(c(120000))).toBe('US$ 1.200');
    expect(mostrarEn(c(123450), 'USD', 2)).toBe('US$ 1.234,50');
    expect(mostrarEn(c(123450), 'BOB', 2)).toBe('Bs 1.234,50');
  });

  it('FMT-05 interés de la cuota: 21467 de interés, 68533 de capital, queda 1771467', () => {
    const it = interesDelMes(c(1840000), 14);
    expect(it).toBe(21467);
    expect(c(90000 - it)).toBe(68533);
    expect(c(1840000 - (90000 - it))).toBe(1771467);
    expect(mostrar(c(1771467), 2)).toBe('Bs 17.714,67');
  });

  it('FMT-05 suma sin errores de decimales: 0,10 + 0,20 son 30 centavos', () => {
    const S = base();
    S.cuentas = [{ id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: c(10) }];
    S.movs = [{ id: 'i', tipo: 'ingreso', cuentaId: 'ef', categoriaId: 'extra', monto: c(20), fecha: '2026-11-10' }];
    expect(saldoCuenta(S, S.cuentas[0]!)).toBe(30);
    expect(mostrar(saldoCuenta(S, S.cuentas[0]!), 2)).toBe('Bs 0,30');
  });

  it('FMT-05 gasto en dólares: US$ 20 a 12,5 son 25000 centavos de boliviano', () => {
    expect(aBs(c(2000), 'USD', 12.5)).toBe(25000);
    expect(aBs(c(2000), 'BOB', 12.5)).toBe(2000);
  });

  it('FMT-05 el tipo de cambio con decimales no se pasa a centavos', () => {
    const aj = cambiarTipoDeCambio(base().aj, 12.47, '2026-11-10');
    expect(aj.tc).toBe(12.47);
    expect(aBs(c(10000), 'USD', aj.tc)).toBe(124700);
  });

  it('FMT-05 solo redondean porTasa, aBs y las divisiones: a centavo, la mitad hacia arriba en valor absoluto', () => {
    expect(porTasa(c(5800), 3, 1200)).toBe(15); // 14,5 → 15
    expect(porTasa(c(-5800), 3, 1200)).toBe(-15);
    expect(porTasa(c(100), 0.125)).toBe(13);
    expect(aBs(c(1), 'USD', 12.5)).toBe(13);
    expect(aBs(c(-1), 'USD', 12.5)).toBe(-13);
    expect(dividir(c(1100000), 13)).toBe(84615);
    expect(dividir(c(5), 2)).toBe(3);
    expect(dividir(c(-5), 2)).toBe(-3);
    expect(redondear(2.5)).toBe(3);
    expect(redondear(-2.5)).toBe(-3);
    expect(repartir(c(1000), 3)).toEqual([334, 333, 333]);
    expect(repartir(c(-1000), 3)).toEqual([-334, -333, -333]);
    expect(sumar(...repartir(c(99999), 7))).toBe(99999);
  });

  it('FMT-05 un monto es un entero seguro de centavos y mezclar monedas no compila', () => {
    expect(() => c(12.5)).toThrow(DineroInvalido);
    expect(() => c(Number.MAX_SAFE_INTEGER + 1)).toThrow(DineroInvalido);
    expect(() => sumar(c(Number.MAX_SAFE_INTEGER), c(1))).toThrow(DineroInvalido);
    const bs = monto(c(100), 'BOB'), usd = monto(c(100), 'USD');
    expect(sumarMontos(bs, monto(c(50), 'BOB')).centavos).toBe(150);
    // @ts-expect-error: Bs and US$ do not add up
    sumarMontos(bs, usd);
    // @ts-expect-error: a decimal is not money
    expect(() => sumar(c(100), 0.5)).toThrow(DineroInvalido);
  });
});
