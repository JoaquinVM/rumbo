// Movements: monthly limits and their warnings, quick entry, transfers and the exchange rate of each movement
// (LIM-03, LIM-04, MOV-02, MOV-03, MOV-05, MOV-06).
import { aBs, sumar, type Centavos } from './dinero';
import { mesDe, sumarDias, type Dia, type Mes } from './fechas';
import { activos, monedaDe, type Categoria, type Estado, type Movimiento, type TipoCategoria } from './modelo';
import { bsMov } from './saldos';

// LIM-03 and the Desglose: what was spent in a calendar month by category, in Bs. Of a loan payment only its interest
// counts (in Intereses), and so does unpaid interest. Each dollar movement uses its own exchange rate (MOV-06).
export function gastoMesCat(S: Estado, mes: Mes): Record<string, Centavos> {
  const r: Record<string, Centavos> = {};
  const mas = (k: string, v: Centavos): void => { r[k] = sumar(r[k] ?? (0 as Centavos), v); };
  for (const m of S.movs) {
    if (mesDe(m.fecha) !== mes) continue;
    if (m.tipo === 'gasto') mas(m.categoriaId ?? 'undefined', bsMov(S, m));
    if (m.tipo === 'pago' && m.interes) mas('intereses', bsMov(S, m, m.interes));
    if (m.tipo === 'interes') mas('intereses', bsMov(S, m));
  }
  return r;
}

export type Nivel = 'ok' | 'ambar' | 'rojo';
// LIM-04: amber from 80 %, red from 100 %.
export const nivelTope = (p: number): Nivel => (p >= 1 ? 'rojo' : p >= 0.8 ? 'ambar' : 'ok');

export interface AvanceTope {
  cat: Categoria;
  gastado: Centavos;
  pct: number;
  nivel: Nivel;
}
// LIM-03: progress of each limit in the month; `extra` is an expense being written (MOV-05).
export function avanceTopes(S: Estado, mes: Mes, extra: { cat: string; monto: Centavos } | null = null): AvanceTope[] {
  const g = gastoMesCat(S, mes);
  if (extra) g[extra.cat] = sumar(g[extra.cat] ?? (0 as Centavos), extra.monto);
  return activos(S.categorias).filter((c) => (c.tope ?? 0) > 0 && c.tipo === 'gasto').map((c) => {
    const gastado = g[c.id] ?? (0 as Centavos), pct = gastado / (c.tope as number);
    return { cat: c, gastado, pct, nivel: nivelTope(pct) };
  });
}

// MOV-05: when an expense being written leaves its category at 80 % of its limit or more, how much it will have. The
// movement being edited does not count twice.
export function avisoTope(S: Estado, g: { id: string; categoriaId: string; cuentaId: string; monto: Centavos; fecha: Dia }): number | null {
  const sin = S.movs.some((m) => m.id === g.id) ? { ...S, movs: S.movs.filter((m) => m.id !== g.id) } : S;
  const bs = monedaDe(S, g.cuentaId) === 'USD' ? bsMov(S, { id: g.id, tipo: 'gasto', fecha: g.fecha, monto: g.monto, cuentaId: g.cuentaId }) : g.monto;
  const t = avanceTopes(sin, mesDe(g.fecha), { cat: g.categoriaId, monto: bs }).find((x) => x.cat.id === g.categoriaId);
  return t && t.pct >= 0.8 ? t.pct : null;
}

// MOV-02: categories of a type, the most used of the last 90 days first.
export function categoriasPorUso(S: Estado, tipo: TipoCategoria, hoy: Dia): Categoria[] {
  const desde = sumarDias(hoy, -89), n: Record<string, number> = {};
  S.movs.filter((m) => m.tipo === tipo && m.fecha >= desde).forEach((m) => { const k = m.categoriaId ?? ''; n[k] = (n[k] || 0) + 1; });
  return activos(S.categorias).filter((c) => c.tipo === tipo).sort((a, b) => (n[b.id] || 0) - (n[a.id] || 0));
}
// MOV-02: the 3 notes most written in a category.
export function notasSugeridas(S: Estado, cat: string): string[] {
  const n: Record<string, number> = {};
  S.movs.filter((m) => m.categoriaId === cat && m.nota).forEach((m) => { const k = m.nota as string; n[k] = (n[k] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
}

// MOV-03: a transfer goes between two different accounts; between currencies it needs what arrived.
export function validarTransferencia(S: Estado, t: { cuentaId: string; cuentaDestinoId?: string | null; monto: Centavos; montoDestino?: Centavos | null }):
  'falta-monto' | 'misma-cuenta' | 'falta-monto-destino' | null {
  if (!(t.monto > 0)) return 'falta-monto';
  if (!t.cuentaDestinoId || t.cuentaDestinoId === t.cuentaId) return 'misma-cuenta';
  if (monedaDe(S, t.cuentaId) !== monedaDe(S, t.cuentaDestinoId) && !t.montoDestino) return 'falta-monto-destino';
  return null;
}

// MOV-06: a movement of a dollar account keeps the exchange rate of the day it is written.
export function conTipoDeCambio(S: Estado, m: Movimiento): Movimiento {
  if (m.tc != null || ![m.cuentaId, m.cuentaDestinoId].some((id) => id && monedaDe(S, id) === 'USD')) return m;
  return { ...m, tc: S.aj.tc || null };
}

export interface DiaDeMovimientos {
  fecha: Dia;
  movs: Movimiento[];
  gastado: Centavos; // expenses of the day in Bs, with today's exchange rate like the v1
}
// MOV-04: the movements of a calendar month, newest first, grouped by day with what was spent, and only those that go
// in or out of an account if there is a filter.
export function movimientosDelMes(S: Estado, mes: Mes, cuentaId: string | 'todas' = 'todas'): DiaDeMovimientos[] {
  const toca = (m: Movimiento): boolean => cuentaId === 'todas' || m.cuentaId === cuentaId || m.cuentaDestinoId === cuentaId;
  const ms = S.movs.filter((m) => mesDe(m.fecha) === mes && toca(m))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.id > a.id ? 1 : -1));
  const dias: DiaDeMovimientos[] = [];
  for (const m of ms) {
    let d = dias[dias.length - 1];
    if (!d || d.fecha !== m.fecha) dias.push((d = { fecha: m.fecha, movs: [], gastado: 0 as Centavos }));
    d.movs.push(m);
    if (m.tipo === 'gasto') d.gastado = sumar(d.gastado, aBs(m.monto, monedaDe(S, m.cuentaId), S.aj.tc || 0));
  }
  return dias;
}

// MOV-07: whether a movement counts for a category, the same way the Desglose adds it up (gastoMesCat): the expenses
// or income of that category, also those of confirmed fixed items; in Intereses also the loan payments, for their
// interest only, and the unpaid interest. A loan made out of an expense keeps the category of the expense but is not
// an expense, so it does not count.
export const cuentaParaCategoria = (m: Movimiento, cat: string): boolean =>
  ((m.tipo === 'gasto' || m.tipo === 'ingreso') && m.categoriaId === cat) ||
  (cat === 'intereses' && (m.tipo === 'interes' || (m.tipo === 'pago' && !!m.interes)));

// MOV-07: what a movement adds to its category, in Bs with its own exchange rate (MOV-06): a loan payment, its interest.
export const montoParaCategoria = (S: Estado, m: Movimiento): Centavos =>
  bsMov(S, m, m.tipo === 'pago' ? (m.interes ?? (0 as Centavos)) : m.monto);

export interface MovimientosDeCategoria {
  dias: DiaDeMovimientos[]; // `gastado` is what each day adds to the category
  total: Centavos;
  cantidad: number;
}

// MOV-07: the movements of a month that count for a category, newest first and grouped by day, with what each day and
// the whole month add to it. Without an account filter the total is the category's in the Desglose of that month.
export function movimientosDeCategoria(S: Estado, mes: Mes, cat: string, cuentaId: string | 'todas' = 'todas'): MovimientosDeCategoria {
  const dias = movimientosDelMes({ ...S, movs: S.movs.filter((m) => cuentaParaCategoria(m, cat)) }, mes, cuentaId);
  let total = 0 as Centavos, cantidad = 0;
  for (const d of dias) {
    d.gastado = sumar(...d.movs.map((m) => montoParaCategoria(S, m)));
    total = sumar(total, d.gastado);
    cantidad += d.movs.length;
  }
  return { dias, total, cantidad };
}

// MOV-07: the categories that can be picked in a month: the active ones and the archived ones with movements in it.
export function categoriasParaElegir(S: Estado, mes: Mes): Categoria[] {
  const usadas = new Set(S.movs.filter((m) => mesDe(m.fecha) === mes).map((m) => m.categoriaId));
  return S.categorias.filter((c) => !c.archivada || usadas.has(c.id));
}
