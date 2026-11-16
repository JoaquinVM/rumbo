// Layer 5 · Presentation models: how amounts and dates read, the same text as the v1 (FMT-01, 02, 04). Money comes in
// cents; rates and percentages are plain numbers. The presentation only knows the contracts, so this copies the
// domain's `mostrar`; formato.test.ts checks that both write the same for every kind of amount.
import type { MonedaApp } from '@rumbo/contratos';

const miles = (e: string): string => e.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// A plain number: «1.234,5» (the v1's fmtN), for rates, percentages and months.
export function decimal(x: number, dec = 0): string {
  const [e = '', d] = Math.abs(x).toFixed(dec).split('.');
  return miles(e) + (d ? ',' + d : '');
}

// Cents as a number in Bs: «1.234,50».
export const numero = (c: number, dec = 0): string => decimal(c / 100, dec);

// «Bs 1.234,50». With signo, positive amounts carry «+».
export function dinero(c: number, dec = 0, signo = false): string {
  const v = dec ? Math.round(c) : Math.round(c / 100) * 100;
  const pre = v < 0 ? '−' : signo && v > 0 ? '+' : '';
  return `${pre}Bs ${numero(v, dec)}`;
}

// «US$ 1.234,50»
export const usd = (c: number, dec = 0): string => `${c < 0 ? '−' : ''}US$ ${numero(c, dec)}`;
export const enMoneda = (c: number, moneda: MonedaApp, dec = 0): string => (moneda === 'USD' ? usd(c, dec) : dinero(c, dec));
export const simbolo = (moneda: MonedaApp): string => (moneda === 'USD' ? 'US$' : 'Bs');
// A percentage or rate with one decimal and no «,0»: «8 %», «14,5 %».
export const porcentaje = (x: number): string => decimal(x, 1).replace(',0', '');

// The chart's labels: «950», «12 k», «1,5 k», «−3 k». In Bs.
export function compacto(n: number): string {
  if (Math.abs(n) < 1000) return (n < 0 ? '−' : '') + decimal(n);
  const k = Math.abs(n) / 1000;
  return `${n < 0 ? '−' : ''}${decimal(k, k >= 100 || Number.isInteger(Math.round(k * 10) / 10) ? 0 : 1)} k`;
}

export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const partes = (s: string): number[] => s.split('-').map(Number);
// «nov 2026»
export const mesCorto = (mes: string): string => { const [y = 0, m = 1] = partes(mes); return `${MESES[m - 1]} ${y}`; };
// «Noviembre de 2026»
export const mesLargo = (mes: string): string => {
  const [y = 0, m = 1] = partes(mes), t = `${MESES_LARGOS[m - 1]} de ${y}`;
  return t[0]!.toUpperCase() + t.slice(1);
};
export const nombreDelMes = (mes: string): string => MESES_LARGOS[(partes(mes)[1] ?? 1) - 1]!;
export const diaDelMes = (dia: string): number => partes(dia)[2] ?? 1;
// «10 nov»
export const diaCorto = (dia: string): string => { const [, m = 1, d = 1] = partes(dia); return `${d} ${MESES[m - 1]}`; };
// «lunes 10»
export const diaConNombre = (dia: string): string => {
  const [y = 0, m = 1, d = 1] = partes(dia);
  return `${DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}`;
};
// A month that comes n months after another one.
export function sumarMeses(mes: string, n: number): string {
  const [y = 0, m = 1] = partes(mes), t = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`;
}
// How an amount in cents is written in a field to be edited: «1.500» or «12,50».
export const paraEditar = (c: number): string => (c ? numero(c, c % 100 ? 2 : 0) : '');
