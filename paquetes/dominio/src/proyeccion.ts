// Where the current ritmo leads: projection month by month and «¿Y si…?» (PRO-01 to PRO-08). Estimates: they start
// from cents and stay decimal numbers of cents, rounded only when shown, so they give the same numbers as the v1.
import { centavos, type Centavos } from './dinero';
import { mesDe, mesesEntre, sumarMeses, type Dia, type Mes } from './fechas';
import { calcHoy, alDiaCon } from './hoy';
import { activos, deudaDe, fijosActivos, monedaDe, type Deuda, type Estado, type TipoDeuda } from './modelo';
import { adelantar, infoPrestamo } from './prestamos';
import { ritmo, type Ritmo } from './ritmo';
import { aBsEstimado, saldoCuenta, saldoDeuda } from './saldos';

export interface OpcionesProyeccion {
  nominal?: boolean; // PRO-05: nominal amounts instead of today's money
  recortes?: Record<string, number>; // PRO-08: % cut of a variable category
  extra?: number; // PRO-08: extra income a month, in cents
  adelanto?: { deudaId: string; monto: number } | null; // PRO-08: extra payment a month to a loan, in cents
}
export interface PrestamoProyectado {
  id: string;
  nombre: string;
  s: number;
  i: number;
  cuota: number;
  extra: number;
  conFijo: boolean;
  fin: number | null; // month index where it ends
}
export interface Proyeccion {
  pts: number[]; // net worth month by month, in today's money (or nominal), from today (index 0)
  nom: number[]; // the same, nominal
  R: Ritmo;
  neto: number;
  prest: PrestamoProyectado[];
  rw: number;
}

const deudasEstimadas = (S: Estado, tipos: readonly TipoDeuda[]): number =>
  S.deudas.filter((d) => tipos.includes(d.tipo) && !d.archivada).reduce((t, d) => t + (aBsEstimado(S, saldoDeuda(S, d), d.moneda) || 0), 0);

// PRO-03: starts from today's net worth; every month the accounts grow with their yield (weighted by balance, only
// if positive) and the ritmo's net is added. PRO-05: income and expenses follow inflation, loan payments do not.
// PRO-04: each loan is amortized with its interest and payment; when it ends its payment stops going out.
export function proyectar(S: Estado, hoy: Dia, meses: number, o: OpcionesProyeccion = {}): Proyeccion {
  const R = ritmo(S, hoy);
  let neto = R.neto + (o.extra || 0);
  const esPrestamo = (d: Deuda | undefined): boolean => !!d && d.tipo === 'prestamo' && !d.archivada;
  const cuotasFijas = fijosActivos(S).filter((f) => f.tipo === 'gasto' && f.deudaId && esPrestamo(deudaDe(S, f.deudaId)))
    .reduce((t, f) => t + (aBsEstimado(S, f.monto, monedaDe(S, f.cuentaId)) || 0), 0);
  for (const [cat, p] of Object.entries(o.recortes || {})) neto += ((R.varCat[cat] || 0) * p) / 100;
  const cs = S.cuentas.map((c) => ({ bs: aBsEstimado(S, saldoCuenta(S, c), c.moneda), r: c.rendimiento || 0 }));
  let act = cs.reduce((t, c) => t + (c.bs || 0), 0);
  const pos = cs.filter((c) => c.bs > 0), tot = pos.reduce((t, c) => t + (c.bs || 0), 0);
  const rw = tot > 0 ? pos.reduce((t, c) => t + (c.bs * c.r || 0), 0) / tot : 0;
  const teDeben = deudasEstimadas(S, ['teDeben']), personas = deudasEstimadas(S, ['persona']);
  const prest: PrestamoProyectado[] = activos(S.deudas).filter((d) => d.tipo === 'prestamo').map((d) => ({
    id: d.id, nombre: d.nombre, s: aBsEstimado(S, saldoDeuda(S, d), d.moneda), i: (d.interes || 0) / 100 / 12,
    cuota: aBsEstimado(S, d.cuota || 0, d.moneda), extra: o.adelanto && o.adelanto.deudaId === d.id ? o.adelanto.monto || 0 : 0,
    conFijo: S.fijos.some((f) => f.deudaId === d.id && f.activo !== false), fin: null,
  }));
  const inf = (S.aj.inflacion || 0) / 100;
  const pat = (): number => act + teDeben - personas - prest.reduce((t, p) => t + (Math.max(0, p.s) || 0), 0);
  const pts = [pat()], nom = [pts[0] as number];
  for (let k = 1; k <= meses; k++) {
    let flujo = (neto + cuotasFijas) * Math.pow(1 + inf, (k - 1) / 12);
    for (const p of prest) {
      if (p.s <= 0.5) continue;
      const it = p.s * p.i, pago = Math.min(p.cuota + p.extra, p.s + it);
      p.s -= pago - it;
      flujo -= pago;
      if (p.s <= 0.5 && p.fin == null) p.fin = k;
    }
    act += (act > 0 ? (act * rw) / 100 / 12 : 0) + flujo;
    const v = pat();
    nom.push(v);
    pts.push(o.nominal ? v : v / Math.pow(1 + inf, k / 12));
  }
  return { pts, nom, R, neto, prest, rw };
}

export interface Rumbo {
  meses: number;
  final: number; // PRO-01: what you will have at the horizon (today's money or nominal)
  nominalFinal: number;
  seAcabaEn: Mes | null; // PRO-07: the month the savings run out, if the projection crosses zero
  netoNegativo: number; // PRO-07: how much more goes out than comes in each month
  tcFijo: number | null; // PRO-06: the exchange rate the dollar accounts are projected with
  finesDePrestamos: { deudaId: string; nombre: string; fin: Mes }[]; // PRO-04: marks on the chart
  metas: { metaId: string; nombre: string; mes: Mes; indice: number }[]; // MET-04
  proyeccion: Proyeccion;
}
// PRO-01: the headline and the chart for a horizon of 1, 5, 10 or 20 years.
export function rumbo(S: Estado, hoy: Dia, anios: number, nominal = false): Rumbo {
  const meses = anios * 12, P = proyectar(S, hoy, meses, { nominal }), mes = mesDe(hoy);
  const cero = P.pts.findIndex((v, i) => i > 0 && v < 0 && (P.pts[0] as number) >= 0);
  const finesDePrestamos = activos(S.deudas).filter((d) => d.tipo === 'prestamo')
    .map((d) => ({ deudaId: d.id, nombre: d.nombre, fin: infoPrestamo(S, d, hoy).fin }))
    .filter((x): x is { deudaId: string; nombre: string; fin: Mes } => !!x.fin);
  return {
    meses, final: P.pts[meses] as number, nominalFinal: P.nom[meses] as number,
    seAcabaEn: cero > 0 ? sumarMeses(mes, cero) : null, netoNegativo: -P.R.neto,
    tcFijo: S.cuentas.some((c) => c.moneda === 'USD' && !c.archivada) ? S.aj.tc : null,
    finesDePrestamos,
    metas: activos(S.metas).map((m) => ({ metaId: m.id, nombre: m.nombre, mes: m.mes, indice: mesesEntre(mes, m.mes) })),
    proyeccion: P,
  };
}

// PRO-08: the 4 biggest variable categories, the ones «¿Y si…?» lets you cut.
export const paraRecortar = (R: Ritmo): [string, number][] => Object.entries(R.varCat).sort((a, b) => b[1] - a[1]).slice(0, 4);

export interface YSi {
  final: number;
  diferencia: number; // against carrying on the same
  netoAjustado: number;
  adelanto: { deudaId: string; fin: Mes; mesesAntes: number; interesAhorrado: Centavos; alDia: number } | null;
}
// PRO-08: a second line with the cuts, the extra income and the extra payment to the first loan.
export function ySi(S: Estado, hoy: Dia, anios: number, o: { nominal?: boolean; recortes?: Record<string, number>; extra?: number; adelanto?: number }): YSi {
  const meses = anios * 12, p0 = activos(S.deudas).find((d) => d.tipo === 'prestamo');
  const adel = o.adelanto && p0 ? { deudaId: p0.id, monto: o.adelanto } : null;
  const base = proyectar(S, hoy, meses, { nominal: !!o.nominal });
  const alt = proyectar(S, hoy, meses, { nominal: !!o.nominal, recortes: o.recortes ?? {}, extra: o.extra ?? 0, adelanto: adel });
  let adelanto: YSi['adelanto'] = null;
  if (adel && p0) {
    const a = adelantar(S, p0, hoy, centavos(adel.monto));
    if (a) adelanto = { deudaId: p0.id, ...a, alDia: alDiaCon(calcHoy(S, hoy), adel.monto) };
  }
  const final = alt.pts[meses] as number;
  return { final, diferencia: final - (base.pts[meses] as number), netoAjustado: alt.neto, adelanto };
}
