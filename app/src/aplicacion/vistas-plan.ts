// What the Desglose, Plan, the detail of a debt and of a goal, the categories and Ajustes show, read from the domain
// (DES-01 to DES-05, PAN-03, PAN-07 to PAN-09, AJU). Pure: the state and today come in, plain data goes out. The
// numbers are the domain's; nothing is rounded here.
import type {
  CategoriaEditable, DeudaPlan, FijoPlan, VistaAjustes, VistaDeuda, VistaDesglose, VistaMeta, VistaPlan,
} from '@rumbo/contratos';
import {
  aBs, activos, antesDeAbrir, apartadoCuenta, calcHoy, centavos, cuentaDe, detalleCategoria, diasDelTipoDeCambio,
  estadoMetas, fijosActivos, infoMeta, infoPrestamo, monedaDe, patrimonio, pendientes, promedioIrregular, resumenMes,
  ritmo, restar, saldoCuenta, saldoDeuda, sumar, sumarMeses, sumarPor, ultimoCambio,
  type Centavos, type Deuda, type Dia, type Estado, type Fijo, type Mes,
} from '@rumbo/dominio';
import { categoriaDe, filaMovimiento, vistaCategoria } from './vistas';

// DES-01 to DES-04: the month in categories, biggest first, with what each one means.
export function vistaDesglose(S: Estado, hoy: Dia, mes: Mes): VistaDesglose {
  const R0 = resumenMes(S, mes), R = ritmo(S, hoy);
  const lista = Object.entries(R0.cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {
    mes, entro: R0.entro, salio: R0.salio, quedo: R0.quedo,
    porHora: S.aj.horas > 0 && R0.entro > 0 ? R0.entro / S.aj.horas : null,
    capital: R0.capital, ajustes: R0.ajustes, cambio: R0.cambio, cierres: R0.cierres,
    categorias: lista.map(([id, total]) => {
      const k = categoriaDe(S, id), d = detalleCategoria(S, R0, R, id);
      return {
        categoria: vistaCategoria(k), total, tope: (k.tope ?? 0) > 0 ? k.tope ?? null : null, pctTope: d.pctTope, nivel: d.nivel,
        deCada100: d.deCada100, horas: d.horas, enDiezAnios: d.enDiezAnios,
      };
    }),
  };
}

// The icon of a fixed item, the v1's icoFijo: by its name, or its category's.
function iconoFijo(S: Estado, f: Fijo): string {
  const n = f.nombre.toLowerCase();
  if (f.deudaId || /cuota|pr[eé]stamo/.test(n)) return 'porcentaje';
  if (/luz|electric/.test(n)) return 'rayo';
  if (/internet|wifi/.test(n)) return 'wifi';
  if (/stream|netflix|spotify|disney|hbo|youtube/.test(n)) return 'play';
  if (/sueldo|salario/.test(n)) return 'bandeja';
  return categoriaDe(S, f.categoriaId).icono ?? 'puntos';
}

const deudaPlan = (S: Estado, d: Deuda, hoy: Dia): DeudaPlan => {
  const P = d.tipo === 'prestamo' ? infoPrestamo(S, d, hoy) : null;
  return {
    id: d.id, nombre: d.nombre, tipo: d.tipo, moneda: d.moneda, saldo: saldoDeuda(S, d), interes: d.interes || 0, cuota: d.cuota ?? 0,
    fin: P ? P.fin : null, crece: P ? P.crece : false, fechaEsperada: d.fechaEsperada ?? null,
  };
};

// PAN-03, PAN-07, PAN-08, PAN-09: net worth, accounts, fixed items, debts, goals and categories.
export function vistaPlan(S: Estado, hoy: Dia): VistaPlan {
  const pat = patrimonio(S), tc = S.aj.tc || 0;
  const fijos = fijosActivos(S).sort((a, b) => a.dia - b.dia);
  const bsFijo = (f: Fijo): Centavos => aBs(f.monto, monedaDe(S, f.cuentaId), tc);
  const pend = new Set(pendientes(S, hoy).map((p) => p.fijo.id));
  const EM = estadoMetas(S, hoy), topes = activos(S.categorias).filter((k) => (k.tope ?? 0) > 0);
  return {
    patrimonio: { total: pat.total, cuentas: pat.cuentas, teDeben: pat.teDeben, deudas: pat.deudas },
    cuentas: activos(S.cuentas).map((c) => {
      const s = saldoCuenta(S, c);
      return {
        id: c.id, nombre: c.nombre, moneda: c.moneda, saldo: s, enBs: c.moneda === 'USD' ? aBs(s, 'USD', tc) : null,
        apartado: apartadoCuenta(S, c.id), rendimiento: c.rendimiento || 0, diaADia: !!c.diaADia,
      };
    }),
    fijos: fijos.map((f): FijoPlan => ({
      id: f.id, nombre: f.nombre, tipo: f.tipo, monto: f.monto, moneda: cuentaDe(S, f.cuentaId)?.moneda ?? 'BOB', dia: f.dia,
      cuenta: cuentaDe(S, f.cuentaId)?.nombre ?? '', categoria: vistaCategoria(categoriaDe(S, f.categoriaId)), icono: iconoFijo(S, f),
      pendiente: pend.has(f.id),
    })),
    fijosEntra: sumarPor(fijos.filter((f) => f.tipo === 'ingreso'), bsFijo),
    fijosSale: sumarPor(fijos.filter((f) => f.tipo === 'gasto'), bsFijo),
    deudas: activos(S.deudas).map((d) => deudaPlan(S, d, hoy)),
    metas: EM.ms.map((x) => ({ id: x.m.id, nombre: x.m.nombre, ap: x.ap, monto: x.m.monto, pct: x.pct, mes: x.m.mes, aporte: x.aporte })),
    apartadoMetas: sumarPor(EM.ms, (x) => x.ap),
    categorias: { cantidad: activos(S.categorias).length, topes: topes.map((k) => ({ nombre: k.nombre, tope: k.tope ?? 0 })) },
  };
}

// PAN-07: a debt and its movements; a loan with when it ends, the next payments and paying extra (PRO-08).
export function vistaDeuda(S: Estado, hoy: Dia, id: string, adelanto: number): VistaDeuda | null {
  const d = S.deudas.find((x) => x.id === id);
  if (!d) return null;
  const s = saldoDeuda(S, d);
  const base = { id: d.id, nombre: d.nombre, tipo: d.tipo, moneda: d.moneda, saldo: s, fechaEsperada: d.fechaEsperada ?? null };
  if (d.tipo !== 'prestamo') {
    const movs = S.movs.filter((m) => m.deudaId === d.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { ...base, movimientos: movs.map((m) => filaMovimiento(S, m)), prestamo: null };
  }
  const P = infoPrestamo(S, d, hoy);
  const extra = centavos(Math.max(0, Math.round(adelanto)));
  const A = extra > 0 ? infoPrestamo(S, d, hoy, extra) : null;
  const H = calcHoy(S, hoy);
  const inicial = sumar(d.saldoInicial || centavos(0), sumarPor(
    S.movs.filter((m) => m.deudaId === d.id && (m.tipo === 'recibido' || m.tipo === 'interes') && !antesDeAbrir(d, m)), (m) => m.monto));
  const pagado = restar(inicial, s);
  return {
    ...base, movimientos: [],
    prestamo: {
      inicial, pagado: Math.max(0, pagado), fin: P.fin, cuotas: P.cuotas, crece: P.crece, interesPorPagar: P.interes,
      tasa: d.interes || 0, cuota: d.cuota ?? 0, dia: d.dia ?? null,
      proximas: P.filas.slice(0, 3).map((f, i) => ({ mes: sumarMeses(P.desde, i), interes: f.interes, capital: f.capital, saldo: f.saldo })),
      adelanto: A && A.fin && P.fin
        ? { fin: A.fin, mesesAntes: P.cuotas - A.cuotas, interesAhorrado: P.interes - A.interes, libreAlDia: (H.libre - extra) / H.dias }
        : null,
    },
  };
}

// PAN-08 and MET-02 to MET-05: a goal, what it asks this month and where the money set aside is.
export function vistaMeta(S: Estado, hoy: Dia, id: string): VistaMeta | null {
  const m = S.metas.find((x) => x.id === id);
  if (!m) return null;
  const I = infoMeta(S, m, hoy), EM = estadoMetas(S, hoy), tc = S.aj.tc || 0;
  const porCuenta = new Map<string, number>();
  for (const a of I.lista) porCuenta.set(a.cuentaId, (porCuenta.get(a.cuentaId) ?? 0) + a.monto);
  return {
    id: m.id, nombre: m.nombre, monto: m.monto, mes: m.mes, ap: I.ap, pct: I.pct, vasBien: EM.vasBien, neto: EM.neto, pide: EM.pide,
    faltaMes: EM.faltaMes, aporte: I.aporte, meses: I.meses, esteMes: I.esteMes, falta: I.falta,
    cuentas: activos(S.cuentas).map((c) => ({ id: c.id, nombre: c.nombre, moneda: c.moneda, libre: restar(saldoCuenta(S, c), apartadoCuenta(S, c.id)) })),
    dondeEsta: [...porCuenta].map(([cid, v]) => {
      const c = cuentaDe(S, cid), mon = c?.moneda ?? 'BOB';
      return { cuentaId: cid, cuenta: c ? c.nombre : '?', moneda: mon, monto: v, enBs: mon === 'USD' ? aBs(centavos(v), 'USD', tc) : null };
    }),
  };
}

// PAN-09: every category, with its limit.
export const vistaCategorias = (S: Estado): CategoriaEditable[] =>
  S.categorias.map((k) => ({ ...vistaCategoria(k), tope: k.tope ?? 0, archivada: !!k.archivada }));

// AJU-01 to AJU-05
export function vistaAjustes(S: Estado, hoy: Dia): VistaAjustes {
  return {
    tc: S.aj.tc || 0, tcFecha: S.aj.tcFecha ?? null, tcDias: diasDelTipoDeCambio(S, hoy), ultimoCambio: ultimoCambio(S),
    irregular: S.aj.irregular || 0, promedioIrregular: promedioIrregular(S, hoy), inflacion: S.aj.inflacion || 0, horas: S.aj.horas || 0,
    color: S.aj.color ?? 'azul',
  };
}
