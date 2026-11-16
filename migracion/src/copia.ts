// PUB-07 and DAT-08: one person's v1 data (decimal amounts, as `principal` and `docs` keep it) turned into Rumbo 2's
// (cents), checked three ways before anything is written: every amount converts exactly, cents ÷ 100 gives back the
// same documents, and the shared contracts accept them (DAT-09). What it reports never carries an amount: the data are
// private (only collections, ids and fields).
import { validarDatos, type Datos, type Fila, type Principal } from '@rumbo/contratos';
import { centavosAV1, COLECCIONES, v1ACentavos, type DatosV1 } from '@rumbo/dominio';

export type Conteos = Record<(typeof COLECCIONES)[number], number>;
export type Copia =
  | { ok: true; main: Principal; filas: Fila[]; conteos: Conteos }
  | { ok: false; problemas: string[] };

const igual = (a: unknown, b: unknown): boolean => JSON.stringify(orden(a)) === JSON.stringify(orden(b));
function orden(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(orden);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, orden((v as Record<string, unknown>)[k])]));
  return v;
}

export function prepararCopia(main: { aj?: unknown } | null, docs: { col: string; id: string; datos: Record<string, unknown> }[]): Copia {
  if (!main || !main.aj || typeof main.aj !== 'object') return { ok: false, problemas: ['no tiene Ajustes: nunca empezó con sus datos'] };
  const v1: DatosV1 = { aj: main.aj as Record<string, unknown> };
  for (const c of COLECCIONES) v1[c] = docs.filter((d) => d.col === c).map((d) => ({ ...d.datos, id: d.id }));
  const otras = [...new Set(docs.map((d) => d.col).filter((c) => !(COLECCIONES as readonly string[]).includes(c)))];
  if (otras.length) return { ok: false, problemas: otras.map((c) => `colección desconocida: ${c}`) };

  const conv = v1ACentavos(v1);
  if (!conv.ok) return { ok: false, problemas: conv.problemas.map((p) => `${p.coleccion}/${p.id ?? '?'} · ${p.campo}: ${p.motivo}`) };
  if (!igual(centavosAV1(conv.datos), v1)) return { ok: false, problemas: ['la vuelta a decimales no da lo mismo'] };

  const cuerpo: Datos = { main: { aj: conv.datos.aj } as Principal, cols: Object.fromEntries(COLECCIONES.map((c) => [c, conv.datos[c] ?? []])) as Datos['cols'] };
  const v = validarDatos(cuerpo);
  if (!v.ok) return { ok: false, problemas: [`no pasa los contratos: ${v.codigo}${v.campo ? ` en ${v.campo}` : ''}`] };
  const conteos = Object.fromEntries(COLECCIONES.map((c) => [c, cuerpo.cols[c].length])) as Conteos;
  return { ok: true, main: v.datos.main as Principal, filas: v.datos.filas, conteos };
}
