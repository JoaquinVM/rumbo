// Rumbo 2's tables (DAT-03, design.md «Datos y API»): one person's documents, always filtered by the email of the
// Access token. They live next to the v1 tables (`principal`, `docs`), which this server never reads nor writes: the
// v1 never sees cents, and going back to it does not depend on undoing anything here.
import pg from 'pg';
import { COLECCIONES, type Datos, type Fila, type Principal } from '@rumbo/contratos';

// Applied on every start. Only additive, idempotent statements (DAT-05): nothing here renames, drops or retypes.
// `v2_migracion` gets one row when the migration of the v1 data (DAT-08, job 080) is done and verified.
export const ESQUEMA = `
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

export interface Base {
  migracionHecha(): Promise<boolean>;
  leer(persona: string): Promise<Datos>;
  guardarDoc(persona: string, col: string, id: string, datos: object): Promise<void>;
  borrarDoc(persona: string, col: string, id: string): Promise<void>;
  guardarPrincipal(persona: string, datos: Principal): Promise<void>;
  reemplazar(persona: string, main: Principal | null, filas: Fila[]): Promise<void>;
  borrarTodo(persona: string): Promise<void>;
  cerrar(): Promise<void>;
}

export async function crearBase(config: pg.PoolConfig = {}): Promise<Base> {
  const pool = new pg.Pool({ max: 5, idleTimeoutMillis: 30000, ...config });
  pool.on('error', (e) => console.error('Postgres:', e.message));
  await pool.query(ESQUEMA);

  async function enTransaccion(fn: (c: pg.PoolClient) => Promise<void>): Promise<void> {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      await fn(c);
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  }

  const borrarDePersona = async (c: pg.PoolClient, persona: string) => {
    await c.query('DELETE FROM v2_docs WHERE persona = $1', [persona]);
    await c.query('DELETE FROM v2_principal WHERE persona = $1', [persona]);
  };

  return {
    migracionHecha: async () => (await pool.query('SELECT 1 FROM v2_migracion LIMIT 1')).rowCount === 1,

    // The main document ({aj}) or null, and each collection with its ids
    leer: async (persona) => {
      const [p, d] = await Promise.all([
        pool.query<{ datos: Principal }>('SELECT datos FROM v2_principal WHERE persona = $1', [persona]),
        pool.query<{ col: string; id: string; datos: object }>(
          'SELECT col, id, datos FROM v2_docs WHERE persona = $1 ORDER BY col, id', [persona])]);
      const cols = Object.fromEntries(COLECCIONES.map((c) => [c, [] as object[]])) as Record<string, object[]>;
      for (const r of d.rows) cols[r.col]?.push({ ...r.datos, id: r.id });
      return { main: p.rows[0]?.datos ?? null, cols: cols as Datos['cols'] };
    },

    guardarDoc: async (persona, col, id, datos) => {
      await pool.query(
        `INSERT INTO v2_docs (persona, col, id, datos) VALUES ($1, $2, $3, $4)
         ON CONFLICT (persona, col, id) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()`,
        [persona, col, id, datos]);
    },

    borrarDoc: async (persona, col, id) => {
      await pool.query('DELETE FROM v2_docs WHERE persona = $1 AND col = $2 AND id = $3', [persona, col, id]);
    },

    guardarPrincipal: async (persona, datos) => {
      await pool.query(
        `INSERT INTO v2_principal (persona, datos) VALUES ($1, $2)
         ON CONFLICT (persona) DO UPDATE SET datos = EXCLUDED.datos, actualizado = now()`,
        [persona, datos]);
    },

    // Loading a backup (DAT-04) is all or nothing: on any error the person keeps what they had
    reemplazar: (persona, main, filas) => enTransaccion(async (c) => {
      await borrarDePersona(c, persona);
      if (filas.length) {
        await c.query(
          `INSERT INTO v2_docs (persona, col, id, datos)
           SELECT $1, x.col, x.id, x.datos FROM jsonb_to_recordset($2::jsonb) AS x(col text, id text, datos jsonb)`,
          [persona, JSON.stringify(filas)]);
      }
      if (main) await c.query('INSERT INTO v2_principal (persona, datos) VALUES ($1, $2)', [persona, main]);
    }),

    // DAT-06: the main document goes too, so the person is back to «not started»
    borrarTodo: (persona) => enTransaccion((c) => borrarDePersona(c, persona)),

    cerrar: () => pool.end(),
  };
}
