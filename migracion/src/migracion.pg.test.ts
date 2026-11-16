// 6.1 · The migration against PostgreSQL (DAT-08): a migration that fits, an amount with 3 decimals that changes
// nothing, a verification that does not fit and undoes everything, and the way back with an expense written after the
// cut. Each test works in its own schema, so it never touches other tables of the same database.
process.env.TZ = 'America/La_Paz';

import { readFileSync } from 'node:fs';
import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { cargarMotor } from '../../pruebas/v1/motor.mjs';
import { MigracionNoCuadra, TABLAS_V2, YaMigrada, aplicar, leerV1, leerV2, revisar, textoInforme, volver } from './migracion';

const HOY = '2026-11-10';
const ESQUEMA_V1 = readFileSync(new URL('../../servidor/esquema.sql', import.meta.url), 'utf8');
const v1 = cargarMotor({ hoy: `${HOY}T12:00:00` });
const c = new pg.Client();
await c.connect();
afterAll(async () => { await c.query('DROP SCHEMA IF EXISTS migracion_prueba CASCADE'); await c.end(); });

beforeEach(async () => {
  await c.query('DROP SCHEMA IF EXISTS migracion_prueba CASCADE');
  await c.query('CREATE SCHEMA migracion_prueba');
  await c.query('SET search_path TO migracion_prueba');
  await c.query(ESQUEMA_V1);
  await c.query(TABLAS_V2);
});

type Doc = Record<string, unknown>;
async function guardarV1(persona: string, aj: Doc, cols: Record<string, Doc[]>): Promise<void> {
  await c.query('INSERT INTO principal (persona, datos) VALUES ($1, $2)', [persona, { aj }]);
  for (const [col, docs] of Object.entries(cols)) {
    for (const d of docs) await c.query('INSERT INTO docs (persona, col, id, datos) VALUES ($1, $2, $3, $4)', [persona, col, d.id, d]);
  }
}
const contar = async (tabla: string): Promise<number> => Number((await c.query(`SELECT count(*) AS n FROM ${tabla}`)).rows[0].n);
const fotoV1 = async (): Promise<unknown> => JSON.stringify([...(await leerV1(c))]);

// Joaquín's scenario of DAT-08: Banco with 3550, an expense of 35,50 and a loan at 14 % with a payment of 900; and a
// second person with an account in dollars.
async function datosV1(): Promise<void> {
  const cats = v1.CATS_BASE.map((k: Doc) => ({ ...k }));
  await guardarV1('joaquin@rumbo.test', { tc: 12.5, tcFecha: '2026-11-08', inflacion: 8, irregular: 1500, horas: 160, empezado: true, color: 'rosa' }, {
    categorias: cats,
    cuentas: [
      { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550, rendimiento: 2, diaADia: true, archivada: false, desde: '2026-10-01' },
      { id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 650.1, rendimiento: 0, diaADia: true, archivada: false },
    ],
    movs: [
      { id: 'cena', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35.5, fecha: '2026-11-02', nota: 'Cena', extra: 'se conserva' },
      { id: 'pago1', tipo: 'pago', cuentaId: 'bn', deudaId: 'banco', monto: 900, interes: 214.67, capital: 685.33, fecha: '2026-10-20', nota: 'Cuota' },
    ],
    fijos: [{ id: 'luz', nombre: 'Luz', tipo: 'gasto', monto: 180, cuentaId: 'bn', categoriaId: 'casa', dia: 8, desde: '2026-10', activo: true }],
    ocurrencias: [{ id: 'luz_2026-10', fijoId: 'luz', mes: '2026-10', estado: 'saltado', movId: null }],
    deudas: [{ id: 'banco', tipo: 'prestamo', nombre: 'Préstamo', moneda: 'BOB', saldoInicial: 18400, interes: 14, cuota: 900, dia: 20, desde: '2026-10-01', archivada: false }],
    metas: [{ id: 'fondo', nombre: 'Fondo', monto: 15000, mes: '2027-12', archivada: false }],
    apartados: [{ id: 'a1', metaId: 'fondo', cuentaId: 'bn', monto: 300.5, fecha: '2026-11-03' }],
  });
  await guardarV1('otra@rumbo.test', { tc: 12.5, tcFecha: null, inflacion: 8, irregular: 0, horas: 160, empezado: true }, {
    categorias: cats,
    cuentas: [{ id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: 1200.25, rendimiento: 0, diaADia: false, archivada: false }],
  });
}

describe('DAT-08: migrar los datos de la v1 a centavos', () => {
  it('solo revisar: cuadra, no escribe nada y no muestra montos', async () => {
    await c.query('DROP TABLE v2_principal, v2_docs, v2_migracion'); // before the cut they may not exist
    expect((await revisar(c, v1, HOY)).cuadra).toBe(true); // nothing saved yet
    await c.query(TABLAS_V2);
    await datosV1();
    const antes = await fotoV1();
    const r = await revisar(c, v1, HOY);
    expect(r.cuadra).toBe(true);
    expect(r.personas.map((p) => p.persona)).toEqual(['j…@rumbo.test', 'o…@rumbo.test']);
    expect(r.personas[0]!.documentos).toMatchObject({ principal: 1, cuentas: 2, movs: 2, deudas: 1 });
    expect(await contar('v2_docs') + await contar('v2_principal') + await contar('v2_migracion')).toBe(0);
    expect(await fotoV1()).toBe(antes);
    const t = textoInforme(r);
    expect(t).toContain('Resultado: CUADRA.');
    expect(t).not.toMatch(/3550|3\.550|35[,.]5|18400|18\.400|900|1200|650/);
  });

  it('aplicar: Banco 355000, el gasto 3550, la cuota 90000, la tasa sigue en 14 y la v1 no cambia', async () => {
    await datosV1();
    const antes = await fotoV1();
    expect((await aplicar(c, v1, HOY)).cuadra).toBe(true);
    const v2 = await leerV2(c), j = v2.get('joaquin@rumbo.test')!;
    expect(j.main).toEqual({ aj: { tc: 12.5, tcFecha: '2026-11-08', inflacion: 8, irregular: 150000, horas: 160, empezado: true, color: 'rosa' } });
    expect(j.cols.cuentas).toEqual([
      { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 355000, rendimiento: 2, diaADia: true, archivada: false, desde: '2026-10-01' },
      { id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 65010, rendimiento: 0, diaADia: true, archivada: false },
    ]);
    expect(j.cols.movs!.find((m) => m.id === 'cena')).toMatchObject({ monto: 3550, extra: 'se conserva' });
    expect(j.cols.movs!.find((m) => m.id === 'pago1')).toMatchObject({ monto: 90000, interes: 21467, capital: 68533 });
    expect(j.cols.deudas![0]).toMatchObject({ saldoInicial: 1840000, cuota: 90000, interes: 14 });
    expect(j.cols.apartados![0]).toMatchObject({ monto: 30050 });
    expect(j.cols.ocurrencias).toEqual([{ id: 'luz_2026-10', fijoId: 'luz', mes: '2026-10', estado: 'saltado', movId: null }]);
    expect(v2.get('otra@rumbo.test')!.cols.cuentas![0]).toMatchObject({ saldoInicial: 120025 });
    expect(await contar('v2_migracion')).toBe(1);
    expect(await fotoV1()).toBe(antes);
    await expect(aplicar(c, v1, HOY)).rejects.toBeInstanceOf(YaMigrada); // Rumbo 2 may already have new data
  });

  it('un monto con 3 decimales no cambia nada y lista ese movimiento', async () => {
    await datosV1();
    await c.query(`UPDATE docs SET datos = jsonb_set(datos, '{monto}', '12.555') WHERE id = 'cena'`);
    const r = await revisar(c, v1, HOY);
    expect(r.cuadra).toBe(false);
    expect(r.personas[0]!.problemas).toEqual([{ coleccion: 'movs', id: 'cena', nombre: 'Cena', fecha: '2026-11-02', campo: 'monto', motivo: 'mas-de-2-decimales' }]);
    expect(textoInforme(r)).toContain('movs cena «Cena» del 2026-11-02, campo monto: tiene un monto con más de 2 decimales');
    await expect(aplicar(c, v1, HOY)).rejects.toBeInstanceOf(MigracionNoCuadra);
    expect(await contar('v2_docs') + await contar('v2_principal') + await contar('v2_migracion')).toBe(0);
  });

  it('una verificación que no cuadra deshace todo, también lo que ya había en las tablas de Rumbo 2', async () => {
    await datosV1();
    await c.query(`INSERT INTO v2_docs (persona, col, id, datos) VALUES ('joaquin@rumbo.test', 'movs', 'previo', '{"id":"previo"}')`);
    const roto = (persona: string): string[] => (persona.startsWith('joaquin') ? ['saldo bn: v1 355000 v2 355001'] : []);
    const e = await aplicar(c, v1, HOY, { verificar: roto }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(MigracionNoCuadra);
    expect((e as MigracionNoCuadra).informe.personas[0]!.diferencias).toEqual(['saldo bn: v1 355000 v2 355001']);
    expect((await c.query('SELECT id FROM v2_docs')).rows).toEqual([{ id: 'previo' }]);
    expect(await contar('v2_principal') + await contar('v2_migracion')).toBe(0);
  });

  it('ida y vuelta: un gasto de Bs 20 anotado en Rumbo 2 vuelve a la v1 y lo demás queda como estaba', async () => {
    await datosV1();
    const antes = await leerV1(c);
    await aplicar(c, v1, HOY);
    await c.query(`INSERT INTO v2_docs (persona, col, id, datos) VALUES ('joaquin@rumbo.test', 'movs', 'nuevo',
      '{"id":"nuevo","tipo":"gasto","cuentaId":"ef","categoriaId":"comida","monto":2000,"fecha":"2026-11-12","nota":"Almuerzo"}')`);
    const r = await volver(c);
    expect(r.map((p) => p.persona)).toEqual(['j…@rumbo.test', 'o…@rumbo.test']);
    const despues = await leerV1(c), j = despues.get('joaquin@rumbo.test')!;
    expect(j.cols.movs!.find((m) => m.id === 'nuevo')).toMatchObject({ monto: 20, tipo: 'gasto' });
    expect({ ...j, cols: { ...j.cols, movs: j.cols.movs!.filter((m) => m.id !== 'nuevo') } }).toEqual(antes.get('joaquin@rumbo.test'));
    expect(despues.get('otra@rumbo.test')).toEqual(antes.get('otra@rumbo.test'));
    // The v1 sees the balances of before plus that expense
    const S = { aj: { ...v1.vacio().aj, ...(j.main!.aj as Doc) }, ...Object.fromEntries(Object.entries(j.cols)) };
    for (const k of ['fijos', 'ocurrencias', 'metas', 'apartados', 'deudas']) (S as Doc)[k] ??= [];
    expect(v1.saldoCuenta(S, j.cols.cuentas!.find((x) => x.id === 'ef'))).toBeCloseTo(650.1 - 20, 10);
  });
});
