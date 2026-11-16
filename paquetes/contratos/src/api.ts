// The API of Rumbo 2 (design.md, Datos y API): the same shape as the v1 under /api/v2. The page validates with these
// functions before it queues a write and the server before it writes (DAT-09), so both apply the same rules.
//   GET    /api/v2/datos             → Datos
//   PUT    /api/v2/datos             ← Datos (loading a backup: all or nothing)
//   DELETE /api/v2/datos             (DAT-06)
//   PUT    /api/v2/ajustes           ← Principal
//   PUT    /api/v2/docs/<col>/<id>   ← a document of that collection
//   DELETE /api/v2/docs/<col>/<id>
// A rejected request answers {error: <code>, campo?: <path of the field>}.
import { z } from 'zod';
import { COLECCIONES, ESQUEMAS, ID, Principal, type CodigoDocumento, type Coleccion, type Documento } from './documentos.js';

export const RAIZ_API = '/api/v2';

export const CODIGOS_ERROR = [
  // the document or the backup
  'documento-invalido', 'falta-campo', 'falta-categoria', 'monto-no-entero', 'tipo-desconocido', 'moneda-desconocida',
  'fecha-invalida', 'mes-invalido', 'id-invalido', 'campo-invalido',
  'coleccion-desconocida', 'id-distinto', 'id-repetido', 'respaldo-invalido', 'ajustes-invalidos',
  // the request
  'json-invalido', 'demasiado-grande', 'no-existe',
  // the session (PUB-01)
  'sin-sesion', 'correo-no-permitido', 'access-no-responde',
  // the server
  'sin-migracion', 'error-del-servidor',
] as const satisfies readonly (CodigoDocumento | string)[];
export type CodigoError = (typeof CODIGOS_ERROR)[number];
export const RespuestaError = z.object({ error: z.enum(CODIGOS_ERROR), campo: z.string().optional() });
export type RespuestaError = z.infer<typeof RespuestaError>;

export type Validado<T> = { ok: true; datos: T } | { ok: false; codigo: CodigoError; campo?: string };

const esObjeto = (o: unknown): o is Record<string, unknown> => o !== null && typeof o === 'object' && !Array.isArray(o);
const esColeccion = (c: unknown): c is Coleccion => (COLECCIONES as readonly unknown[]).includes(c);
const CONOCIDOS = new Set<string>(CODIGOS_ERROR);

// The first problem Zod found, as a code and the path of its field (`monto`, `aj.irregular`).
function primerProblema(e: z.ZodError, prefijo: string): { ok: false; codigo: CodigoError; campo?: string } {
  const p = e.issues[0];
  const codigo = p && CONOCIDOS.has(p.message) ? (p.message as CodigoError) : 'campo-invalido';
  const campo = [prefijo, ...(p?.path ?? []).map(String)].filter(Boolean).join('.');
  return campo ? { ok: false, codigo, campo } : { ok: false, codigo };
}

// A document of a collection. Unknown fields stay: `datos` is the same object that came in.
export function validarDocumento<C extends Coleccion>(col: C, doc: unknown, prefijo?: string): Validado<Documento<C>>;
export function validarDocumento(col: unknown, doc: unknown, prefijo?: string): Validado<Documento>;
export function validarDocumento(col: unknown, doc: unknown, prefijo = ''): Validado<Documento> {
  if (!esColeccion(col)) return { ok: false, codigo: 'coleccion-desconocida' };
  if (!esObjeto(doc)) return prefijo ? { ok: false, codigo: 'documento-invalido', campo: prefijo } : { ok: false, codigo: 'documento-invalido' };
  const r = ESQUEMAS[col].safeParse(doc);
  return r.success ? { ok: true, datos: doc as Documento } : primerProblema(r.error, prefijo);
}

// The body of PUT /api/v2/docs/<col>/<id>: the id of the URL goes in the document; if the body has another, it fails.
export function validarDocumentoDeRuta(col: string, id: string, doc: unknown): Validado<Documento> {
  if (!esColeccion(col)) return { ok: false, codigo: 'coleccion-desconocida' };
  if (!ID.test(id)) return { ok: false, codigo: 'id-invalido' };
  if (!esObjeto(doc)) return { ok: false, codigo: 'documento-invalido' };
  if (doc.id !== undefined && doc.id !== id) return { ok: false, codigo: 'id-distinto' };
  return validarDocumento(col, { ...doc, id });
}

export function validarPrincipal(main: unknown, prefijo = ''): Validado<Principal> {
  if (!esObjeto(main) || !esObjeto(main.aj)) return { ok: false, codigo: 'ajustes-invalidos' };
  const r = Principal.safeParse(main);
  return r.success ? { ok: true, datos: main as Principal } : primerProblema(r.error, prefijo);
}

// Everything a person has: the main document (or null before starting) and each collection.
export type Datos = { main: Principal | null; cols: { [C in Coleccion]: Documento<C>[] } };
export type Fila = { col: Coleccion; id: string; datos: Documento };

// The body of PUT /api/v2/datos, as the rows to write. One bad document and nothing is written.
export function validarDatos(cuerpo: unknown): Validado<{ main: Principal | null; filas: Fila[] }> {
  if (!esObjeto(cuerpo) || !esObjeto(cuerpo.cols) || !('main' in cuerpo)) return { ok: false, codigo: 'respaldo-invalido' };
  let main: Principal | null = null;
  if (cuerpo.main !== null) {
    const p = validarPrincipal(cuerpo.main, 'main');
    if (!p.ok) return p;
    main = p.datos;
  }
  const filas: Fila[] = [];
  for (const [col, lista] of Object.entries(cuerpo.cols)) {
    if (!esColeccion(col)) return { ok: false, codigo: 'coleccion-desconocida', campo: `cols.${col}` };
    if (!Array.isArray(lista)) return { ok: false, codigo: 'respaldo-invalido', campo: `cols.${col}` };
    const vistos = new Set<string>();
    for (const [i, doc] of lista.entries()) {
      const v = validarDocumento(col, doc, `cols.${col}.${i}`);
      if (!v.ok) return v;
      if (vistos.has(v.datos.id)) return { ok: false, codigo: 'id-repetido', campo: `cols.${col}.${i}.id` };
      vistos.add(v.datos.id);
      filas.push({ col, id: v.datos.id, datos: v.datos });
    }
  }
  return { ok: true, datos: { main, filas } };
}
