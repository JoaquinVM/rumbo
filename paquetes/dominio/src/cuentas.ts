// Accounts, exchange rate and net worth (CTA-03 to CTA-08, AJU-04).
import { aBs, abs, restar, sumar, sumarPor, type Centavos } from './dinero';
import { diasEntre, type Dia } from './fechas';
import { bien, error, monedaDe, type Ajustes, type Cuenta, type Estado, type Movimiento, type Resultado, type TipoDeuda } from './modelo';
import { antesDeAbrir, saldoCuenta, saldoDeuda } from './saldos';

// Sum of the accounts in Bs, each dollar account converted with today's exchange rate.
export const totalCuentasBs = (S: Estado): Centavos =>
  sumarPor(S.cuentas, (c) => aBs(saldoCuenta(S, c), c.moneda, S.aj.tc || 0));

// Sum in Bs of the open debts of some types.
export const deudasBs = (S: Estado, tipos: readonly TipoDeuda[]): Centavos =>
  sumarPor(S.deudas.filter((d) => tipos.includes(d.tipo) && !d.archivada), (d) => aBs(saldoDeuda(S, d), d.moneda, S.aj.tc || 0));

// CTA-05: accounts + what you are owed − what you owe, in Bs; and about how much that is in dollars.
export function patrimonio(S: Estado): { cuentas: Centavos; teDeben: Centavos; deudas: Centavos; total: Centavos; enDolares: number } {
  const cuentas = totalCuentasBs(S), teDeben = deudasBs(S, ['teDeben']), deudas = deudasBs(S, ['prestamo', 'persona']);
  const total = restar(sumar(cuentas, teDeben), deudas);
  return { cuentas, teDeben, deudas, total, enDolares: S.aj.tc ? total / S.aj.tc : 0 };
}

// CTA-04: how many days old the exchange rate is.
export const diasDelTipoDeCambio = (S: Estado, hoy: Dia): number | null => (S.aj.tcFecha ? diasEntre(S.aj.tcFecha, hoy) : null);
export const tipoDeCambioViejo = (S: Estado, hoy: Dia): boolean => {
  const d = diasDelTipoDeCambio(S, hoy);
  return d == null || d > 7;
};

// CTA-06: the rate of an exchange between Bs and dollars, Bs per dollar (not rounded: «a Bs 12,50 por dólar»).
export const tipoDeCambioDe = (bs: Centavos, usd: Centavos): number | null => (usd ? bs / 100 / (usd / 100) : null);
// CTA-06: the same rate to keep as the exchange rate, rounded to 2 decimals like the v1.
export const tipoDeCambioParaGuardar = (bs: Centavos, usd: Centavos): number | null => {
  const tc = tipoDeCambioDe(bs, usd);
  return tc == null ? null : Math.round(tc * 100) / 100;
};

// CTA-06: the last real exchange between currencies, with its rate.
export function ultimoCambio(S: Estado): { tc: number; fecha: Dia } | null {
  const t = S.movs
    .filter((m) => m.tipo === 'transferencia' && m.montoDestino != null && monedaDe(S, m.cuentaId) !== monedaDe(S, m.cuentaDestinoId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (!t || t.montoDestino == null) return null;
  const desdeBs = monedaDe(S, t.cuentaId) === 'BOB';
  const tc = tipoDeCambioParaGuardar(desdeBs ? t.monto : t.montoDestino, desdeBs ? t.montoDestino : t.monto);
  return tc == null ? null : { tc, fecha: t.fecha };
}

// AJU-04: a new exchange rate takes today's date; the same rate only dates it if it had no date.
export function cambiarTipoDeCambio(aj: Ajustes, tc: number, hoy: Dia): Ajustes {
  if (tc && Math.abs(tc - (aj.tc || 0)) > 0.0001) return { ...aj, tc, tcFecha: hoy };
  if (tc && !aj.tcFecha) return { ...aj, tcFecha: hoy };
  return aj;
}

// CTA-03: the adjustment that leaves the account at the real balance. Null if it was already right.
export function cuadrar(S: Estado, c: Cuenta, real: Centavos, hoy: Dia, id: string): Movimiento | null {
  const dif = restar(real, saldoCuenta(S, c));
  if (!dif) return null;
  return { id, tipo: 'ajuste', cuentaId: c.id, monto: abs(dif), sentido: dif < 0 ? -1 : 1, fecha: hoy, nota: 'Cuadre de cuenta' };
}

// CTA-08: an account is archived only at exactly zero.
export function archivarCuenta(S: Estado, c: Cuenta): Resultado<Cuenta, 'saldo-no-es-cero'> {
  if (c.archivada) return bien({ ...c, archivada: false });
  return saldoCuenta(S, c) === 0 ? bien({ ...c, archivada: true }) : error('saldo-no-es-cero');
}

// CTA-07: the accounts whose balance a movement does not change because it is older than their opening.
export const cuentasAbiertasDespues = (S: Estado, m: Movimiento): Cuenta[] =>
  [m.cuentaId, m.cuentaDestinoId].map((id) => S.cuentas.find((c) => c.id === id)).filter((c): c is Cuenta => !!c && antesDeAbrir(c, m));

