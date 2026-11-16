// Goals: setting aside without moving, suggested contribution and «vas bien» (MET-01 to MET-05).
import { CERO, aBs, negar, redondear, restar, sumar, sumarPor, type Centavos } from './dinero';
import { mesDe, mesesEntre, type Dia } from './fechas';
import { activos, bien, cuentaDe, error, monedaDe, type Apartado, type Estado, type Meta, type Resultado } from './modelo';
import { ritmo } from './ritmo';
import { apartadoCuenta, saldoCuenta } from './saldos';

// What a list of set-asides is worth in Bs: exact (each currency added up, then the dollars converted once) and as a
// decimal estimate.
function enBs(S: Estado, aps: readonly Apartado[]): { c: Centavos; estimado: number } {
  const bob = sumarPor(aps.filter((a) => monedaDe(S, a.cuentaId) !== 'USD'), (a) => a.monto);
  const usd = sumarPor(aps.filter((a) => monedaDe(S, a.cuentaId) === 'USD'), (a) => a.monto);
  const tc = S.aj.tc || 0;
  return { c: sumar(bob, aBs(usd, 'USD', tc)), estimado: bob + usd * tc };
}

export interface InfoMeta {
  ap: Centavos; // set aside so far, in Bs
  meses: number; // months left, this one included, until the month before the goal's date
  aporte: Centavos; // suggested a month: (amount − set aside) ÷ months, to the cent
  aporteEstimado: number;
  esteMes: Centavos; // set aside this month, in Bs
  falta: Centavos; // still to set aside this month: suggested − this month, never below 0
  pct: number;
  lista: Apartado[];
}
// MET-03
export function infoMeta(S: Estado, m: Meta, hoy: Dia): InfoMeta {
  const mes = mesDe(hoy), lista = S.apartados.filter((a) => a.metaId === m.id);
  const ap = enBs(S, lista), esteMes = enBs(S, lista.filter((a) => mesDe(a.fecha) === mes));
  const meses = Math.max(1, mesesEntre(mes, m.mes));
  const aporteEstimado = Math.max(0, m.monto - ap.estimado) / meses;
  return {
    ap: ap.c, meses, aporte: redondear(aporteEstimado), aporteEstimado, esteMes: esteMes.c,
    falta: redondear(Math.max(0, aporteEstimado - esteMes.estimado)),
    pct: m.monto ? Math.min(1, ap.estimado / m.monto) : 0, lista,
  };
}

// MET-05: «Vas bien» when the monthly net of the ritmo covers what all the goals ask; if not, how much is missing.
export function estadoMetas(S: Estado, hoy: Dia): { ms: (InfoMeta & { m: Meta })[]; pide: number; neto: number; vasBien: boolean; faltaMes: number } {
  const ms = activos(S.metas).map((m) => ({ m, ...infoMeta(S, m, hoy) }));
  const pide = ms.reduce((t, x) => t + x.aporteEstimado, 0), neto = ritmo(S, hoy).neto;
  return { ms, pide, neto, vasBien: neto >= pide - 50, faltaMes: Math.max(0, pide - neto) };
}

// MET-02: set aside (signo 1) or release (signo −1) part of an account for a goal, without moving it. What is set
// aside in an account never goes above its balance, and a goal releases at most what it has there.
export function apartar(S: Estado, metaId: string, cuentaId: string, monto: Centavos, signo: 1 | -1, hoy: Dia, id: string):
  Resultado<Apartado, 'falta-monto' | 'falta-cuenta' | 'mas-que-el-libre' | 'mas-que-lo-apartado'> {
  const c = cuentaDe(S, cuentaId);
  if (!c) return error('falta-cuenta');
  if (!(monto > 0)) return error('falta-monto');
  if (signo > 0) {
    const libre = restar(saldoCuenta(S, c), apartadoCuenta(S, c.id));
    if (monto > libre) return error('mas-que-el-libre', libre > 0 ? libre : CERO);
  } else {
    const en = sumarPor(S.apartados.filter((a) => a.metaId === metaId && a.cuentaId === c.id), (a) => a.monto);
    if (monto > en) return error('mas-que-lo-apartado', en);
  }
  return bien({ id, metaId, cuentaId: c.id, monto: signo > 0 ? monto : negar(monto), fecha: hoy });
}

// MET-01: archiving a goal frees what was set aside for it (decision 27).
export const archivarMeta = (S: Estado, m: Meta): { meta: Meta; borrarApartados: string[] } =>
  ({ meta: { ...m, archivada: true }, borrarApartados: S.apartados.filter((a) => a.metaId === m.id).map((a) => a.id) });

