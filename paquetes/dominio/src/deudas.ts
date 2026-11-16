// Debts: paying, collecting, lending and borrowing, closing, and an expense someone owes you (DEU-01 to DEU-12, FIJ-06).
import { CERO, minimo, restar, sumar, type Centavos, type Moneda } from './dinero';
import { mesDe, type Dia, type Mes } from './fechas';
import { ocurrencia, pendientes, primerMesDeCuota } from './fijos';
import {
  activos, bien, error, monedaDe, type Cuenta, type Deuda, type Estado, type Fijo, type Movimiento, type Ocurrencia,
  type Resultado,
} from './modelo';
import { interesDelMes } from './prestamos';
import { saldoDeuda } from './saldos';

export type TipoMovDeuda = 'pago' | 'cobro' | 'prestamo' | 'recibido';

// DEU-06: only accounts in the debt's currency can pay, collect, lend or receive it.
export const cuentasPara = (S: Estado, moneda: Moneda): Cuenta[] => activos(S.cuentas).filter((c) => c.moneda === moneda);

// DEU-02: the interest of paying a loan today. Other debts have no interest (DEU-03).
export const interesDePago = (S: Estado, d: Deuda, tipo: TipoMovDeuda): Centavos =>
  d.tipo === 'prestamo' && tipo === 'pago' ? interesDelMes(saldoDeuda(S, d), d.interes) : CERO;

// DEU-10: at most the balance plus this month's interest for a payment, and what you are owed for a collection.
export function maximoDe(S: Estado, d: Deuda, tipo: TipoMovDeuda): Centavos | null {
  if (tipo === 'pago') return sumar(saldoDeuda(S, d), interesDePago(S, d, tipo));
  if (tipo === 'cobro') return saldoDeuda(S, d);
  return null;
}

// The amount the form starts with: a loan's payment (or what is left), the balance of other debts, nothing to lend.
export function montoSugerido(S: Estado, d: Deuda, tipo: TipoMovDeuda): Centavos {
  if (d.tipo === 'prestamo' && tipo === 'pago') return minimo(d.cuota ?? CERO, sumar(saldoDeuda(S, d), interesDePago(S, d, tipo)));
  return tipo === 'prestamo' || tipo === 'recibido' ? CERO : saldoDeuda(S, d);
}

// FIJ-06: the month whose loan payment a manual payment settles: the oldest pending one, or this month's, if it is
// not confirmed or skipped. Null if the loan has no payment item or that month is already settled.
export function cuotaQuePaga(S: Estado, d: Deuda, tipo: TipoMovDeuda, hoy: Dia): { fijo: Fijo; mes: Mes } | null {
  if (d.tipo !== 'prestamo' || tipo !== 'pago') return null;
  const fijo = S.fijos.find((f) => f.deudaId === d.id && f.activo !== false && S.cuentas.some((c) => c.id === f.cuentaId));
  if (!fijo) return null;
  const mes = pendientes(S, hoy).find((p) => p.fijo.id === fijo.id)?.mes ?? mesDe(hoy);
  return !ocurrencia(S, fijo.id, mes) && (!fijo.desde || mes >= fijo.desde) ? { fijo, mes } : null;
}

export interface NuevoMovDeuda {
  id: string;
  tipo: TipoMovDeuda;
  monto: Centavos;
  cuentaId: string;
  fecha: Dia;
  nota: string;
  esCuota?: boolean; // FIJ-06: it is the pending payment of the month (yes by default)
}
// DEU-02, DEU-03, DEU-06, DEU-07, DEU-10 and FIJ-06: the movement of a payment, collection, loan given or received,
// and the month it settles. A payment of a loan carries its interest and capital.
export function movimientoDeDeuda(S: Estado, d: Deuda, n: NuevoMovDeuda, hoy: Dia):
  Resultado<{ mov: Movimiento; ocurrencia: Ocurrencia | null }, 'falta-monto' | 'mas-que-el-maximo' | 'otra-moneda'> {
  if (!(n.monto > 0)) return error('falta-monto');
  if (monedaDe(S, n.cuentaId) !== d.moneda || !S.cuentas.some((c) => c.id === n.cuentaId)) return error('otra-moneda');
  const max = maximoDe(S, d, n.tipo);
  if (max != null && n.monto > max) return error('mas-que-el-maximo', max);
  const mov: Movimiento = { id: n.id, tipo: n.tipo, deudaId: d.id, cuentaId: n.cuentaId, monto: n.monto, fecha: n.fecha, nota: n.nota };
  if (n.tipo === 'pago') {
    mov.interes = interesDePago(S, d, n.tipo);
    mov.capital = restar(n.monto, mov.interes);
  }
  const cuota = n.esCuota === false ? null : cuotaQuePaga(S, d, n.tipo, hoy);
  if (!cuota) return bien({ mov, ocurrencia: null });
  mov.fijoId = cuota.fijo.id;
  mov.mes = cuota.mes;
  return bien({ mov, ocurrencia: { id: `${cuota.fijo.id}_${cuota.mes}`, fijoId: cuota.fijo.id, mes: cuota.mes, estado: 'confirmado', movId: mov.id } });
}

export interface NuevaDeuda {
  deuda: Deuda;
  cuentaMov?: string | null; // DEU-07: the money moves today through this account
  cuentaFijo?: string | null; // FIJ-04: create the payment item from this account
  idMov?: string;
  idFijo?: string;
}
// DEU-01, DEU-07 and FIJ-07: a new debt. If the money moves today, the debt starts at 0 and the movement raises it
// (money lent to you is not income). A loan's payment item starts next month if its day already passed.
export function crearDeuda(n: NuevaDeuda, hoy: Dia): { deuda: Deuda; mov: Movimiento | null; fijo: Fijo | null } {
  const monto = n.deuda.saldoInicial;
  const deuda: Deuda = { ...n.deuda, desde: n.deuda.desde ?? hoy };
  let mov: Movimiento | null = null;
  if (n.cuentaMov) {
    deuda.saldoInicial = CERO;
    mov = deuda.tipo === 'teDeben'
      ? { id: n.idMov ?? `p_${deuda.id}`, tipo: 'prestamo', deudaId: deuda.id, cuentaId: n.cuentaMov, monto, fecha: hoy, nota: `Préstamo a ${deuda.nombre}` }
      : { id: n.idMov ?? `r_${deuda.id}`, tipo: 'recibido', deudaId: deuda.id, cuentaId: n.cuentaMov, monto, fecha: hoy, nota: `Te prestó ${deuda.nombre}` };
  }
  const fijo: Fijo | null = deuda.tipo === 'prestamo' && n.cuentaFijo
    ? { id: n.idFijo ?? `c_${deuda.id}`, nombre: `Cuota · ${deuda.nombre}`, tipo: 'gasto', monto: deuda.cuota ?? CERO, cuentaId: n.cuentaFijo,
      categoriaId: 'intereses', dia: deuda.dia ?? 1, deudaId: deuda.id, desde: primerMesDeCuota(deuda.dia, hoy), activo: true }
    : null;
  return { deuda, mov, fijo };
}

// DEU-09: archiving a debt that is not at zero leaves a closing movement for its balance, so it ends at zero and the
// change in net worth shows in the Desglose. Its payment items stop.
export function cerrarDeuda(S: Estado, d: Deuda, hoy: Dia, id: string): { deuda: Deuda; mov: Movimiento | null; fijos: Fijo[] } {
  const sd = saldoDeuda(S, d);
  return {
    deuda: { ...d, archivada: true },
    mov: sd ? { id, tipo: 'cierre', deudaId: d.id, monto: sd, fecha: hoy, nota: `Cierre · ${d.nombre}` } : null,
    fijos: S.fijos.filter((f) => f.deudaId === d.id && f.activo !== false).map((f) => ({ ...f, activo: false })),
  };
}

// DEU-11: who an expense can go to: open «te deben» in the account's currency, opened on the expense's day or before.
export const teDebenPara = (S: Estado, g: Movimiento): Deuda[] =>
  S.deudas.filter((d) => d.tipo === 'teDeben' && !d.archivada && d.moneda === monedaDe(S, g.cuentaId) && !(d.desde && d.desde > g.fecha));

export type ErrorSeparar = 'no-es-gasto' | 'falta-monto' | 'mas-que-el-gasto' | 'falta-quien' | 'falta-nombre';
// DEU-11: all or part of an expense becomes money lent to someone. Returns what to write, in order: the new debt and
// the movements (first the smaller expense, then the loan), so a cut in the middle never counts anything twice.
export function separarGasto(S: Estado, g: Movimiento, monto: Centavos, quien: string | { nombre: string }, ids: { deuda: string; prestamo: string }):
  Resultado<{ deuda: Deuda | null; movs: Movimiento[]; nombre: string; queda: Centavos; moneda: Moneda }, ErrorSeparar> {
  if (g.tipo !== 'gasto') return error('no-es-gasto');
  const moneda = monedaDe(S, g.cuentaId);
  if (!(monto > 0)) return error('falta-monto');
  if (monto > g.monto) return error('mas-que-el-gasto', g.monto);
  let d: Deuda | undefined, nueva: Deuda | null = null;
  if (typeof quien === 'string') {
    d = teDebenPara(S, g).find((x) => x.id === quien);
    if (!d) return error('falta-quien');
  } else {
    const nombre = (quien.nombre || '').trim();
    if (!nombre) return error('falta-nombre');
    nueva = d = { id: ids.deuda, tipo: 'teDeben', nombre, moneda, saldoInicial: CERO, interes: 0, cuota: CERO, dia: 1, fechaEsperada: null, desde: g.fecha, archivada: false };
  }
  const movs: Movimiento[] = [];
  if (monto === g.monto) movs.push({ ...g, tipo: 'prestamo', deudaId: d.id, deGastoId: g.id });
  else {
    movs.push({ ...g, monto: restar(g.monto, monto) });
    const p: Movimiento = { id: ids.prestamo, tipo: 'prestamo', deudaId: d.id, monto, fecha: g.fecha, nota: g.nota || '', deGastoId: g.id };
    if (g.cuentaId !== undefined) p.cuentaId = g.cuentaId;
    if (g.categoriaId !== undefined) p.categoriaId = g.categoriaId;
    if (g.tc != null) p.tc = g.tc;
    movs.push(p);
  }
  return bien({ deuda: nueva, movs, nombre: d.nombre, queda: restar(g.monto, monto), moneda });
}

// DEU-12: a loan that came from an expense goes back to it, without moving the account. Returns what to delete (first)
// and what to write. If the expense still exists, the amount is added back; if not, the loan becomes that expense again.
export function devolverAlGasto(S: Estado, p: Movimiento): { borrar: string[]; escribir: Movimiento[] } | null {
  if (p.tipo !== 'prestamo' || !p.deGastoId) return null;
  const g = p.deGastoId !== p.id ? S.movs.find((m) => m.id === p.deGastoId && m.tipo === 'gasto' && m.cuentaId === p.cuentaId) : undefined;
  if (g) return { borrar: [p.id], escribir: [{ ...g, monto: sumar(g.monto, p.monto) }] };
  const { deudaId: _d, deGastoId: _g, ...resto } = p;
  return { borrar: [], escribir: [{ ...resto, tipo: 'gasto', categoriaId: p.categoriaId || 'otros_g' }] };
}

