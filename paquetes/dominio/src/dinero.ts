// Money in whole cents (FMT-05). A `Centavos` is a safe integer with a type brand: TypeScript will not let a rate or a
// loose decimal pass for money. Only porTasa, aBs, dividir and repartir round, and they round like the v1: to the cent,
// half up in absolute value. Showing a amount copies the v1 text exactly (FMT-01, 02, 04).

declare const marca: unique symbol;
export type Centavos = number & { readonly [marca]: 'centavos' };
export type Moneda = 'BOB' | 'USD';
// A amount with its currency: adding Bs to US$ does not compile (DEU-06).
export interface Monto<M extends Moneda = Moneda> {
  readonly centavos: Centavos;
  readonly moneda: M;
}

export class DineroInvalido extends Error {}

// Checks that n is a whole number of cents that fits in a safe integer (9 billion Bs).
export function centavos(n: number): Centavos {
  if (!Number.isSafeInteger(n)) throw new DineroInvalido(`${n} no es un entero de centavos`);
  return (n === 0 ? 0 : n) as Centavos; // no −0
}
export const CERO = centavos(0);

export function sumar(...cs: readonly Centavos[]): Centavos {
  let t = 0;
  for (const c of cs) t += c;
  return centavos(t);
}
export const restar = (a: Centavos, b: Centavos): Centavos => centavos(a - b);
export const negar = (a: Centavos): Centavos => centavos(-a);
export const abs = (a: Centavos): Centavos => centavos(Math.abs(a));
export const maximo = (...cs: readonly Centavos[]): Centavos => centavos(Math.max(...cs));
export const minimo = (...cs: readonly Centavos[]): Centavos => centavos(Math.min(...cs));
export function sumarPor<T>(lista: readonly T[], f: (x: T) => Centavos): Centavos {
  let t = 0;
  for (const x of lista) t += f(x);
  return centavos(t);
}

export const monto = <M extends Moneda>(c: Centavos, moneda: M): Monto<M> => ({ centavos: c, moneda });
export const sumarMontos = <M extends Moneda>(a: Monto<M>, b: Monto<NoInfer<M>>): Monto<M> =>
  ({ centavos: sumar(a.centavos, b.centavos), moneda: a.moneda });
export const restarMontos = <M extends Moneda>(a: Monto<M>, b: Monto<NoInfer<M>>): Monto<M> =>
  ({ centavos: restar(a.centavos, b.centavos), moneda: a.moneda });

// ---------- rounding ----------

// The exact value of a decimal number as a fraction num / den, from its shortest text (14.5 → 145 / 10).
function fraccion(x: number): { num: bigint; den: bigint } {
  if (!Number.isFinite(x)) throw new DineroInvalido(`${x} no es un número`);
  const [mant = '0', exp = '0'] = String(x).toLowerCase().split('e');
  const neg = mant.startsWith('-');
  const [ent = '0', dec = ''] = mant.replace('-', '').split('.');
  let num = BigInt(ent + dec), den = 10n ** BigInt(dec.length);
  const e = Number(exp);
  if (e > 0) num *= 10n ** BigInt(e);
  else if (e < 0) den *= 10n ** BigInt(-e);
  return { num: neg ? -num : num, den };
}

// n / d rounded to an integer, half up in absolute value, without floating point.
function dividirExacto(n: bigint, d: bigint): Centavos {
  const neg = (n < 0n) !== (d < 0n);
  const an = n < 0n ? -n : n, ad = d < 0n ? -d : d;
  let q = an / ad;
  if ((an % ad) * 2n >= ad) q += 1n;
  return centavos(Number(neg ? -q : q));
}

// c × rate ÷ divisor, rounded to the cent. Exact: 1840000 × 14 ÷ 1200 = 21466,67 → 21467.
export function porTasa(c: Centavos, tasa: number, divisor = 1): Centavos {
  if (!Number.isSafeInteger(divisor) || divisor === 0) throw new DineroInvalido(`divisor ${divisor}`);
  const { num, den } = fraccion(tasa);
  return dividirExacto(BigInt(c) * num, den * BigInt(divisor));
}

// Dollars to bolivianos with an exchange rate, rounded to the cent (CTA-05, MOV-06). Bs stay as they are.
export function aBs(c: Centavos, moneda: Moneda, tc: number): Centavos {
  return moneda === 'USD' ? porTasa(c, tc) : c;
}

// c ÷ n rounded to the cent (MET-03).
export function dividir(c: Centavos, n: number): Centavos {
  if (!Number.isSafeInteger(n) || n === 0) throw new DineroInvalido(`no se divide entre ${n}`);
  return dividirExacto(BigInt(c), BigInt(n));
}

// c in n parts that add up to c exactly; the first parts take the leftover cents.
export function repartir(c: Centavos, n: number): Centavos[] {
  if (!Number.isSafeInteger(n) || n < 1) throw new DineroInvalido(`no se reparte en ${n}`);
  const signo = c < 0 ? -1 : 1, a = Math.abs(c), base = Math.floor(a / n), resto = a % n;
  return Array.from({ length: n }, (_, i) => centavos(signo * (base + (i < resto ? 1 : 0))));
}

// An estimate (a decimal number of cents) rounded to the cent, half up in absolute value.
export function redondear(x: number): Centavos {
  if (!Number.isFinite(x)) throw new DineroInvalido(`${x} no es un número`);
  return centavos(Math.sign(x) * Math.floor(Math.abs(x) + 0.5));
}

// ---------- reading (FMT-03) ----------

export type Lectura = { ok: true; centavos: Centavos } | { ok: false; codigo: 'mas-de-2-decimales' | 'muy-grande' };

// Reads a amount as people write it: dot or comma for thousands and for decimals, like the v1 (parseAmt). «12,345» is
// thousands; «0,125» and «1.500,125» have more than 2 decimals and are not read. Empty or without digits is 0.
export function leer(texto: unknown): Lectura {
  let s = String(texto ?? '').replace(/[^\d.,]/g, '');
  const punto = s.lastIndexOf('.'), coma = s.lastIndexOf(',');
  if (punto >= 0 && coma >= 0) {
    const dec = punto > coma ? '.' : ',';
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.');
  } else if (punto >= 0 || coma >= 0) {
    const partes = s.split(punto >= 0 ? '.' : ',');
    const ultima = partes[partes.length - 1] ?? '';
    const miles = partes.length > 2 || (ultima.length === 3 && partes[0] !== '0' && partes[0] !== '');
    s = miles ? partes.join('') : partes.join('.');
  }
  const m = /^(\d*)(?:\.(\d*))?/.exec(s);
  const ent = m?.[1] ?? '', dec = (m?.[2] ?? '').replace(/0+$/, '');
  if (dec.length > 2) return { ok: false, codigo: 'mas-de-2-decimales' };
  const n = Number((ent || '0') + dec.padEnd(2, '0'));
  if (!Number.isSafeInteger(n)) return { ok: false, codigo: 'muy-grande' };
  return { ok: true, centavos: centavos(n) };
}

// Like leer, with a leading minus sign (balances, CTA-03).
export function leerConSigno(texto: unknown): Lectura {
  const r = leer(texto);
  return r.ok && /^\s*[-−]/.test(String(texto ?? '')) ? { ok: true, centavos: negar(r.centavos) } : r;
}

// ---------- showing (FMT-01, 02, 04) ----------
// Same text as the v1 (money, usd, fmtN). The amount is in cents and may be an estimate with fractions of a cent.

export function mostrarNumero(c: number, decimales = 0): string {
  const s = Math.abs(c / 100).toFixed(decimales);
  const [e = '', d] = s.split('.');
  return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
}

// «Bs 1.234,50». With signo, positive amounts carry «+».
export function mostrar(c: number, decimales = 0, signo = false): string {
  const v = decimales ? Math.round(c) : Math.round(c / 100) * 100;
  const pre = v < 0 ? '−' : signo && v > 0 ? '+' : '';
  return `${pre}Bs ${mostrarNumero(v, decimales)}`;
}

// «US$ 1.234,50»
export const mostrarUsd = (c: number, decimales = 0): string => `${c < 0 ? '−' : ''}US$ ${mostrarNumero(c, decimales)}`;

export const mostrarEn = (c: number, moneda: Moneda, decimales = 0): string =>
  moneda === 'USD' ? mostrarUsd(c, decimales) : mostrar(c, decimales);
