// DAT-08 · The v1 data to cents, once, and back (design.md, «Migration Plan»). Three modes:
//   revisar  reads the v1 tables (`principal`, `docs`), converts in memory and verifies; writes nothing.
//   aplicar  the same, then in ONE transaction writes `v2_principal` and `v2_docs`, reads them back, verifies again
//            and only then adds the row of `v2_migracion` that makes Rumbo 2 healthy (/salud). Any problem or any
//            difference and the transaction is undone: nothing is left written and the v1 goes on as it was.
//   volver   the Rumbo 2 tables back to the v1 ones, cents ÷ 100, keeping what was written in Rumbo 2 after the cut.
// The v1 tables are only read, except by `volver`. Nothing here shows an amount: the report has counts, ids, names
// and dates, never money (the data are the person's).
import * as dominio from '@rumbo/dominio';
import { validarDocumento } from '@rumbo/contratos';
import type pg from 'pg';
import { comparar } from './comparar';
import type { EstadoV1 } from './estado-v1';

export const COLECCIONES = ['cuentas', 'categorias', 'movs', 'fijos', 'ocurrencias', 'deudas', 'metas', 'apartados'] as const;
type Doc = Record<string, unknown>;
export interface DatosPersona { main: Doc | null; cols: Record<string, Doc[]> }

export interface Problema {
  coleccion: string;
  id: string | null;
  nombre: string | null; // its note or name, to find it in the v1
  fecha: string | null;
  campo: string | null;
  motivo: string; // 'mas-de-2-decimales', 'no-es-numero', 'coleccion-desconocida' or the contracts' code
}

export interface InformePersona {
  persona: string; // masked: j…@gmail.com
  documentos: Record<string, number>;
  problemas: Problema[];
  diferencias: string[]; // what the two engines do not agree on; only shown with --detalle (they carry cents)
}

export interface Informe {
  personas: InformePersona[];
  cuadra: boolean;
  yaMigrada: boolean; // there is already a row in v2_migracion
  v2ConDatos: number; // people who already have data in the Rumbo 2 tables
}

// The v1 engine, frozen in pruebas/v1 (the oracle).
export type MotorV1 = Record<string, any>;

// «joaquin@gmail.com» → «j…@gmail.com»
export const enmascarar = (correo: string): string => {
  const [u = '', d = ''] = correo.split('@');
  return `${u.slice(0, 1)}…@${d}`;
};

const nombreDe = (d: Doc | undefined): string | null => (d ? String(d.nota || d.nombre || '') || null : null);
const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export const leerV1 = (c: pg.ClientBase): Promise<Map<string, DatosPersona>> => leerTablas(c, 'principal', 'docs');
export const leerV2 = (c: pg.ClientBase): Promise<Map<string, DatosPersona>> => leerTablas(c, 'v2_principal', 'v2_docs');
async function leerTablas(c: pg.ClientBase, principal: string, docs: string): Promise<Map<string, DatosPersona>> {
  const personas = new Map<string, DatosPersona>();
  const de = (p: string): DatosPersona => {
    let d = personas.get(p);
    if (!d) { d = { main: null, cols: {} }; personas.set(p, d); }
    return d;
  };
  for (const r of (await c.query<{ persona: string; datos: Doc }>(`SELECT persona, datos FROM ${principal} ORDER BY persona`)).rows) de(r.persona).main = r.datos;
  for (const r of (await c.query<{ persona: string; col: string; id: string; datos: Doc }>(`SELECT persona, col, id, datos FROM ${docs} ORDER BY persona, col, id`)).rows) {
    (de(r.persona).cols[r.col] ??= []).push({ ...r.datos, id: r.id });
  }
  return personas;
}

const conteos = (d: DatosPersona): Record<string, number> =>
  Object.fromEntries([['principal', d.main ? 1 : 0], ...Object.keys(d.cols).sort().map((k) => [k, d.cols[k]!.length])]);

// One person: convert (v1ACentavos), check each document with the shared contracts, and compare every money rule of
// both engines on today's date (the comparison of the CI, migracion/src/comparar.ts). Returns the converted data, or
// null if something does not fit.
export function convertirPersona(persona: string, d: DatosPersona, v1: MotorV1, hoy: string):
  { informe: InformePersona; convertido: DatosPersona | null } {
  const informe: InformePersona = { persona: enmascarar(persona), documentos: conteos(d), problemas: [], diferencias: [] };
  for (const col of Object.keys(d.cols)) {
    if (!(COLECCIONES as readonly string[]).includes(col)) {
      informe.problemas.push({ coleccion: col, id: null, nombre: null, fecha: null, campo: null, motivo: 'coleccion-desconocida' });
    }
  }
  const aj = (d.main?.aj ?? {}) as Doc;
  const plano: Doc = { aj };
  for (const col of COLECCIONES) plano[col] = d.cols[col] ?? [];
  const conv = dominio.v1ACentavos(plano as never);
  if (!conv.ok) {
    for (const p of conv.problemas) {
      const doc = p.coleccion === 'aj' ? undefined : (d.cols[p.coleccion] ?? []).find((x) => x.id === p.id);
      informe.problemas.push({ coleccion: p.coleccion, id: p.id, nombre: nombreDe(doc), fecha: texto(doc?.fecha), campo: p.campo, motivo: p.motivo });
    }
    return { informe, convertido: null };
  }
  const datos = conv.datos as unknown as Record<string, Doc[]> & { aj: Doc };
  for (const col of COLECCIONES) {
    for (const doc of datos[col] ?? []) {
      const v = validarDocumento(col, doc);
      if (!v.ok) informe.problemas.push({ coleccion: col, id: texto(doc.id), nombre: nombreDe(doc), fecha: texto(doc.fecha), campo: v.campo ?? null, motivo: v.codigo });
    }
  }
  // Both engines on the whole state, the v1 with its defaults as it loads it
  const S1 = { aj: { ...v1.vacio().aj, ...aj } } as unknown as EstadoV1;
  for (const col of COLECCIONES) (S1 as unknown as Record<string, Doc[]>)[col] = d.cols[col] ?? [];
  informe.diferencias = comparar(v1, dominio, hoy, S1);
  if (informe.problemas.length || informe.diferencias.length) return { informe, convertido: null };
  const cols: Record<string, Doc[]> = {};
  for (const col of COLECCIONES) if (d.cols[col]) cols[col] = datos[col] ?? [];
  return { informe, convertido: { main: d.main ? { ...d.main, aj: datos.aj } : null, cols } };
}

async function revisarEn(c: pg.ClientBase, v1: MotorV1, hoy: string) {
  const personas = await leerV1(c);
  const salida = new Map<string, DatosPersona>();
  const informes: InformePersona[] = [];
  for (const [persona, d] of personas) {
    const r = convertirPersona(persona, d, v1, hoy);
    informes.push(r.informe);
    if (r.convertido) salida.set(persona, r.convertido);
  }
  // «Solo revisar» does not even create Rumbo 2's tables: before the cut they may not be there yet
  const hayV2 = (await c.query<{ t: string | null }>(`SELECT to_regclass('v2_migracion') AS t`)).rows[0]?.t != null;
  const yaMigrada = hayV2 && ((await c.query('SELECT 1 FROM v2_migracion LIMIT 1')).rowCount ?? 0) > 0;
  const v2ConDatos = hayV2 ? Number((await c.query<{ n: string }>(
    'SELECT count(*) AS n FROM (SELECT persona FROM v2_principal UNION SELECT persona FROM v2_docs) x')).rows[0]?.n ?? 0) : 0;
  const informe: Informe = { personas: informes, cuadra: informes.every((i) => !i.problemas.length && !i.diferencias.length), yaMigrada, v2ConDatos };
  return { informe, personas, salida };
}

// The Rumbo 2 tables, as servidor/src/base.ts creates them (pruebas/tablas-v2.test.ts checks they are the same): at
// the cut the migration runs before Rumbo 2's server has ever started. Only additive (DAT-05).
export const TABLAS_V2 = `
CREATE TABLE IF NOT EXISTS v2_principal (
    persona     text        PRIMARY KEY,
    datos       jsonb       NOT NULL,
    actualizado timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2_docs (
    persona     text        NOT NULL,
    col         text        NOT NULL,
    id          text        NOT NULL,
    datos       jsonb       NOT NULL,
    actualizado timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (persona, col, id)
);

CREATE TABLE IF NOT EXISTS v2_migracion (
    id      bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hecha   timestamptz NOT NULL DEFAULT now(),
    detalle jsonb       NOT NULL DEFAULT '{}'
);
`;

// «Solo revisar»: reads, converts and verifies; writes nothing.
export async function revisar(c: pg.ClientBase, v1: MotorV1, hoy: string): Promise<Informe> {
  await c.query('BEGIN READ ONLY');
  try { return (await revisarEn(c, v1, hoy)).informe; } finally { await c.query('ROLLBACK').catch(() => {}); }
}

function orden(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(orden);
  if (x && typeof x === 'object') return Object.fromEntries(Object.keys(x).sort().map((k) => [k, orden((x as Doc)[k])]));
  return x;
}
const igualJSON = (a: unknown, b: unknown): boolean => JSON.stringify(orden(a)) === JSON.stringify(orden(b));

// What was written to the Rumbo 2 tables must be, document by document, what the conversion gave.
export function verificarEscrito(escrito: DatosPersona | undefined, convertido: DatosPersona): string[] {
  if (!escrito) return convertido.main || Object.keys(convertido.cols).length ? ['no quedó nada escrito'] : [];
  const dif: string[] = [];
  if (!igualJSON(escrito.main, convertido.main)) dif.push('el documento principal no quedó igual');
  for (const col of new Set([...Object.keys(escrito.cols), ...Object.keys(convertido.cols)])) {
    const a = escrito.cols[col] ?? [], b = convertido.cols[col] ?? [];
    if (a.length !== b.length) { dif.push(`${col}: ${a.length} escritos de ${b.length}`); continue; }
    const porId = new Map(b.map((d) => [d.id, d]));
    for (const d of a) if (!igualJSON(d, porId.get(d.id))) dif.push(`${col} ${String(d.id)} no quedó igual`);
  }
  return dif;
}

export class MigracionNoCuadra extends Error {
  constructor(readonly informe: Informe) { super('La migración no cuadra: no se escribió nada'); }
}

// A check of what was written, besides the comparison; only the tests pass another one.
export type Verificar = (persona: string, v1: DatosPersona, escrito: DatosPersona | undefined) => string[];

// Writes everyone's converted data to the Rumbo 2 tables, in one transaction, and marks the migration as done.
// It refuses to run again once a migration is noted (Rumbo 2 may already have new data), unless `deNuevo`.
export class YaMigrada extends Error {
  constructor() { super('Ya hay una migración anotada: Rumbo 2 puede tener datos nuevos. Si de verdad hay que repetirla, usa --de-nuevo.'); }
}
export async function aplicar(c: pg.ClientBase, v1: MotorV1, hoy: string, o: { verificar?: Verificar; deNuevo?: boolean } = {}): Promise<Informe> {
  await c.query('BEGIN');
  try {
    if (!o.deNuevo && ((await c.query('SELECT 1 FROM v2_migracion LIMIT 1')).rowCount ?? 0) > 0) throw new YaMigrada();
    // Nobody writes the v1 tables while they are read and copied (the v1 waits a moment and then saves)
    await c.query('LOCK TABLE principal, docs IN SHARE MODE');
    const { informe, personas, salida } = await revisarEn(c, v1, hoy);
    if (!informe.cuadra) throw new MigracionNoCuadra(informe);
    await c.query('DELETE FROM v2_docs');
    await c.query('DELETE FROM v2_principal');
    for (const [persona, d] of salida) {
      if (d.main) await c.query('INSERT INTO v2_principal (persona, datos) VALUES ($1, $2)', [persona, d.main]);
      await insertarDocs(c, 'v2_docs', persona, d.cols);
    }
    const escrito = await leerV2(c);
    informe.personas.forEach((i, n) => {
      const persona = [...personas.keys()][n]!;
      i.diferencias.push(...verificarEscrito(escrito.get(persona), salida.get(persona)!), ...(o.verificar?.(persona, personas.get(persona)!, escrito.get(persona)) ?? []));
    });
    informe.cuadra = informe.personas.every((i) => !i.problemas.length && !i.diferencias.length);
    if (!informe.cuadra) throw new MigracionNoCuadra(informe);
    await c.query('INSERT INTO v2_migracion (detalle) VALUES ($1)', [{ hoy, personas: informe.personas.map((i) => ({ persona: i.persona, documentos: i.documentos })) }]);
    await c.query('COMMIT');
    return informe;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  }
}

async function insertarDocs(c: pg.ClientBase, tabla: 'docs' | 'v2_docs', persona: string, cols: Record<string, Doc[]>): Promise<void> {
  const filas = Object.entries(cols).flatMap(([col, docs]) => docs.map((datos) => ({ col, id: String(datos.id), datos })));
  if (!filas.length) return;
  await c.query(
    `INSERT INTO ${tabla} (persona, col, id, datos)
     SELECT $1, x.col, x.id, x.datos FROM jsonb_to_recordset($2::jsonb) AS x(col text, id text, datos jsonb)`,
    [persona, JSON.stringify(filas)]);
}

// Back to the v1: each person's Rumbo 2 data, cents ÷ 100, replaces their v1 data, in one transaction. Whoever has
// nothing in Rumbo 2 keeps their v1 data. The Rumbo 2 tables stay as they are.
export async function volver(c: pg.ClientBase): Promise<{ persona: string; documentos: Record<string, number> }[]> {
  await c.query('BEGIN');
  try {
    await c.query('LOCK TABLE v2_principal, v2_docs IN SHARE MODE');
    const salida: { persona: string; documentos: Record<string, number> }[] = [];
    for (const [persona, d] of await leerV2(c)) {
      const plano: Doc = { aj: d.main?.aj ?? {}, ...d.cols };
      const vuelta = dominio.centavosAV1(plano as never) as unknown as Record<string, Doc[]> & { aj: Doc };
      await c.query('DELETE FROM docs WHERE persona = $1', [persona]);
      await c.query('DELETE FROM principal WHERE persona = $1', [persona]);
      if (d.main) await c.query('INSERT INTO principal (persona, datos) VALUES ($1, $2)', [persona, { ...d.main, aj: vuelta.aj }]);
      await insertarDocs(c, 'docs', persona, Object.fromEntries(Object.keys(d.cols).map((col) => [col, vuelta[col] ?? []])));
      salida.push({ persona: enmascarar(persona), documentos: conteos(d) });
    }
    await c.query('COMMIT');
    return salida;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  }
}

// The report as text, without amounts.
export function textoInforme(i: Informe, detalle = false): string {
  const l: string[] = [];
  for (const p of i.personas) {
    l.push(`Persona ${p.persona}: ${Object.entries(p.documentos).map(([k, n]) => `${n} ${k}`).join(', ')}`);
    for (const x of p.problemas) {
      const que = x.motivo === 'mas-de-2-decimales' ? 'tiene un monto con más de 2 decimales'
        : x.motivo === 'no-es-numero' ? 'tiene un monto que no es un número'
          : x.motivo === 'coleccion-desconocida' ? 'es una colección que Rumbo no conoce' : `no pasa los contratos (${x.motivo})`;
      l.push(`  · ${x.coleccion}${x.id ? ` ${x.id}` : ''}${x.nombre ? ` «${x.nombre}»` : ''}${x.fecha ? ` del ${x.fecha}` : ''}${x.campo ? `, campo ${x.campo}` : ''}: ${que}`);
    }
    if (p.diferencias.length) {
      l.push(`  · ${p.diferencias.length} cálculo(s) no dan lo mismo en la v1 y en Rumbo 2${detalle ? ':' : ' (con --detalle se ven, con sus montos)'}`);
      if (detalle) for (const d of p.diferencias) l.push(`      ${d}`);
    }
    if (!p.problemas.length && !p.diferencias.length) l.push('  · cuadra: los dos motores dan lo mismo');
  }
  if (!i.personas.length) l.push('No hay datos de la v1.');
  if (i.yaMigrada) l.push('Ya hay una migración anotada en v2_migracion.');
  if (i.v2ConDatos) l.push(`Las tablas de Rumbo 2 ya tienen datos de ${i.v2ConDatos} persona(s): --aplicar los reemplaza.`);
  l.push(i.cuadra ? 'Resultado: CUADRA.' : 'Resultado: NO CUADRA. Nada se puede aplicar hasta resolver lo de arriba.');
  return l.join('\n');
}
