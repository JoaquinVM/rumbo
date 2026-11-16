// Dates as text, like the v1: a day is 'AAAA-MM-DD' and a month 'AAAA-MM'. Pure: «today» always comes in as a day.

export type Dia = string;
export type Mes = string;

const DIA_MS = 864e5;
const pad = (n: number): string => String(n).padStart(2, '0');
const partes = (s: string): number[] => s.split('-').map(Number);
const utc = (dia: Dia): number => {
  const [y = 0, m = 1, d = 1] = partes(dia);
  return Date.UTC(y, m - 1, d || 1);
};
const deUtc = (t: number): Dia => {
  const f = new Date(t);
  return `${f.getUTCFullYear()}-${pad(f.getUTCMonth() + 1)}-${pad(f.getUTCDate())}`;
};

export const mesDe = (dia: Dia): Mes => dia.slice(0, 7);
export const diaDelMes = (dia: Dia): number => Number(dia.slice(8, 10));
export function sumarMeses(mes: Mes, n: number): Mes {
  const [y = 0, m = 1] = partes(mes);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`;
}
export function mesesEntre(a: Mes, b: Mes): number {
  const [y1 = 0, m1 = 0] = partes(a), [y2 = 0, m2 = 0] = partes(b);
  return (y2 - y1) * 12 + (m2 - m1);
}
export const sumarDias = (dia: Dia, n: number): Dia => deUtc(utc(dia) + n * DIA_MS);
export const diasEntre = (a: Dia, b: Dia): number => Math.round((utc(b) - utc(a)) / DIA_MS);
export function diasDelMes(mes: Mes): number {
  const [y = 0, m = 1] = partes(mes);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export const primerDiaDelMesSiguiente = (dia: Dia): Dia => `${sumarMeses(mesDe(dia), 1)}-01`;

// FIJ-01: the day of a fixed item in a month; if the month is shorter, the last day.
export const fechaFijo = (dia: number, mes: Mes): Dia => `${mes}-${pad(Math.min(dia, diasDelMes(mes)))}`;
