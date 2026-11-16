// Balances, summing whole cents (CTA-02, CTA-07, MET-02, DEU) and the value in Bs of a movement (MOV-06).
import { aBs, centavos, sumarPor, type Centavos, type Moneda } from './dinero';
import { deudaDe, monedaDe, type Cuenta, type Deuda, type Estado, type Movimiento } from './modelo';

// CTA-07: what happened before an account or debt was opened is already in its opening balance.
export const antesDeAbrir = (o: { desde?: string }, m: Movimiento): boolean => !!o.desde && m.fecha < o.desde;

// CTA-02: opening balance plus its movements. Income, collections and money lent to you add; expenses, payments and
// money you lend subtract; a transfer moves money between two accounts; an adjustment adds or subtracts.
export function saldoCuenta(S: Estado, c: Cuenta): Centavos {
  let s = c.saldoInicial || 0;
  for (const m of S.movs) {
    if (antesDeAbrir(c, m)) continue;
    if (m.tipo === 'transferencia') {
      if (m.cuentaId === c.id) s -= m.monto;
      if (m.cuentaDestinoId === c.id) s += m.montoDestino ?? m.monto;
      continue;
    }
    if (m.cuentaId !== c.id) continue;
    if (m.tipo === 'ingreso' || m.tipo === 'cobro' || m.tipo === 'recibido') s += m.monto;
    else if (m.tipo === 'gasto' || m.tipo === 'pago' || m.tipo === 'prestamo') s -= m.monto;
    else if (m.tipo === 'ajuste') s += (m.sentido || 1) * m.monto;
  }
  return centavos(s);
}

// MET-02: what is set aside for goals in an account, in its currency.
export const apartadoCuenta = (S: Estado, cuentaId: string): Centavos =>
  sumarPor(S.apartados.filter((a) => a.cuentaId === cuentaId), (a) => a.monto);

// DEU: opening balance, minus the capital paid or what was collected or closed, plus what was lent and unpaid interest.
export function saldoDeuda(S: Estado, d: Deuda): Centavos {
  let s = d.saldoInicial || 0;
  for (const m of S.movs) {
    if (m.deudaId !== d.id || antesDeAbrir(d, m)) continue;
    if (m.tipo === 'pago') s -= m.capital ?? m.monto;
    else if (m.tipo === 'cobro' || m.tipo === 'cierre') s -= m.monto;
    else if (m.tipo === 'prestamo' || m.tipo === 'recibido' || m.tipo === 'interes') s += m.monto;
  }
  return centavos(s);
}

// MOV-06: the currency of a movement (its account's, or its debt's when it has no account).
export const monedaMov = (S: Estado, m: Movimiento): Moneda =>
  m.cuentaId ? monedaDe(S, m.cuentaId) : deudaDe(S, m.deudaId)?.moneda ?? 'BOB';
// MOV-06: an amount of a movement in Bs, with the exchange rate saved in it (or today's if it has none).
export const bsMov = (S: Estado, m: Movimiento, v: Centavos = m.monto): Centavos =>
  aBs(v, monedaMov(S, m), m.tc || S.aj.tc || 0);
// The same amount in Bs without rounding, for the estimates (ritmo, projection).
export const bsMovEstimado = (S: Estado, m: Movimiento, v: number = m.monto): number =>
  monedaMov(S, m) === 'USD' ? v * (m.tc || S.aj.tc || 0) : v;
// An amount in Bs without rounding, for the estimates.
export const aBsEstimado = (S: Estado, v: number, moneda: Moneda): number => (moneda === 'USD' ? v * (S.aj.tc || 0) : v);
