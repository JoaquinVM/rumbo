// States at random with a fixed seed, as the v1 keeps them (decimal amounts with up to 2 decimals), for the comparison
// with the v1 (design.md, «Comparación con la v1»). The same seed always gives the same states.

export type Azar = () => number;
// mulberry32: small, fast and the same on every machine.
export function azar(semilla: number): Azar {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Doc = Record<string, any>;
export type { EstadoV1 } from '../../migracion/src/estado-v1';
import type { EstadoV1 } from '../../migracion/src/estado-v1';

const pad = (n: number): string => String(n).padStart(2, '0');
const dia = (t: number): string => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const DIA = 864e5;
const sumarMeses = (mes: string, n: number): string => {
  const [y, m] = mes.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

const GASTOS = ['comida', 'super', 'casa', 'transporte', 'salud', 'ocio', 'compras', 'suscripciones', 'educacion', 'intereses', 'otros_g'];
const INGRESOS = ['sueldo', 'negocio', 'ventas', 'extra', 'otros_i'];

export function generar(r: Azar, catsBase: Doc[]): { hoy: string; S: EstadoV1 } {
  const entre = (a: number, b: number): number => a + Math.floor(r() * (b - a + 1));
  const uno = <T>(l: readonly T[]): T => l[Math.floor(r() * l.length)] as T;
  const si = (p: number): boolean => r() < p;
  // an amount of up to `max` Bs with 0, 1 or 2 decimals, as the double the v1 keeps (cents ÷ 100)
  const monto = (max: number, min = 0.01): number => {
    const c = Math.max(Math.round(min * 100), Math.round(r() * max * 100));
    const forma = r();
    return (forma < 0.35 ? Math.round(c / 100) * 100 || 100 : forma < 0.5 ? Math.round(c / 10) * 10 || 10 : c) / 100;
  };
  const tasa = (): number => uno([0, 6, 12, 14, 18, 24, 36, entre(1, 60) / 2, entre(1, 400) / 10]);

  const t0 = Date.UTC(2026, 0, 1) + entre(0, 700) * DIA, hoy = dia(t0), mes = hoy.slice(0, 7);
  const fecha = (desde: number, hasta = 0): string => dia(t0 - entre(hasta, desde) * DIA);
  const tc = uno([12.5, 6.96, 13, entre(686, 1500) / 100, entre(69, 150) / 10]);
  const S: EstadoV1 = {
    aj: { tc, tcFecha: si(0.8) ? fecha(20) : null, inflacion: uno([0, 8, entre(0, 150) / 10]), irregular: si(0.5) ? 0 : monto(3000),
      horas: si(0.8) ? 160 : 0, empezado: true },
    categorias: catsBase.map((k) => ({ ...k, tope: k.tipo === 'gasto' && si(0.35) ? monto(2500, 1) : 0, archivada: si(0.05) })),
    cuentas: [], movs: [], fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [],
  };

  const nCuentas = entre(1, 5);
  for (let i = 0; i < nCuentas; i++) {
    const usd = si(0.35);
    S.cuentas.push({
      id: `c${i}`, nombre: usd ? `Dólares ${i}` : `Cuenta ${i}`, moneda: usd ? 'USD' : 'BOB',
      saldoInicial: (si(0.1) ? -1 : 1) * monto(usd ? 3000 : 20000), rendimiento: si(0.5) ? 0 : uno([2, 4.5, 12, entre(0, 150) / 10]),
      diaADia: usd ? si(0.3) : si(0.85), archivada: si(0.06), ...(si(0.4) ? { desde: fecha(120) } : {}),
    });
  }
  const cuenta = (moneda?: string): Doc | undefined => {
    const l = S.cuentas.filter((c) => !moneda || c.moneda === moneda);
    return l.length ? uno(l) : undefined;
  };

  const nDeudas = entre(0, 5);
  for (let i = 0; i < nDeudas; i++) {
    const tipo = uno(['prestamo', 'prestamo', 'persona', 'teDeben']), moneda = si(0.2) ? 'USD' : 'BOB';
    const saldo = monto(moneda === 'USD' ? 5000 : 40000, 1), interes = tipo === 'prestamo' ? tasa() : 0;
    const cuota = tipo === 'prestamo' ? (si(0.15) ? monto(saldo * 0.01 + 1, 1) : monto(saldo / entre(3, 60) + saldo * interes / 1200 + 1, 1)) : 0;
    S.deudas.push({
      id: `d${i}`, tipo, nombre: tipo === 'prestamo' ? `Préstamo ${i}` : `Persona ${i}`, moneda, saldoInicial: saldo, interes, cuota,
      dia: entre(1, 31), archivada: si(0.06), fechaEsperada: null, ...(si(0.4) ? { desde: fecha(120) } : {}),
    });
  }

  const nFijos = entre(0, 7);
  for (let i = 0; i < nFijos; i++) {
    const c = cuenta();
    if (!c) break;
    const prestamos = S.deudas.filter((d) => d.tipo === 'prestamo' && d.moneda === c.moneda);
    const cuota = prestamos.length && si(0.35) ? uno(prestamos) : null;
    const tipo = cuota ? 'gasto' : si(0.35) ? 'ingreso' : 'gasto';
    S.fijos.push({
      id: `f${i}`, nombre: cuota ? `Cuota ${i}` : `Fijo ${i}`, tipo, monto: cuota ? cuota.cuota : monto(tipo === 'ingreso' ? 12000 : 3000, 1),
      cuentaId: c.id, categoriaId: cuota ? 'intereses' : uno(tipo === 'ingreso' ? INGRESOS : GASTOS), dia: entre(1, 31),
      ...(cuota ? { deudaId: cuota.id } : {}), desde: sumarMeses(mes, -entre(0, 3)), activo: si(0.92),
    });
  }

  const nMovs = entre(0, 90);
  for (let i = 0; i < nMovs; i++) {
    const c = cuenta();
    if (!c) break;
    const f = fecha(150), id = `m${i}`, conTc = c.moneda === 'USD' && si(0.8) ? { tc: uno([tc, 12.5, entre(686, 1500) / 100]) } : {};
    const tipo = uno(['gasto', 'gasto', 'gasto', 'gasto', 'ingreso', 'ingreso', 'transferencia', 'ajuste', 'pago', 'cobro', 'prestamo', 'recibido', 'interes', 'cierre']);
    if (tipo === 'gasto' || tipo === 'ingreso') {
      const fijo = si(0.1) ? S.fijos.find((x) => x.tipo === tipo && x.cuentaId === c.id) : undefined;
      S.movs.push({ id, tipo, cuentaId: c.id, categoriaId: uno(tipo === 'gasto' ? GASTOS : INGRESOS), monto: monto(tipo === 'gasto' ? 600 : 5000), fecha: f,
        nota: uno(['', 'Almuerzo', 'Taxi', 'Súper']), ...conTc, ...(fijo ? { fijoId: fijo.id, mes: f.slice(0, 7) } : {}) });
    } else if (tipo === 'transferencia') {
      const d = cuenta();
      if (!d || d.id === c.id) continue;
      const m = monto(c.moneda === 'USD' ? 500 : 6000, 1), cambio = c.moneda !== d.moneda;
      const destino = !cambio ? (si(0.1) ? m : undefined) : c.moneda === 'BOB' ? monto(m / 6, 0.5) : monto(m * 15, 1);
      S.movs.push({ id, tipo, cuentaId: c.id, cuentaDestinoId: d.id, monto: m, ...(destino != null ? { montoDestino: destino } : {}), fecha: f,
        ...(cambio && si(0.8) ? { tc: uno([tc, entre(686, 1500) / 100]) } : {}) });
    } else if (tipo === 'ajuste') {
      S.movs.push({ id, tipo, cuentaId: c.id, monto: monto(300), sentido: si(0.6) ? -1 : 1, fecha: f, ...conTc });
    } else {
      const deudas = S.deudas.filter((d) => d.moneda === c.moneda);
      if (!deudas.length) continue;
      const d = uno(deudas), m = monto(tipo === 'interes' ? 400 : 2500, 0.5);
      if (tipo === 'pago') {
        const interes = d.tipo === 'prestamo' ? monto(Math.min(m, 400), 0) : 0;
        S.movs.push({ id, tipo, deudaId: d.id, cuentaId: c.id, monto: m, interes, capital: Math.round(m * 100 - interes * 100) / 100, fecha: f, ...conTc });
      } else if (tipo === 'interes' || tipo === 'cierre') {
        S.movs.push({ id, tipo, deudaId: d.id, monto: m, fecha: f, ...(d.moneda === 'USD' && si(0.5) ? { tc: uno([tc, 12.5]) } : {}) });
      } else S.movs.push({ id, tipo, deudaId: d.id, cuentaId: c.id, monto: m, fecha: f, ...conTc });
    }
  }

  for (const fj of S.fijos) {
    for (const m of [sumarMeses(mes, -1), mes]) {
      if (!si(0.4)) continue;
      const estado = si(0.7) ? 'confirmado' : 'saltado';
      S.ocurrencias.push({ id: `${fj.id}_${m}`, fijoId: fj.id, mes: m, estado, movId: null });
    }
  }

  const nMetas = entre(0, 3);
  for (let i = 0; i < nMetas; i++) {
    S.metas.push({ id: `g${i}`, nombre: `Meta ${i}`, monto: monto(30000, 100), mes: sumarMeses(mes, entre(-1, 26)), archivada: si(0.08) });
  }
  const nApartados = S.metas.length ? entre(0, 7) : 0;
  for (let i = 0; i < nApartados; i++) {
    const c = cuenta();
    if (!c) break;
    S.apartados.push({ id: `a${i}`, metaId: uno(S.metas).id, cuentaId: c.id, monto: (si(0.2) ? -1 : 1) * monto(c.moneda === 'USD' ? 300 : 3000), fecha: fecha(70) });
  }
  return { hoy, S };
}
