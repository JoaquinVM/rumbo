// Loads a migrated copy of the v1 data into the test environment (PUB-07, job 081). Run inside the test container,
// after `pg_restore` put the v1 tables of the last backup (`principal`, `docs`) in its own database:
//   node migracion/dist/cargar-prueba.mjs
// Only the people in CORREOS_PERMITIDOS are copied. In one transaction: each person is converted and checked
// (copia.ts), their Rumbo 2 tables are replaced, a row goes in `v2_migracion` (so /salud answers) and the v1 tables
// are dropped, so no one else's data stays there. If anything does not check out, nothing is written. It prints
// counts, never amounts.
import pg from 'pg';
import { prepararCopia, type Conteos } from './copia';

const personas = (process.env.CORREOS_PERMITIDOS ?? '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
if (!personas.length) { console.error('CORREOS_PERMITIDOS está vacío'); process.exit(1); }

const db = new pg.Client();
await db.connect();
try {
  const tablas = await db.query<{ t: string | null }>("SELECT to_regclass('principal')::text AS t UNION ALL SELECT to_regclass('docs')::text");
  const v2 = await db.query<{ t: string | null }>("SELECT to_regclass('v2_migracion')::text AS t");
  if (tablas.rows.some((r) => !r.t)) throw new Error('Faltan las tablas de la v1 (principal, docs): primero pg_restore del respaldo');
  if (!v2.rows[0]?.t) throw new Error('Faltan las tablas de Rumbo 2: primero levantar el servidor de prueba');

  await db.query('BEGIN');
  const resumen: Record<string, Conteos> = {};
  for (const persona of personas) {
    const main = (await db.query<{ datos: { aj?: unknown } }>('SELECT datos FROM principal WHERE persona = $1', [persona])).rows[0]?.datos ?? null;
    const docs = (await db.query<{ col: string; id: string; datos: Record<string, unknown> }>(
      'SELECT col, id, datos FROM docs WHERE persona = $1 ORDER BY col, id', [persona])).rows;
    const copia = prepararCopia(main, docs);
    if (!copia.ok) throw new Error(`${persona}: ${copia.problemas.join('; ')}`);
    await db.query('DELETE FROM v2_docs WHERE persona = $1', [persona]);
    await db.query('DELETE FROM v2_principal WHERE persona = $1', [persona]);
    if (copia.filas.length) {
      await db.query(
        `INSERT INTO v2_docs (persona, col, id, datos)
         SELECT $1, x.col, x.id, x.datos FROM jsonb_to_recordset($2::jsonb) AS x(col text, id text, datos jsonb)`,
        [persona, JSON.stringify(copia.filas)]);
    }
    await db.query('INSERT INTO v2_principal (persona, datos) VALUES ($1, $2)', [persona, copia.main]);
    resumen[persona] = copia.conteos;
    const c = copia.conteos;
    console.log(`${persona}: ${c.cuentas} cuentas, ${c.movs} movimientos, ${c.fijos} fijos, ${c.ocurrencias} meses de fijos, ` +
      `${c.deudas} deudas, ${c.metas} metas, ${c.apartados} apartados y ${c.categorias} categorías`);
  }
  await db.query('INSERT INTO v2_migracion (detalle) VALUES ($1)', [{ prueba: true, trabajo: '081', personas: resumen }]);
  await db.query('DROP TABLE principal, docs');
  await db.query('COMMIT');
  console.log('Copia cargada: los datos de la v1 quedaron en centavos y se borraron las tablas de la v1 de esta base.');
} catch (e) {
  await db.query('ROLLBACK').catch(() => {});
  console.error(`No se cargó nada: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
