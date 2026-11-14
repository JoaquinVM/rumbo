// Rumbo's database (DAT-03): one person's documents, always filtered by the email of the Access token.
import {readFileSync} from 'node:fs';
import pg from 'pg';

export const COLS = ['cuentas', 'categorias', 'movs', 'fijos', 'ocurrencias', 'deudas', 'metas', 'apartados'];
const ESQUEMA = readFileSync(new URL('./esquema.sql', import.meta.url), 'utf8');

export async function crearBase(config) {
  const pool = new pg.Pool({max: 5, idleTimeoutMillis: 30000, ...config});
  pool.on('error', e => console.error('Postgres:', e.message));
  await pool.query(ESQUEMA);

  async function enTransaccion(fn) {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const r = await fn(c);
      await c.query('COMMIT');
      return r;
    } catch (e) {
      await c.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  }

  return {
    salud: async () => { await pool.query('SELECT 1'); },

    // Same shape the artifact gave the page: the main document ({aj}) or null, and each collection with its ids
    leer: async persona => {
      const [p, d] = await Promise.all([
        pool.query('SELECT datos FROM principal WHERE persona = $1', [persona]),
        pool.query('SELECT col, id, datos FROM docs WHERE persona = $1 ORDER BY col, id', [persona])]);
      const cols = Object.fromEntries(COLS.map(c => [c, []]));
      for (const r of d.rows) if (cols[r.col]) cols[r.col].push({...r.datos, id: r.id});
      return {main: p.rows.length ? p.rows[0].datos : null, cols};
    },

    guardarDoc: (persona, col, id, datos) => pool.query(
      `INSERT INTO docs (persona, col, id, datos) VALUES ($1, $2, $3, $4)
       ON CONFLICT (persona, col, id) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()`,
      [persona, col, id, datos]),

    borrarDoc: (persona, col, id) => pool.query('DELETE FROM docs WHERE persona = $1 AND col = $2 AND id = $3', [persona, col, id]),

    guardarPrincipal: (persona, datos) => pool.query(
      `INSERT INTO principal (persona, datos) VALUES ($1, $2)
       ON CONFLICT (persona) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()`,
      [persona, datos]),

    // Loading a backup (DAT-04) is all or nothing: on any error the person keeps what they had
    reemplazar: (persona, main, filas) => enTransaccion(async c => {
      await c.query('DELETE FROM docs WHERE persona = $1', [persona]);
      await c.query('DELETE FROM principal WHERE persona = $1', [persona]);
      if (filas.length) {
        await c.query(
          `INSERT INTO docs (persona, col, id, datos)
           SELECT $1, x.col, x.id, x.datos FROM jsonb_to_recordset($2::jsonb) AS x(col text, id text, datos jsonb)`,
          [persona, JSON.stringify(filas)]);
      }
      if (main) await c.query('INSERT INTO principal (persona, datos) VALUES ($1, $2)', [persona, main]);
    }),

    // DAT-06: the main document goes too, so the person is back to «not started»
    borrarTodo: persona => enTransaccion(async c => {
      await c.query('DELETE FROM docs WHERE persona = $1', [persona]);
      await c.query('DELETE FROM principal WHERE persona = $1', [persona]);
    }),

    cerrar: () => pool.end(),
  };
}
