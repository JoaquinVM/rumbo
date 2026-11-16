// What the Rumbo and Movimientos screens show, read from the domain (PAN-02, HOY, FIJ, PRO, IND, MOV-04, MOV-07).
// Pure: the state and today come in, plain data goes out. The numbers are the domain's; nothing is rounded here.
import type {
  CategoriaVista, FilaMovimiento, OpcionesMovimientos, OpcionesRumbo, VistaMovimientos, VistaRumbo,
} from '@rumbo/contratos';
import {
  activos, avanceTopes, calcHoy, categoriaDesconocida, categoriasParaElegir, centavos, cuentaDe, deudaDe, diasDelTipoDeCambio,
  estadoMetas, indicadores, infoPrestamo, mesDe, mesesEntre, movimientosDeCategoria, movimientosDelMes, paraRecortar,
  patrimonio, pendientes, proximosFijos, proyectar, resumenMes, sumarMeses, tipoDeCambioViejo, adelantar,
  type Categoria, type Dia, type Estado, type Movimiento,
} from '@rumbo/dominio';

export const vistaCategoria = (k: Categoria): CategoriaVista =>
  ({ id: k.id, nombre: k.nombre, color: k.color ?? '#808A84', icono: k.icono ?? 'puntos', tipo: k.tipo });

export const categoriaDe = (S: Estado, id: string | undefined): Categoria =>
  S.categorias.find((k) => k.id === id) ?? categoriaDesconocida(id ?? '');

// The same day next month, as the v1 computes it with Date (31 Jan → 3 Mar): the limit of «Próximos».
function mismoDiaDelMesSiguiente(hoy: Dia): Dia {
  const [y = 0, m = 1, d = 1] = hoy.split('-').map(Number);
  const f = new Date(Date.UTC(y, m, d));
  return f.toISOString().slice(0, 10);
}

// PAN-02: headline and chart, Hoy, Por confirmar, warnings, goals, indicators and «¿Y si…?».
export function vistaRumbo(S: Estado, hoy: Dia, o: OpcionesRumbo): VistaRumbo {
  const meses = o.anios * 12, mes = mesDe(hoy);
  const prestamos = activos(S.deudas).filter((d) => d.tipo === 'prestamo'), p0 = prestamos[0];
  const adel = o.adelanto && p0 ? { deudaId: p0.id, monto: o.adelanto } : null;
  const base = proyectar(S, hoy, meses, { nominal: o.nominal });
  const hayAjustes = Object.values(o.recortes).some((v) => v) || !!o.extra || !!adel;
  const alt = hayAjustes ? proyectar(S, hoy, meses, { nominal: o.nominal, recortes: o.recortes, extra: o.extra, adelanto: adel }) : null;
  const R = base.R, final = base.pts[meses] ?? 0, pat = patrimonio(S);
  const cero = base.pts.findIndex((v, i) => i > 0 && v < 0 && (base.pts[0] ?? 0) >= 0);
  const hayUSD = S.cuentas.some((c) => c.moneda === 'USD' && !c.archivada);

  const H = calcHoy(S, hoy);
  const td = diasDelTipoDeCambio(S, hoy);
  const EM = estadoMetas(S, hoy), I = indicadores(S, hoy);
  const a = adel && p0 ? adelantar(S, p0, hoy, centavos(adel.monto)) : null;

  return {
    hoy, meses,
    titular: {
      seAcabaEn: cero > 0 ? sumarMeses(mes, cero) : null, salePorMes: -R.neto, final, nominalFinal: base.nom[meses] ?? 0,
      enDolares: final / (S.aj.tc || 1), inflacion: S.aj.inflacion || 0,
      patrimonio: { total: pat.total, cuentas: pat.cuentas, deudas: pat.deudas, teDeben: pat.teDeben },
    },
    serie: base.pts, netoNegativo: R.neto < 0, serieAjustes: alt ? alt.pts : null,
    marcas: [
      ...prestamos.map((d) => ({ d, fin: infoPrestamo(S, d, hoy).fin }))
        .filter((x): x is { d: typeof x.d; fin: string } => !!x.fin)
        .map(({ d, fin }) => ({ tipo: 'prestamo' as const, indice: mesesEntre(mes, fin), fin, nombre: d.nombre })),
      ...activos(S.metas).map((m) => ({ tipo: 'meta' as const, indice: mesesEntre(mes, m.mes), nombre: m.nombre })),
    ],
    tcFijo: hayUSD ? S.aj.tc : null,
    hayMetas: activos(S.metas).length > 0,
    hoyBloque: {
      libre: H.libre, alDia: H.alDia, dias: H.dias, disp: H.disp, compBs: H.compBs, metas: H.metas,
      prox: H.prox ? { nombre: H.prox.fijo.nombre, fecha: H.prox.fecha } : null,
    },
    porConfirmar: pendientes(S, hoy).map((p) => ({
      clave: `${p.fijo.id}_${p.mes}`, nombre: p.fijo.nombre, cuenta: cuentaDe(S, p.fijo.cuentaId)?.nombre ?? '', fecha: p.fecha, monto: p.fijo.monto,
    })),
    proximos: proximosFijos(S, hoy, mismoDiaDelMesSiguiente(hoy)).slice(0, 4).map((p) => ({ nombre: p.fijo.nombre, fecha: p.fecha })),
    avisoTipoDeCambio: hayUSD && tipoDeCambioViejo(S, hoy) ? { dias: td, tc: S.aj.tc } : null,
    avisosTopes: avanceTopes(S, mes).filter((t) => t.nivel !== 'ok').map((t) => ({
      nombre: t.cat.nombre, gastado: t.gastado, tope: t.cat.tope ?? 0, pct: t.pct, nivel: t.nivel as 'ambar' | 'rojo',
    })),
    metas: {
      lista: EM.ms.map((x) => ({ id: x.m.id, nombre: x.m.nombre, ap: x.ap, monto: x.m.monto, pct: x.pct, mes: x.m.mes, aporte: x.aporteEstimado })),
      pide: EM.pide, vasBien: EM.vasBien, faltaMes: EM.faltaMes,
    },
    indicadores: {
      tasa: I.tasa, colchon: I.colchon, neto: R.neto, ingreso: R.ingreso, gasto: R.gasto, deudaTotal: I.deudaTotal,
      hayPrestamos: I.hayPrestamos, libreDePrestamos: I.libreDePrestamos,
    },
    ySi: {
      categorias: paraRecortar(R).map(([id, promedio]) => ({ id, nombre: categoriaDe(S, id).nombre, promedio })),
      maxExtra: Math.max(5000, Math.round((R.ingreso / 100) * 0.5 / 500) * 500),
      prestamo: p0 ? { nombre: p0.nombre } : null,
      resultado: alt ? {
        final: alt.pts[meses] ?? 0, diferencia: (alt.pts[meses] ?? 0) - final,
        adelanto: a ? { fin: a.fin, mesesAntes: a.mesesAntes, interesAhorrado: a.interesAhorrado } : null,
      } : null,
    },
  };
}

export function filaMovimiento(S: Estado, m: Movimiento): FilaMovimiento {
  const c = cuentaDe(S, m.cuentaId), dst = cuentaDe(S, m.cuentaDestinoId), d = deudaDe(S, m.deudaId);
  return {
    id: m.id, tipo: m.tipo, nota: m.nota ?? '', fecha: m.fecha, fijo: !!m.fijoId, monto: m.monto,
    montoDestino: m.montoDestino ?? null, interes: m.interes ?? null, capital: m.capital ?? null, sentido: m.sentido ?? 1,
    cuenta: c ? { nombre: c.nombre, moneda: c.moneda } : null,
    destino: dst ? { nombre: dst.nombre, moneda: dst.moneda } : null,
    deuda: d ? { nombre: d.nombre, tipo: d.tipo, moneda: d.moneda } : null,
    categoria: vistaCategoria(categoriaDe(S, m.categoriaId)),
  };
}

// MOV-04 and MOV-07: a month of movements, by day, filtered by account and by category.
export function vistaMovimientos(S: Estado, hoy: Dia, o: OpcionesMovimientos): VistaMovimientos {
  const R0 = resumenMes(S, o.mes);
  const k = o.categoria ? categoriaDe(S, o.categoria) : null;
  const porCat = k ? movimientosDeCategoria(S, o.mes, k.id, o.cuenta) : null;
  const dias = porCat ? porCat.dias : movimientosDelMes(S, o.mes, o.cuenta);
  return {
    mes: o.mes, hoy, salio: R0.salio, entro: R0.entro, cantidad: dias.reduce((t, d) => t + d.movs.length, 0),
    cuentas: S.cuentas.map((c) => ({ id: c.id, nombre: c.nombre })),
    cuentaElegida: o.cuenta !== 'todas' ? cuentaDe(S, o.cuenta)?.nombre ?? null : null,
    categoria: k && porCat ? { ...vistaCategoria(k), total: porCat.total, cantidad: porCat.cantidad } : null,
    elegibles: categoriasParaElegir(S, o.mes).map(vistaCategoria),
    dias: dias.map((d) => ({ fecha: d.fecha, total: d.gastado, filas: d.movs.map((m) => filaMovimiento(S, m)) })),
  };
}
