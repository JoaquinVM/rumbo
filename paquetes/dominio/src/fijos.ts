// Fixed items and their months (FIJ-01, FIJ-02, FIJ-04, FIJ-05, FIJ-07, DEU-08).
import { restar, type Centavos } from './dinero';
import { diaDelMes, fechaFijo, mesDe, sumarMeses, type Dia, type Mes } from './fechas';
import { deudaDe, fijosActivos, type Estado, type Fijo, type Movimiento, type Ocurrencia } from './modelo';
import { interesDelMes } from './prestamos';
import { saldoDeuda } from './saldos';

export interface FijoDelMes {
  fijo: Fijo;
  mes: Mes;
  fecha: Dia;
}

export const ocurrencia = (S: Estado, fijoId: string, mes: Mes): Ocurrencia | undefined =>
  S.ocurrencias.find((o) => o.id === `${fijoId}_${mes}`);

// FIJ-02: every fixed item whose day has come, this month or last, and is neither confirmed nor skipped.
export function pendientes(S: Estado, hoy: Dia): FijoDelMes[] {
  const mes = mesDe(hoy), out: FijoDelMes[] = [];
  for (const f of fijosActivos(S)) {
    for (const m of [sumarMeses(mes, -1), mes]) {
      if (f.desde && m < f.desde) continue;
      const fecha = fechaFijo(f.dia, m);
      if (fecha <= hoy && !ocurrencia(S, f.id, m)) out.push({ fijo: f, mes: m, fecha });
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// HOY-03: the next fixed income that has not come yet.
export function proximoIngreso(S: Estado, hoy: Dia): { fijo: Fijo; fecha: Dia } | null {
  const mes = mesDe(hoy);
  let mejor: { fijo: Fijo; fecha: Dia } | null = null;
  for (const f of fijosActivos(S).filter((x) => x.tipo === 'ingreso')) {
    for (const m of [mes, sumarMeses(mes, 1)]) {
      const fecha = fechaFijo(f.dia, m);
      if (fecha > hoy && !ocurrencia(S, f.id, m)) {
        if (!mejor || fecha < mejor.fecha) mejor = { fijo: f, fecha };
        break;
      }
    }
  }
  return mejor;
}

// HOY-02: fixed items still to come before a date.
export function proximosFijos(S: Estado, hoy: Dia, limite: Dia): FijoDelMes[] {
  const mes = mesDe(hoy), out: FijoDelMes[] = [];
  for (const f of fijosActivos(S)) {
    for (const m of [mes, sumarMeses(mes, 1)]) {
      if (f.desde && m < f.desde) continue;
      const fecha = fechaFijo(f.dia, m);
      if (fecha > hoy && fecha < limite && !ocurrencia(S, f.id, m)) out.push({ fijo: f, mes: m, fecha });
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// FIJ-02 and FIJ-04: confirming creates its movement (a debt payment, split in interest and capital, if it is the
// payment of a loan). The id is fixed, so two tabs that confirm write the same movement. Null if it was already settled.
export function confirmarFijo(S: Estado, fijoId: string, mes: Mes, monto: Centavos): { mov: Movimiento; ocurrencia: Ocurrencia } | null {
  const f = S.fijos.find((x) => x.id === fijoId);
  if (!f || ocurrencia(S, fijoId, mes)) return null;
  const k = `${fijoId}_${mes}`, id = `m_${k}`, fecha = fechaFijo(f.dia, mes);
  const d = f.deudaId ? deudaDe(S, f.deudaId) : undefined;
  let mov: Movimiento;
  if (d && d.tipo === 'prestamo') {
    const interes = interesDelMes(saldoDeuda(S, d), d.interes);
    mov = { id, tipo: 'pago', deudaId: d.id, cuentaId: f.cuentaId, monto, interes, capital: restar(monto, interes), fecha, nota: f.nombre };
  } else mov = { id, tipo: f.tipo, cuentaId: f.cuentaId, categoriaId: f.categoriaId, monto, fecha, nota: f.nombre };
  mov.fijoId = f.id;
  mov.mes = mes;
  return { mov, ocurrencia: { id: k, fijoId, mes, estado: 'confirmado', movId: id } };
}

// FIJ-02 and DEU-08: skipping a month creates nothing, except for a loan: its interest for the month is added to the
// debt and is an expense in Intereses.
export function saltarFijo(S: Estado, fijoId: string, mes: Mes): { mov: Movimiento | null; ocurrencia: Ocurrencia } {
  const k = `${fijoId}_${mes}`, f = S.fijos.find((x) => x.id === fijoId);
  const d = f?.deudaId ? deudaDe(S, f.deudaId) : undefined;
  let mov: Movimiento | null = null;
  if (f && d && d.tipo === 'prestamo') {
    const it = interesDelMes(saldoDeuda(S, d), d.interes);
    if (it > 0) mov = { id: `i_${k}`, tipo: 'interes', deudaId: d.id, monto: it, fecha: fechaFijo(f.dia, mes), nota: `Interés sin pagar · ${d.nombre}`, fijoId, mes };
  }
  return { mov, ocurrencia: { id: k, fijoId, mes, estado: 'saltado', movId: mov ? mov.id : null } };
}

// DEU-08 and FIJ-02: deleting a movement also deletes the month it settled, so that month is pending again.
export const ocurrenciasDe = (S: Estado, movId: string): Ocurrencia[] => S.ocurrencias.filter((o) => o.movId === movId);

// FIJ-07: the first month a new loan's payment is asked: next month if its day already passed this month.
export const primerMesDeCuota = (dia: number | undefined, hoy: Dia): Mes =>
  (dia || 1) < diaDelMes(hoy) ? sumarMeses(mesDe(hoy), 1) : mesDe(hoy);
