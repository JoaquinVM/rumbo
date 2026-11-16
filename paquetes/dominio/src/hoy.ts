// What is free to spend until the next fixed income (HOY-01 to HOY-05), in whole cents.
import { aBs, restar, sumarPor, type Centavos } from './dinero';
import { diasEntre, primerDiaDelMesSiguiente, type Dia } from './fechas';
import { pendientes, proximoIngreso, proximosFijos, type FijoDelMes } from './fijos';
import { activos, cuentaDe, monedaDe, type Estado, type Fijo } from './modelo';
import { infoMeta } from './metas';
import { apartadoCuenta, saldoCuenta } from './saldos';

export interface Hoy {
  disp: Centavos; // HOY-01: day-to-day accounts in Bs, minus what is set aside in them
  comp: FijoDelMes[]; // HOY-02: fixed expenses of day-to-day accounts still to pay before the next income
  compBs: Centavos;
  metas: Centavos; // HOY-02: still to set aside this month for the goals (MET-03)
  libre: Centavos; // HOY-02: disp − compBs − metas
  dias: number; // HOY-03: from today to the day before the next fixed income, today included; else to month end
  prox: { fijo: Fijo; fecha: Dia } | null;
  limite: Dia;
  alDia: number; // HOY-03: libre ÷ dias, an estimate in cents
}

export function calcHoy(S: Estado, hoy: Dia): Hoy {
  const tc = S.aj.tc || 0;
  const disp = sumarPor(S.cuentas.filter((c) => c.diaADia && !c.archivada), (c) => aBs(restar(saldoCuenta(S, c), apartadoCuenta(S, c.id)), c.moneda, tc));
  const prox = proximoIngreso(S, hoy);
  const limite = prox ? prox.fecha : primerDiaDelMesSiguiente(hoy);
  const comp = [...pendientes(S, hoy), ...proximosFijos(S, hoy, limite)].filter((p) => p.fijo.tipo === 'gasto' && cuentaDe(S, p.fijo.cuentaId)?.diaADia);
  const compBs = sumarPor(comp, (p) => aBs(p.fijo.monto, monedaDe(S, p.fijo.cuentaId), tc));
  const metas = sumarPor(activos(S.metas), (m) => infoMeta(S, m, hoy).falta);
  const libre = restar(restar(disp, compBs), metas), dias = Math.max(1, diasEntre(hoy, limite));
  return { disp, comp, compBs, metas, libre, dias, prox, limite, alDia: libre / dias };
}

// HOY-03 and PRO-08: the amount a day if `menos` were taken out of the free money each month.
export const alDiaCon = (H: Hoy, menos: number): number => (H.libre - menos) / H.dias;
