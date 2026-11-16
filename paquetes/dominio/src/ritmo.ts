// The monthly ritmo, the real irregular income and the indicators (PRO-02, DES-04, AJU-01, IND-01 to IND-04). They
// are estimates: they start from cents and are decimal numbers of cents, rounded when shown.
import { aBs, type Centavos } from './dinero';
import { diasEntre, sumarDias, type Dia, type Mes } from './fechas';
import { activos, deudaDe, fijosActivos, monedaDe, type Estado, type Fijo, type Movimiento } from './modelo';
import { deudasBs, totalCuentasBs } from './cuentas';
import { infoPrestamo, interesDelMes } from './prestamos';
import { aBsEstimado, bsMovEstimado, saldoDeuda } from './saldos';

// The last 90 days: from 89 days ago to today, both included.
const enVentana = (m: Movimiento, hoy: Dia): boolean => m.fecha >= sumarDias(hoy, -89) && m.fecha <= hoy;

export interface Ritmo {
  fijIng: number;
  fijGas: number;
  irr: number;
  varCat: Record<string, number>; // average a month of the variable expenses, by category
  fijCat: Record<string, number>; // fixed expenses by category; of a loan's payment, only its interest (DES-04)
  varGas: number;
  ingreso: number;
  gasto: number;
  neto: number;
  capital: number; // capital of this month's loan payments: savings (IND-01)
  months: number;
}

// PRO-02: fixed income + expected irregular income − fixed expenses − average of the variable expenses of the last
// 90 days by category, over the months since the first one in that window (at least 1, at most 3).
export function ritmo(S: Estado, hoy: Dia): Ritmo {
  const act = fijosActivos(S);
  const bsF = (f: Fijo): number => aBsEstimado(S, f.monto, monedaDe(S, f.cuentaId));
  const sumF = (l: Fijo[]): number => l.reduce((t, f) => t + (bsF(f) || 0), 0);
  const fijIng = sumF(act.filter((f) => f.tipo === 'ingreso')), fijGas = sumF(act.filter((f) => f.tipo === 'gasto'));
  const win = S.movs.filter((m) => m.tipo === 'gasto' && !m.fijoId && enVentana(m, hoy));
  let months = 1;
  if (win.length) {
    const primero = win.map((m) => m.fecha).sort()[0] ?? hoy;
    months = Math.min(3, Math.max(1, (diasEntre(primero, hoy) + 0.5 + 1) / 30.44));
  }
  const varCat: Record<string, number> = {};
  for (const m of win) {
    const k = m.categoriaId ?? 'undefined';
    varCat[k] = (varCat[k] || 0) + bsMovEstimado(S, m) / months;
  }
  const fijCat: Record<string, number> = {};
  let capital = 0;
  for (const f of act.filter((x) => x.tipo === 'gasto')) {
    const d = f.deudaId ? deudaDe(S, f.deudaId) : undefined;
    let v = bsF(f);
    if (d && d.tipo === 'prestamo' && !d.archivada) {
      const sd = aBs(saldoDeuda(S, d), d.moneda, S.aj.tc || 0), it = Math.min(v, interesDelMes(sd, d.interes));
      capital += Math.max(0, Math.min(v - it, sd));
      v = it;
    }
    fijCat[f.categoriaId] = (fijCat[f.categoriaId] || 0) + v;
  }
  const irr = S.aj.irregular || 0, varGas = Object.values(varCat).reduce((t, x) => t + (x || 0), 0);
  const ingreso = fijIng + irr, gasto = fijGas + varGas;
  return { fijIng, fijGas, irr, varCat, fijCat, varGas, ingreso, gasto, neto: ingreso - gasto, capital, months };
}

// AJU-01: the real average of variable income of the last 90 days, a month (÷ 3).
export const promedioIrregular = (S: Estado, hoy: Dia): number =>
  S.movs.filter((m) => m.tipo === 'ingreso' && !m.fijoId && enVentana(m, hoy)).reduce((t, m) => t + (bsMovEstimado(S, m) || 0), 0) / 3;

export interface Indicadores {
  R: Ritmo;
  tasa: number; // IND-01: (net + capital of the loan payments) ÷ income
  colchon: number; // IND-02: months the accounts last at the monthly expense; what you are owed does not count
  deudaTotal: Centavos; // IND-04: loans and debts with people, in Bs
  libreDePrestamos: Mes | null;
  hayPrestamos: boolean;
}
export function indicadores(S: Estado, hoy: Dia): Indicadores {
  const R = ritmo(S, hoy), cuentas = totalCuentasBs(S);
  const prest = activos(S.deudas).filter((d) => d.tipo === 'prestamo').map((d) => infoPrestamo(S, d, hoy));
  const fines = prest.map((p) => p.fin).filter((f): f is Mes => !!f).sort();
  return {
    R, tasa: R.ingreso > 0 ? (R.neto + R.capital) / R.ingreso : 0, colchon: R.gasto > 0 ? cuentas / R.gasto : 0,
    deudaTotal: deudasBs(S, ['prestamo', 'persona']),
    libreDePrestamos: prest.length && fines.length === prest.length ? fines[fines.length - 1] ?? null : null,
    hayPrestamos: prest.length > 0,
  };
}
