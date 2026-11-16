// Interest and amortization of a loan (DEU-02, DEU-04, DEU-05, DEU-08, PRO-08), in whole cents.
import { CERO, centavos, minimo, porTasa, restar, sumar, type Centavos } from './dinero';
import { mesDe, sumarMeses, type Dia, type Mes } from './fechas';
import type { Deuda, Estado } from './modelo';
import { saldoDeuda } from './saldos';

// DEU-02: a month of interest, balance × annual rate ÷ 12, rounded to the cent. 1840000 at 14 % → 21467.
export const interesDelMes = (saldo: Centavos, tasaAnual: number | undefined): Centavos => porTasa(saldo, tasaAnual || 0, 1200);

export interface Fila {
  interes: Centavos;
  capital: Centavos;
  saldo: Centavos;
  pago: Centavos;
}
export interface Amortizacion {
  filas: Fila[];
  interes: Centavos;
  crece: boolean;
}

// DEU-04 and DEU-05: month by month at the current payment (plus an extra one, PRO-08), until it is paid. If a payment
// does not cover the interest, the debt grows and there is no end.
export function amortizar(saldo: Centavos, tasaAnual: number | undefined, cuota: Centavos, extra: Centavos = CERO, max = 600): Amortizacion {
  const filas: Fila[] = [];
  let s = saldo, tot = CERO;
  while (s > 0 && filas.length < max) {
    const it = interesDelMes(s, tasaAnual);
    const pago = minimo(sumar(cuota, extra), sumar(s, it));
    if (pago <= it) return { filas, interes: tot, crece: true };
    const capital = restar(pago, it);
    s = restar(s, capital);
    tot = sumar(tot, it);
    filas.push({ interes: it, capital, saldo: s, pago });
  }
  return { filas, interes: tot, crece: false };
}

// The first month of the table: next month if this month's payment was already made.
export function primerMesCuota(S: Estado, d: Deuda, hoy: Dia): Mes {
  const mes = mesDe(hoy);
  const pagado = S.movs.some((m) => m.tipo === 'pago' && m.deudaId === d.id && mesDe(m.fecha) === mes);
  return pagado ? sumarMeses(mes, 1) : mes;
}

export interface InfoPrestamo extends Amortizacion {
  saldo: Centavos;
  cuotas: number;
  fin: Mes | null;
  desde: Mes;
}
// DEU-04: balance, when it ends and how much interest it will cost at the current payment.
export function infoPrestamo(S: Estado, d: Deuda, hoy: Dia, extra: Centavos = CERO): InfoPrestamo {
  const saldo = saldoDeuda(S, d);
  const a = amortizar(saldo, d.interes, d.cuota ?? CERO, extra);
  const desde = primerMesCuota(S, d, hoy);
  return { saldo, ...a, cuotas: a.filas.length, fin: a.crece || !a.filas.length ? null : sumarMeses(desde, a.filas.length - 1), desde };
}

// PRO-08: paying extra every month: how many months earlier it ends and how much interest it saves.
export function adelantar(S: Estado, d: Deuda, hoy: Dia, extra: Centavos): { fin: Mes; mesesAntes: number; interesAhorrado: Centavos } | null {
  const a = infoPrestamo(S, d, hoy), b = infoPrestamo(S, d, hoy, extra);
  if (!a.fin || !b.fin) return null;
  return { fin: b.fin, mesesAntes: a.cuotas - b.cuotas, interesAhorrado: centavos(a.interes - b.interes) };
}
