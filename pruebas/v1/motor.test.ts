// The v1 oracle works: its frozen tests still pass and the loader gives the v1 results of the spec scenarios.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cargarMotor, FUNCIONES } from './motor.mjs';

describe('La v1 congelada como oráculo', () => {
  it('sus pruebas de v1.0.0 siguen pasando', () => {
    const salida = execFileSync(process.execPath, [fileURLToPath(new URL('./verificar.mjs', import.meta.url))], { encoding: 'utf8' });
    expect(salida).toMatch(/\d+ pruebas pasaron/);
  });

  it('expone cada función de su motor', () => {
    const v1 = cargarMotor();
    for (const f of FUNCIONES) expect(v1[f], f).toBeDefined();
  });

  it('FMT-01 y FMT-02 formatean como la v1', () => {
    const v1 = cargarMotor();
    expect(v1.money(1500)).toBe('Bs 1.500');
    expect(v1.money(35, 2)).toBe('Bs 35,00');
  });

  it('DEU-05 da las tres primeras cuotas del préstamo de Bs 18.400 al 14 %', () => {
    const v1 = cargarMotor();
    const filas = v1.amortizar(18400, 14, 900).filas.slice(0, 3).map((f: any) => [f.interes, f.capital, f.saldo]);
    expect(filas).toEqual([[214.67, 685.33, 17714.67], [206.67, 693.33, 17021.34], [198.58, 701.42, 16319.92]]);
  });

  it('cada motor tiene su propio estado y su propia fecha', () => {
    const a = cargarMotor({ hoy: '2026-11-10T12:00:00' });
    const b = cargarMotor();
    a.S = a.vacio();
    a.S.cuentas = [{ id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 650, rendimiento: 0, diaADia: true }];
    expect(a.saldoCuenta(a.S, a.S.cuentas[0])).toBe(650);
    expect(b.S).not.toBe(a.S);
  });
});
