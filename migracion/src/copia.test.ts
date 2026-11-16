// PUB-07 and DAT-08: the copy of the test environment converts exactly, comes back the same, passes the contracts
// and never reports an amount.
import { describe, expect, it } from 'vitest';
import { prepararCopia } from './copia';

const aj = { tc: 12.5, tcFecha: '2026-11-01', inflacion: 8, irregular: 2000.5, horas: 160, empezado: true, color: 'cielo' };
const docs = [
  { col: 'cuentas', id: 'bn', datos: { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550, rendimiento: 2, diaADia: true, extra: 'se queda' } },
  { col: 'movs', id: 'g', datos: { id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35.5, fecha: '2026-11-02', nota: 'Almuerzo' } },
  { col: 'deudas', id: 'p', datos: { id: 'p', tipo: 'prestamo', nombre: 'Préstamo', moneda: 'BOB', saldoInicial: 18400, interes: 14, cuota: 900, dia: 20 } },
];

describe('la copia del ambiente de prueba (DAT-08)', () => {
  it('pasa a centavos los campos de dinero, deja la tasa y los campos desconocidos, y pasa los contratos', () => {
    const r = prepararCopia({ aj }, docs);
    if (!r.ok) throw new Error(r.problemas.join());
    expect(r.main.aj).toMatchObject({ irregular: 200050, tc: 12.5, color: 'cielo' });
    const d = (id: string) => r.filas.find((f) => f.id === id)!.datos as Record<string, unknown>;
    expect(d('bn')).toMatchObject({ saldoInicial: 355000, extra: 'se queda' });
    expect(d('g')).toMatchObject({ monto: 3550 });
    expect(d('p')).toMatchObject({ saldoInicial: 1840000, cuota: 90000, interes: 14 });
    expect(r.conteos).toMatchObject({ cuentas: 1, movs: 1, deudas: 1, fijos: 0 });
  });

  it('un monto con más de 2 decimales no carga nada y lo dice sin mostrar el monto', () => {
    const r = prepararCopia({ aj }, [...docs, { col: 'movs', id: 'raro', datos: { id: 'raro', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'x', monto: 12.555, fecha: '2026-11-02' } }]);
    expect(r).toEqual({ ok: false, problemas: ['movs/raro · monto: mas-de-2-decimales'] });
    expect(JSON.stringify(r)).not.toContain('12.555');
  });

  it('un documento que los contratos no aceptan no carga nada', () => {
    const r = prepararCopia({ aj }, [{ col: 'movs', id: 'g', datos: { id: 'g', tipo: 'gasto', cuentaId: 'bn', monto: 1, fecha: '2026-11-02' } }]);
    expect(r).toEqual({ ok: false, problemas: ['no pasa los contratos: falta-categoria en cols.movs.0.categoriaId'] });
  });

  it('sin datos empezados no hay nada que copiar', () => {
    expect(prepararCopia(null, []).ok).toBe(false);
  });
});
