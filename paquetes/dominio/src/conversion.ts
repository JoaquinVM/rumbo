// DAT-08: the v1 data (decimal amounts) to cents and back. The same function serves the migration, a v1 backup
// (DAT-04) and the comparison with the v1. Only the 12 money fields change; everything else, unknown fields included,
// stays as it is. The `interes` of a debt is a rate and does not change.

// The money fields of each document. A movement's `interes` is money (the interest of a payment); a debt's is a rate.
export const CAMPOS_DE_DINERO = {
  aj: ['irregular'],
  cuentas: ['saldoInicial'],
  categorias: ['tope'],
  movs: ['monto', 'montoDestino', 'interes', 'capital'],
  fijos: ['monto'],
  deudas: ['saldoInicial', 'cuota'],
  metas: ['monto'],
  apartados: ['monto'],
} as const;
type Lugar = keyof typeof CAMPOS_DE_DINERO;
const COLECCIONES = ['cuentas', 'categorias', 'movs', 'fijos', 'ocurrencias', 'deudas', 'metas', 'apartados'] as const;

export interface Problema {
  coleccion: Lugar;
  id: string | null;
  campo: string;
  valor: unknown;
  motivo: 'mas-de-2-decimales' | 'no-es-numero';
}
type Doc = Record<string, unknown>;
export type DatosV1 = { aj?: Doc } & Partial<Record<(typeof COLECCIONES)[number], Doc[]>> & Doc;

// A decimal amount to cents, exactly, from its shortest text: 0.29 → 29 (not 28.999…). Null if it has more than 2
// decimals; undefined if it is not a number.
export function aCentavos(v: unknown): number | null | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const [mant = '0', exp = '0'] = String(v).toLowerCase().split('e');
  const neg = mant.startsWith('-');
  let [ent = '0', dec = ''] = mant.replace('-', '').split('.');
  let e = Number(exp);
  for (; e > 0; e--) { ent += dec[0] ?? '0'; dec = dec.slice(1); }
  for (; e < 0; e++) { dec = (ent.slice(-1) || '0') + dec; ent = ent.slice(0, -1); }
  dec = dec.replace(/0+$/, '');
  if (dec.length > 2) return null;
  const n = Number((ent || '0') + dec.padEnd(2, '0'));
  if (!Number.isSafeInteger(n)) return undefined;
  return neg && n ? -n : n;
}

function convertirDoc(doc: Doc, lugar: Lugar, problemas: Problema[]): Doc {
  const out: Doc = { ...doc };
  for (const campo of CAMPOS_DE_DINERO[lugar]) {
    if (!(campo in doc) || doc[campo] == null) continue;
    const c = aCentavos(doc[campo]);
    if (c == null) {
      problemas.push({ coleccion: lugar, id: typeof doc.id === 'string' ? doc.id : null, campo, valor: doc[campo], motivo: c === null ? 'mas-de-2-decimales' : 'no-es-numero' });
    } else out[campo] = c;
  }
  return out;
}

// v1 → cents. If an amount has more than 2 decimals or is not a number, nothing is converted and those documents are
// listed, so the person decides.
export function v1ACentavos<T extends DatosV1>(datos: T): { ok: true; datos: T } | { ok: false; problemas: Problema[] } {
  const problemas: Problema[] = [];
  const out: Doc = { ...datos };
  if (datos.aj && typeof datos.aj === 'object') out.aj = convertirDoc(datos.aj, 'aj', problemas);
  for (const col of COLECCIONES) {
    const lista = datos[col];
    if (!Array.isArray(lista)) continue;
    out[col] = col === 'ocurrencias' ? lista.map((d) => ({ ...d })) : lista.map((d) => convertirDoc(d, col, problemas));
  }
  return problemas.length ? { ok: false, problemas } : { ok: true, datos: out as T };
}

// Cents → v1: each money field ÷ 100, which gives back exactly the v1 decimal.
export function centavosAV1<T extends DatosV1>(datos: T): T {
  const vuelta = (doc: Doc, lugar: Lugar): Doc => {
    const out: Doc = { ...doc };
    for (const campo of CAMPOS_DE_DINERO[lugar]) {
      const v = doc[campo];
      if (typeof v === 'number') out[campo] = v / 100;
    }
    return out;
  };
  const out: Doc = { ...datos };
  if (datos.aj && typeof datos.aj === 'object') out.aj = vuelta(datos.aj, 'aj');
  for (const col of COLECCIONES) {
    const lista = datos[col];
    if (Array.isArray(lista)) out[col] = col === 'ocurrencias' ? lista.map((d) => ({ ...d })) : lista.map((d) => vuelta(d, col));
  }
  return out as T;
}
