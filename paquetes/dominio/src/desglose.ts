// The month's breakdown (DES-01 to DES-04): what came in, what went out and what stayed, in whole cents.
import { aBs, centavos, restar, sumar, sumarPor, type Centavos } from './dinero';
import type { Mes } from './fechas';
import { deudaDe, monedaDe, type Estado } from './modelo';
import { gastoMesCat, nivelTope, type Nivel } from './movimientos';
import type { Ritmo } from './ritmo';
import { bsMov } from './saldos';

export interface ResumenMes {
  entro: Centavos;
  salio: Centavos;
  quedo: Centavos;
  cats: Record<string, Centavos>;
  ingCats: Record<string, Centavos>; // DES-06: income by category; it adds up to `entro`
  capital: Centavos; // capital of the month's debt payments: not an expense
  ajustes: Centavos; // DES-03: adjustments when squaring accounts
  cambio: Centavos; // DES-03: exchange difference when buying or selling dollars
  cierres: Centavos; // DES-03: debts closed without paying or collecting
}

// DES-01: income, expenses (fixed and variable) and what stayed. DES-06: income by category, each in Bs with its own
// exchange rate (MOV-06), the same movements as `entro`. DES-03: what changed net worth without being income
// or expense, apart, so that what stayed + those lines = change of net worth by movements.
export function resumenMes(S: Estado, mes: Mes): ResumenMes {
  const ms = S.movs.filter((m) => m.fecha.slice(0, 7) === mes);
  const ings = ms.filter((m) => m.tipo === 'ingreso');
  const entro = sumarPor(ings, (m) => bsMov(S, m));
  const ingCats: Record<string, Centavos> = {};
  for (const m of ings) { const k = m.categoriaId ?? 'undefined'; ingCats[k] = sumar(ingCats[k] ?? (0 as Centavos), bsMov(S, m)); }
  const cats = gastoMesCat(S, mes), salio = sumarPor(Object.values(cats), (v) => v);
  const capital = sumarPor(ms.filter((m) => m.tipo === 'pago'), (m) => bsMov(S, m, m.capital ?? m.monto));
  const ajustes = sumarPor(ms.filter((m) => m.tipo === 'ajuste'), (m) => centavos((m.sentido || 1) * bsMov(S, m)));
  const cambio = sumarPor(
    ms.filter((m) => m.tipo === 'transferencia' && m.montoDestino != null && monedaDe(S, m.cuentaId) !== monedaDe(S, m.cuentaDestinoId)),
    (m) => {
      const tc = m.tc || S.aj.tc || 0, destino = m.montoDestino as Centavos;
      return monedaDe(S, m.cuentaId) === 'BOB' ? restar(aBs(destino, 'USD', tc), m.monto) : restar(destino, aBs(m.monto, 'USD', tc));
    });
  const cierres = sumarPor(ms.filter((m) => m.tipo === 'cierre'), (m) => centavos((deudaDe(S, m.deudaId)?.tipo === 'teDeben' ? -1 : 1) * bsMov(S, m)));
  return { entro, salio, quedo: restar(entro, salio), cats, ingCats, capital, ajustes, cambio, cierres };
}

export interface DetalleCategoria {
  deCada100: number | null; // DES-02: of every 100 that came in
  horas: number | null; // DES-02: hours of work it costs, if there are hours in Ajustes
  enDiezAnios: number | null; // DES-02: what it adds up to in 10 years at its average (ritmo), an estimate in cents
  pctTope: number | null; // DES-02 and LIM-04: progress of its limit
  nivel: Nivel | null;
}
// DES-02: a category of the month in terms that are felt.
export function detalleCategoria(S: Estado, r: ResumenMes, R: Ritmo, cat: string): DetalleCategoria {
  const v = r.cats[cat] ?? 0, c = S.categorias.find((x) => x.id === cat), tope = c?.tope ?? 0;
  const hora = S.aj.horas > 0 && r.entro > 0 ? r.entro / S.aj.horas : 0;
  const prom = (R.varCat[cat] || 0) + (R.fijCat[cat] || 0);
  return {
    deCada100: r.entro ? (v / (r.entro || 1)) * 100 : null,
    horas: hora ? Math.round(v / hora) : null,
    enDiezAnios: prom ? prom * 120 : null,
    pctTope: tope > 0 ? v / tope : null,
    nivel: tope > 0 ? nivelTope(v / tope) : null,
  };
}
