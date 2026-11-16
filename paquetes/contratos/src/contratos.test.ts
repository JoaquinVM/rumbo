// DAT-09: the same rules for the page and the server. Each amount is a whole number of cents, each type asks for its
// fields, and unknown fields stay (DAT-05). What the v1 saves, converted to cents (DAT-08), passes.
import * as dominio from '@rumbo/dominio';
import { v1ACentavos } from '@rumbo/dominio';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { cargarMotor } from '../../../pruebas/v1/motor.mjs';
import { azar, generar } from '../../../pruebas/comparacion/generador';
import {
  COLECCIONES, ESQUEMAS, validarDatos, validarDocumento, validarDocumentoDeRuta, validarPrincipal,
  type Ajustes, type Apartado, type Categoria, type Coleccion, type Cuenta, type Deuda, type Fijo, type Meta,
  type Movimiento, type Ocurrencia,
} from './index.js';

const gasto = { id: 'm1', tipo: 'gasto', fecha: '2026-11-13', monto: 3500, cuentaId: 'efectivo', categoriaId: 'comida' };
const aj = { tc: 12.5, tcFecha: null, inflacion: 8, irregular: 150000, horas: 160, empezado: true };

describe('DAT-09 validación compartida', () => {
  it('DAT-09 un movimiento con monto 35,5 en lugar de 3550 centavos no pasa: monto-no-entero', () => {
    expect(validarDocumento('movs', { ...gasto, monto: 35.5 })).toEqual({ ok: false, codigo: 'monto-no-entero', campo: 'monto' });
    expect(validarDocumento('movs', { ...gasto, monto: 3550 }).ok).toBe(true);
  });

  it('DAT-09 un gasto de Bs 35 sin categoría no pasa: falta-categoria', () => {
    const { categoriaId: _, ...sinCategoria } = gasto;
    expect(validarDocumento('movs', sinCategoria)).toEqual({ ok: false, codigo: 'falta-categoria', campo: 'categoriaId' });
    expect(validarDocumento('movs', { ...gasto, categoriaId: '' })).toEqual({ ok: false, codigo: 'falta-categoria', campo: 'categoriaId' });
    expect(validarDocumento('movs', { ...sinCategoria, tipo: 'ingreso' })).toMatchObject({ codigo: 'falta-categoria' });
    expect(validarDocumento('fijos', { id: 'f1', nombre: 'Renta', tipo: 'gasto', monto: 250000, cuentaId: 'banco', dia: 5 }))
      .toMatchObject({ codigo: 'falta-categoria' });
  });

  it('DAT-05 los campos desconocidos se conservan: el documento validado es el mismo que llegó', () => {
    const doc = { ...gasto, campoDeOtraVersion: { a: [1, 2.5, 'x'] }, nota: 'Salteñas 🥟' };
    const r = validarDocumento('movs', doc);
    expect(r).toEqual({ ok: true, datos: doc });
    expect(r.ok && r.datos).toBe(doc);
    const p = { aj: { ...aj, nuevo: 1 }, otro: true };
    expect(validarPrincipal(p)).toEqual({ ok: true, datos: p });
  });

  it('DAT-09 cada uno de los 12 campos de dinero de DAT-08 exige centavos enteros', () => {
    const casos: [Coleccion | 'aj', Record<string, unknown>, string][] = [
      ['aj', aj, 'irregular'],
      ['cuentas', { id: 'c', nombre: 'Banco', moneda: 'BOB', saldoInicial: 355000 }, 'saldoInicial'],
      ['categorias', { id: 'k', nombre: 'Comida', tipo: 'gasto', tope: 80000 }, 'tope'],
      ...(['monto', 'montoDestino', 'interes', 'capital'].map((c) =>
        ['movs', { id: 'p', tipo: 'pago', fecha: '2026-11-20', monto: 90000, cuentaId: 'banco', deudaId: 'd', montoDestino: 1, interes: 21467, capital: 68533 }, c]) as [Coleccion, Record<string, unknown>, string][]),
      ['fijos', { id: 'f', nombre: 'Sueldo', tipo: 'ingreso', monto: 800000, cuentaId: 'banco', categoriaId: 'sueldo', dia: 25 }, 'monto'],
      ['deudas', { id: 'd', tipo: 'prestamo', nombre: 'Banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia: 20 }, 'saldoInicial'],
      ['deudas', { id: 'd', tipo: 'prestamo', nombre: 'Banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia: 20 }, 'cuota'],
      ['metas', { id: 'g', nombre: 'Viaje', monto: 1500000, mes: '2027-12' }, 'monto'],
      ['apartados', { id: 'a', metaId: 'g', cuentaId: 'banco', monto: -5000, fecha: '2026-11-01' }, 'monto'],
    ];
    expect(casos).toHaveLength(12);
    for (const [col, doc, campo] of casos) {
      const validar = (d: unknown) => (col === 'aj' ? validarPrincipal({ aj: d }) : validarDocumento(col, d));
      expect(validar(doc).ok, `${col}.${campo}`).toBe(true);
      for (const malo of [35.5, 0.1, '3500', Number.MAX_SAFE_INTEGER + 1, NaN, null])
        expect(validar({ ...doc, [campo]: malo }), `${col}.${campo} = ${String(malo)}`)
          .toMatchObject({ ok: false, codigo: 'monto-no-entero', campo: col === 'aj' ? `aj.${campo}` : campo });
    }
  });

  it('DAT-08 el interés de una deuda es una tasa y sigue decimal', () => {
    expect(validarDocumento('deudas', { id: 'd', tipo: 'prestamo', nombre: 'Banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14.5, cuota: 90000, dia: 20 }).ok).toBe(true);
  });

  it('DAT-09 tipo y moneda conocidos, fechas AAAA-MM-DD y los campos que cada tipo pide', () => {
    const casos: [Coleccion, unknown, string, string?][] = [
      ['movs', { ...gasto, tipo: 'regalo' }, 'tipo-desconocido', 'tipo'],
      ['movs', { ...gasto, fecha: '13/11/2026' }, 'fecha-invalida', 'fecha'],
      ['movs', { ...gasto, fecha: undefined }, 'falta-campo', 'fecha'],
      ['movs', { ...gasto, cuentaId: undefined }, 'falta-campo', 'cuentaId'],
      ['movs', { id: 't', tipo: 'transferencia', fecha: '2026-11-13', monto: 70000, cuentaId: 'banco' }, 'falta-campo', 'cuentaDestinoId'],
      ['movs', { id: 'p', tipo: 'pago', fecha: '2026-11-13', monto: 90000, cuentaId: 'banco' }, 'falta-campo', 'deudaId'],
      ['movs', { id: 'i', tipo: 'interes', fecha: '2026-11-13', monto: 21467 }, 'falta-campo', 'deudaId'],
      ['cuentas', { id: 'c', nombre: 'Euros', moneda: 'EUR', saldoInicial: 0 }, 'moneda-desconocida', 'moneda'],
      ['deudas', { id: 'd', tipo: 'prestamo', nombre: 'Banco', moneda: 'BOB', saldoInicial: 100 }, 'falta-campo', 'interes'],
      ['deudas', { id: 'd', tipo: 'hipoteca', nombre: 'Casa', moneda: 'BOB', saldoInicial: 100 }, 'tipo-desconocido', 'tipo'],
      ['metas', { id: 'g', nombre: 'Viaje', monto: 100, mes: '2027-12-01' }, 'mes-invalido', 'mes'],
      ['fijos', { id: 'f', nombre: 'Renta', tipo: 'gasto', monto: 1, cuentaId: 'b', categoriaId: 'casa', dia: 32 }, 'campo-invalido', 'dia'],
      ['ocurrencias', { id: 'o', fijoId: 'f', mes: '2026-11', estado: 'pagado', movId: null }, 'campo-invalido', 'estado'],
      ['movs', [gasto], 'documento-invalido'],
      ['movs', { ...gasto, id: 'a/b' }, 'id-invalido', 'id'],
    ];
    for (const [col, doc, codigo, campo] of casos)
      expect(validarDocumento(col, doc), JSON.stringify(doc)).toEqual(campo ? { ok: false, codigo, campo } : { ok: false, codigo });
    expect(validarDocumento('usuarios', {})).toEqual({ ok: false, codigo: 'coleccion-desconocida' });
    expect(validarPrincipal({ aj: null })).toEqual({ ok: false, codigo: 'ajustes-invalidos' });
  });

  it('la ruta pone su id en el documento y rechaza uno distinto', () => {
    const { id: _, ...sinId } = gasto;
    expect(validarDocumentoDeRuta('movs', 'm1', sinId)).toEqual({ ok: true, datos: gasto });
    expect(validarDocumentoDeRuta('movs', 'm1', { ...gasto, id: 'm2' })).toEqual({ ok: false, codigo: 'id-distinto' });
    expect(validarDocumentoDeRuta('movs', 'a/b', gasto)).toEqual({ ok: false, codigo: 'id-invalido' });
  });

  it('DAT-04 un respaldo con un documento malo no se carga y dice cuál', () => {
    const cuerpo = { main: { aj }, cols: { movs: [gasto, { ...gasto, id: 'm2', monto: 12.555 }] } };
    expect(validarDatos(cuerpo)).toEqual({ ok: false, codigo: 'monto-no-entero', campo: 'cols.movs.1.monto' });
    expect(validarDatos({ main: null, cols: { movs: [gasto, gasto] } })).toEqual({ ok: false, codigo: 'id-repetido', campo: 'cols.movs.1.id' });
    expect(validarDatos({ main: null, cols: { otra: [] } })).toMatchObject({ ok: false, codigo: 'coleccion-desconocida' });
    expect(validarDatos({ main: null })).toEqual({ ok: false, codigo: 'respaldo-invalido' });
    expect(validarDatos({ main: { aj: { ...aj, irregular: 1500.5 } }, cols: {} })).toEqual({ ok: false, codigo: 'monto-no-entero', campo: 'main.aj.irregular' });
    expect(validarDatos({ main: { aj }, cols: { movs: [gasto] } })).toEqual({ ok: true, datos: { main: { aj }, filas: [{ col: 'movs', id: 'm1', datos: gasto }] } });
  });
});

describe('Lo que guarda la v1, pasado a centavos, cumple el contrato', () => {
  const v1 = cargarMotor({ hoy: '2026-11-10T12:00:00' });
  const revisar = (S: Record<string, unknown>, nombre: string): number => {
    const c = v1ACentavos(S);
    expect(c.ok, nombre).toBe(true);
    if (!c.ok) return 0;
    let n = 0;
    const d = c.datos as Record<string, unknown>;
    expect(validarPrincipal({ aj: d.aj }), `${nombre} aj`).toMatchObject({ ok: true });
    for (const col of COLECCIONES)
      for (const doc of (d[col] as unknown[]) ?? []) {
        expect(validarDocumento(col, doc), `${nombre} ${col} ${JSON.stringify(doc)}`).toMatchObject({ ok: true });
        n++;
      }
    return n;
  };

  it('el ejemplo de la v1', () => expect(revisar(v1.makeDemo(), 'ejemplo')).toBeGreaterThan(50));

  it('400 estados al azar de la comparación con la v1', () => {
    const r = azar(20261116);
    let n = 0;
    for (let i = 0; i < 400; i++) n += revisar(generar(r, v1.CATS_BASE).S as unknown as Record<string, unknown>, `estado ${i}`);
    expect(n).toBeGreaterThan(10000);
  });
});

describe('Los tipos de los contratos son los del dominio', () => {
  it('los montos son Centavos del dominio y cada documento sirve donde el dominio lo pide', () => {
    expectTypeOf<Movimiento['monto']>().toEqualTypeOf<dominio.Centavos>();
    expectTypeOf<Ajustes['irregular']>().toEqualTypeOf<dominio.Centavos>();
    expectTypeOf<Ajustes>().toMatchTypeOf<dominio.Ajustes>();
    expectTypeOf<Cuenta>().toMatchTypeOf<dominio.Cuenta>();
    expectTypeOf<Categoria>().toMatchTypeOf<dominio.Categoria>();
    expectTypeOf<Movimiento>().toMatchTypeOf<dominio.Movimiento>();
    expectTypeOf<Fijo>().toMatchTypeOf<dominio.Fijo>();
    expectTypeOf<Ocurrencia>().toMatchTypeOf<dominio.Ocurrencia>();
    expectTypeOf<Deuda>().toMatchTypeOf<dominio.Deuda>();
    expectTypeOf<Meta>().toMatchTypeOf<dominio.Meta>();
    expectTypeOf<Apartado>().toMatchTypeOf<dominio.Apartado>();
    expect(Object.keys(ESQUEMAS)).toEqual([...dominio.COLECCIONES]);
  });
});
