// Layer 2 · Application: the use cases of the rest of the screens (job 084): accounts and squaring them, fixed items,
// debts and their payments, an expense someone owes you, goals and setting aside, categories, Ajustes and the main
// color, starting with my data, the backup and deleting everything. The rules are the domain's; this decides what to
// write, checks it with the shared contracts first (DAT-09) and writes it in order, as the v1 did. The example is never
// saved (DAT-01).
import type {
  BorradorAjustes, BorradorCategoria, BorradorCuenta, BorradorDeuda, BorradorEmpezar, BorradorFijo, BorradorMeta,
  BorradorPago, CodigoError, Datos, ErrorGuardar, ErrorRespaldo, FormularioCategoria, FormularioCuenta, FormularioDeuda,
  FormularioFijo, FormularioMeta, FormularioPago, FormularioSeparar, MonedaApp, ResultadoApp, ResumenRespaldo, TipoPago,
} from '@rumbo/contratos';
import {
  CERO, COLECCIONES, activos, ajustesBase, apartar, archivarCuenta, archivarMeta, cambiarTipoDeCambio, categoriasBase,
  cerrarDeuda, crearDeuda, cuadrar, cuentaDe, cuentasPara, cuotaQuePaga, deudaDe, interesDePago, leer, leerConSigno,
  maximoDe, mesDe, monedaDe, montoSugerido, movimientoDeDeuda, primerMesDeCuota, saldoCuenta, saldoDeuda, separarGasto,
  sumarMeses, teDebenPara, v1ACentavos, type Ajustes, type Categoria, type Centavos, type Cuenta, type Deuda, type Dia,
  type Estado, type Fijo, type Mes, type Meta,
} from '@rumbo/dominio';
import type { Coleccion, Validador } from './puertos';
import { vistaCategoria } from './vistas';

export type Escritura = { col: Coleccion; doc: { id: string } } | { col: Coleccion; borrar: string };

export interface Contexto {
  S: () => Estado;
  hoy: () => Dia;
  nuevoId: () => string;
  ejemplo: () => boolean;
  ultimaCuenta: () => string | null;
  validar: () => Validador | null;
  aplicar: (cambios: Escritura[]) => ResultadoApp<null, CodigoError | 'cargando'>;
  ponerAjustes: (aj: Ajustes) => void; // saved unless it is the example
  reemplazar: (S: Estado) => void; // DAT-02, DAT-04: the person's data from now on
  borrarTodo: () => void;
}

const no = <C extends string>(codigo: C): { ok: false; codigo: C } => ({ ok: false, codigo });
const si = <T>(datos: T): { ok: true; datos: T } => ({ ok: true, datos });

// FMT-03: an amount as cents. Empty is 0.
function montoDe(texto: string, conSigno = false): ResultadoApp<Centavos, 'mas-de-2-decimales'> {
  const l = conSigno ? leerConSigno(texto) : leer(texto);
  return l.ok ? si(l.centavos) : no('mas-de-2-decimales');
}

// A rate or percentage as people write it (the v1's parseAmt): not money, so it keeps its decimals.
export function leerTasa(v: string): number {
  let s = String(v ?? '').replace(/[^\d.,]/g, '');
  const p = s.lastIndexOf('.'), c = s.lastIndexOf(',');
  if (p >= 0 && c >= 0) {
    const dec = p > c ? '.' : ',';
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.');
  } else if (p >= 0 || c >= 0) {
    const partes = s.split(p >= 0 ? '.' : ',');
    const ultima = partes[partes.length - 1] ?? '';
    const miles = partes.length > 2 || (ultima.length === 3 && partes[0] !== '0' && partes[0] !== '');
    s = miles ? partes.join('') : partes.join('.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const diaDe = (t: string, porDefecto: number): number => Math.min(31, Math.max(1, parseInt(t, 10) || porDefecto));
const paraEditar = (c: number | undefined): string => {
  if (!c) return '';
  const v = Math.abs(c) / 100, [e = '', d] = v.toFixed(c % 100 ? 2 : 0).split('.');
  return (c < 0 ? '-' : '') + e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
};
const tasaParaEditar = (x: number | undefined): string => (x ? String(Math.round(x * 10) / 10).replace('.', ',') : '');

// LIM-01: the colors and icons a category can have (the v1's COLORES and ICONOS_ELEGIBLES).
export const COLORES = ['#E0703A', '#3E9B5C', '#5A6CD8', '#2F93B5', '#D04F78', '#9A5BD0', '#C08A1F', '#6B7F8C', '#2E8F86', '#B5482E', '#808A84', '#1E7A55', '#4A8F3A'];
export const ICONOS = ['comida', 'carrito', 'casa', 'auto', 'salud', 'ocio', 'bolsa', 'play', 'libro', 'porcentaje', 'puntos', 'bandeja', 'maletin', 'etiqueta', 'estrella', 'rayo', 'wifi', 'billete', 'persona', 'meta'];
// AJU-05
export const COLORES_PRINCIPALES = ['azul', 'cielo', 'morado', 'rosa'];

const vistaCuenta = (S: Estado) => (c: Cuenta) => ({ id: c.id, nombre: c.nombre, moneda: c.moneda, saldo: saldoCuenta(S, c) });

// DAT-04: a backup, version 2 in cents.
interface Respaldo { app: 'rumbo'; version: 1 | 2; fecha?: string; datos: Record<string, unknown> & { aj?: Record<string, unknown> } }
const esRespaldo = (o: unknown): o is Respaldo => {
  const r = o as Respaldo | null;
  return !!r && r.app === 'rumbo' && (r.version === 1 || r.version === 2) && !!r.datos && typeof r.datos === 'object' && Array.isArray(r.datos.cuentas);
};

export function casosPlan(x: Contexto) {
  const { S, hoy, nuevoId } = x;
  let leido: Estado | null = null;

  // Checks documents that are written at once (starting, a backup): one bad one and nothing is written.
  function validarTodo(N: Estado): CodigoError | 'cargando' | null {
    const v = x.validar();
    if (!v) return 'cargando';
    for (const c of COLECCIONES) for (const d of N[c]) { const r = v(c, d); if (!r.ok) return r.codigo; }
    return null;
  }

  return {
    // ---------- accounts (CTA-01, CTA-03, CTA-08) ----------
    formularioCuenta(id?: string): FormularioCuenta {
      const c = id ? cuentaDe(S(), id) : undefined;
      return {
        editando: !!c, saldo: c ? saldoCuenta(S(), c) : null, archivada: !!c?.archivada,
        tieneMovimientos: !!c && S().movs.some((m) => m.cuentaId === c.id || m.cuentaDestinoId === c.id),
        borrador: c
          ? { id: c.id, nombre: c.nombre, moneda: c.moneda, saldo: '', rendimiento: tasaParaEditar(c.rendimiento), diaADia: !!c.diaADia }
          : { id: nuevoId(), nombre: '', moneda: 'BOB', saldo: '', rendimiento: '', diaADia: true },
      };
    },
    guardarCuenta(b: BorradorCuenta): ResultadoApp<null, ErrorGuardar> {
      const nombre = b.nombre.trim();
      if (!nombre) return no('falta-nombre');
      const previa = cuentaDe(S(), b.id);
      const c: Cuenta = previa
        ? { ...previa, nombre, rendimiento: leerTasa(b.rendimiento), diaADia: b.diaADia }
        : { id: b.id, nombre, moneda: b.moneda, saldoInicial: CERO, rendimiento: leerTasa(b.rendimiento), diaADia: b.diaADia, archivada: false, desde: hoy() };
      if (previa && !S().movs.some((m) => m.cuentaId === previa.id || m.cuentaDestinoId === previa.id)) c.moneda = b.moneda;
      if (!previa) {
        const s = montoDe(b.saldo, true);
        if (!s.ok) return s;
        c.saldoInicial = s.datos;
      }
      return x.aplicar([{ col: 'cuentas', doc: c }]);
    },
    archivarCuenta(id: string): ResultadoApp<{ archivada: boolean; nombre: string }, ErrorGuardar> {
      const c = cuentaDe(S(), id);
      if (!c) return no('falta-cuenta');
      const r = archivarCuenta(S(), c);
      if (!r.ok) return no(r.codigo);
      const a = x.aplicar([{ col: 'cuentas', doc: r.datos }]);
      return a.ok ? si({ archivada: !!r.datos.archivada, nombre: c.nombre }) : a;
    },
    cuadrar(id: string, texto: string): ResultadoApp<{ diferencia: number; moneda: MonedaApp }, ErrorGuardar> {
      const c = cuentaDe(S(), id);
      if (!c) return no('falta-cuenta');
      const real = montoDe(texto, true);
      if (!real.ok) return real;
      const antes = saldoCuenta(S(), c), m = cuadrar(S(), c, real.datos, hoy(), nuevoId());
      if (!m) return si({ diferencia: 0, moneda: c.moneda });
      const a = x.aplicar([{ col: 'movs', doc: m }]);
      return a.ok ? si({ diferencia: real.datos - antes, moneda: c.moneda }) : a;
    },

    // ---------- fixed items (FIJ-01, FIJ-04) ----------
    formularioFijo(id?: string): FormularioFijo | null {
      const cs = activos(S().cuentas);
      if (!cs.length) return null;
      const f = id ? S().fijos.find((y) => y.id === id) : undefined;
      const cats = activos(S().categorias).map(vistaCategoria);
      return {
        editando: !!f,
        borrador: f
          ? { id: f.id, nombre: f.nombre, tipo: f.tipo, monto: paraEditar(f.monto), dia: String(f.dia), cuentaId: f.cuentaId, categoriaId: f.categoriaId, deudaId: f.deudaId ?? null }
          : { id: nuevoId(), nombre: '', tipo: 'gasto', monto: '', dia: '1', cuentaId: (cs.find((c) => c.diaADia) ?? cs[0]!).id, categoriaId: 'casa', deudaId: null },
        cuentas: cs.map(vistaCuenta(S())),
        categorias: { gasto: cats.filter((k) => k.tipo === 'gasto'), ingreso: cats.filter((k) => k.tipo === 'ingreso') },
        prestamos: activos(S().deudas).filter((d) => d.tipo === 'prestamo').map((d) => ({ id: d.id, nombre: d.nombre, moneda: d.moneda })),
      };
    },
    guardarFijo(b: BorradorFijo): ResultadoApp<null, ErrorGuardar> {
      const nombre = b.nombre.trim(), monto = montoDe(b.monto);
      if (!monto.ok) return monto;
      if (!nombre) return no('falta-nombre');
      if (!monto.datos) return no('falta-monto');
      const previo = S().fijos.find((f) => f.id === b.id);
      const f: Fijo = {
        ...(previo ?? { desde: mesDe(hoy()), activo: true }), id: b.id, nombre, tipo: b.tipo, monto: monto.datos, dia: diaDe(b.dia, 1),
        cuentaId: b.cuentaId, categoriaId: b.categoriaId, deudaId: b.tipo === 'gasto' ? b.deudaId : null,
      };
      return x.aplicar([{ col: 'fijos', doc: f }]);
    },
    quitarFijo(id: string): void {
      const f = S().fijos.find((y) => y.id === id);
      if (f) x.aplicar([{ col: 'fijos', doc: { ...f, activo: false } as Fijo }]);
    },

    // ---------- debts (DEU-01, DEU-07, DEU-09, FIJ-04, FIJ-07) ----------
    formularioDeuda(id?: string): FormularioDeuda {
      const d = id ? deudaDe(S(), id) : undefined;
      const cs = activos(S().cuentas);
      const fijo = (mon: MonedaApp) => (cs.find((c) => c.moneda === mon && c.diaADia) ?? cs.find((c) => c.moneda === mon))?.id ?? null;
      return {
        editando: !!d, cuentas: cs.map(vistaCuenta(S())), saldoInicial: d?.saldoInicial ?? 0,
        borrador: d
          ? {
            id: d.id, tipo: d.tipo, nombre: d.nombre, moneda: d.moneda, saldo: paraEditar(d.saldoInicial), interes: tasaParaEditar(d.interes),
            cuota: paraEditar(d.cuota), dia: String(d.dia || 1), fechaEsperada: d.fechaEsperada ?? '', cuentaMov: null, crearFijo: false, cuentaFijo: null,
          }
          : { id: nuevoId(), tipo: 'prestamo', nombre: '', moneda: 'BOB', saldo: '', interes: '', cuota: '', dia: '1', fechaEsperada: '', cuentaMov: null, crearFijo: true, cuentaFijo: fijo('BOB') },
      };
    },
    primeraCuota: (dia: string): Mes => primerMesDeCuota(diaDe(dia, 1), hoy()),
    guardarDeuda(b: BorradorDeuda): ResultadoApp<null, ErrorGuardar> {
      const previa = deudaDe(S(), b.id);
      const nombre = b.nombre.trim(), saldo = montoDe(b.saldo), cuota = montoDe(b.cuota);
      if (!saldo.ok) return saldo;
      if (!cuota.ok) return cuota;
      if (!nombre) return no('falta-nombre');
      if (!saldo.datos && !(previa && !previa.saldoInicial)) return no('falta-saldo');
      const prestamo = b.tipo === 'prestamo';
      if (prestamo && !cuota.datos) return no('falta-cuota');
      const d: Deuda = {
        ...(previa ?? { archivada: false }), id: b.id, tipo: previa ? previa.tipo : b.tipo, nombre, moneda: previa ? previa.moneda : b.moneda,
        saldoInicial: saldo.datos, interes: prestamo ? leerTasa(b.interes) : previa?.interes ?? 0, cuota: prestamo ? cuota.datos : previa?.cuota ?? CERO,
        dia: prestamo ? diaDe(b.dia, 1) : previa?.dia ?? 1, fechaEsperada: prestamo ? previa?.fechaEsperada ?? null : b.fechaEsperada || null,
      };
      if (previa) return x.aplicar([{ col: 'deudas', doc: d }]);
      const cuentaFijo = prestamo && b.crearFijo ? cuentasPara(S(), d.moneda).find((c) => c.id === b.cuentaFijo)?.id ?? null : null;
      if (prestamo && b.crearFijo && !cuentaFijo) return no('falta-cuenta-fijo');
      const cuentaMov = b.cuentaMov && cuentasPara(S(), d.moneda).some((c) => c.id === b.cuentaMov) ? b.cuentaMov : null;
      const r = crearDeuda({ deuda: d, cuentaMov, cuentaFijo, idMov: nuevoId(), idFijo: nuevoId() }, hoy());
      return x.aplicar([
        { col: 'deudas', doc: r.deuda }, ...(r.mov ? [{ col: 'movs' as const, doc: r.mov }] : []), ...(r.fijo ? [{ col: 'fijos' as const, doc: r.fijo }] : []),
      ]);
    },
    archivarDeuda(id: string): ResultadoApp<{ pendiente: number; moneda: MonedaApp }, ErrorGuardar> {
      const d = deudaDe(S(), id);
      if (!d) return no('falta-cuenta');
      const pendiente = saldoDeuda(S(), d), r = cerrarDeuda(S(), d, hoy(), nuevoId());
      const a = x.aplicar([
        ...(r.mov ? [{ col: 'movs' as const, doc: r.mov }] : []), { col: 'deudas', doc: r.deuda }, ...r.fijos.map((f) => ({ col: 'fijos' as const, doc: f })),
      ]);
      return a.ok ? si({ pendiente, moneda: d.moneda }) : a;
    },
    formularioPago(deudaId: string, tipo: TipoPago): FormularioPago | null {
      const d = deudaDe(S(), deudaId);
      if (!d) return null;
      const cs = cuentasPara(S(), d.moneda);
      if (!cs.length) return null;
      const fijoCuota = S().fijos.find((f) => f.deudaId === d.id && f.activo !== false && cuentaDe(S(), f.cuentaId));
      const ultima = x.ultimaCuenta();
      const cuenta = cs.find((c) => fijoCuota && c.id === fijoCuota.cuentaId) ?? cs.find((c) => c.id === ultima) ?? cs.find((c) => c.diaADia) ?? cs[0]!;
      const sugerido = montoSugerido(S(), d, tipo);
      return {
        deuda: { id: d.id, nombre: d.nombre, tipo: d.tipo, moneda: d.moneda }, tipo, cuentas: cs.map(vistaCuenta(S())), cuentaId: cuenta.id,
        monto: paraEditar(sugerido), interes: interesDePago(S(), d, tipo), maximo: maximoDe(S(), d, tipo),
        cuotaDe: cuotaQuePaga(S(), d, tipo, hoy())?.mes ?? null, fecha: hoy(),
      };
    },
    // DEU-02, DEU-03, DEU-06, DEU-07, DEU-10, FIJ-06: the movement first, then the month it settles.
    pagar(b: BorradorPago): ResultadoApp<null, ErrorGuardar> {
      const d = deudaDe(S(), b.deudaId);
      if (!d) return no('falta-cuenta');
      const monto = montoDe(b.monto);
      if (!monto.ok) return monto;
      const nota = { pago: `Pagar ${d.nombre}`, cobro: `Cobrar a ${d.nombre}`, prestamo: `Prestar más a ${d.nombre}`, recibido: `Recibir más de ${d.nombre}` }[b.tipo];
      const r = movimientoDeDeuda(S(), d, { id: nuevoId(), tipo: b.tipo, monto: monto.datos, cuentaId: b.cuentaId, fecha: b.fecha || hoy(), nota, esCuota: b.esCuota }, hoy());
      if (!r.ok) return no(r.codigo);
      return x.aplicar([{ col: 'movs', doc: r.datos.mov }, ...(r.datos.ocurrencia ? [{ col: 'ocurrencias' as const, doc: r.datos.ocurrencia }] : [])]);
    },

    // ---------- an expense someone owes you (DEU-11) ----------
    formularioSeparar(gastoId: string): FormularioSeparar | null {
      const g = S().movs.find((m) => m.id === gastoId);
      if (!g || g.tipo !== 'gasto') return null;
      const mon = monedaDe(S(), g.cuentaId);
      const k = S().categorias.find((c) => c.id === g.categoriaId);
      return {
        gasto: { id: g.id, nombre: g.nota || k?.nombre || 'Sin categoría', fecha: g.fecha, monto: g.monto, moneda: mon },
        personas: teDebenPara(S(), g).map((d) => ({ id: d.id, nombre: d.nombre, saldo: saldoDeuda(S(), d), moneda: d.moneda })),
        ocultas: S().deudas.some((d) => d.tipo === 'teDeben' && !d.archivada && d.moneda === mon && !!d.desde && d.desde > g.fecha),
      };
    },
    separarGasto(gastoId: string, texto: string, quien: string | { nombre: string }) {
      const g = S().movs.find((m) => m.id === gastoId);
      if (!g) return no('no-es-gasto' as const);
      const monto = montoDe(texto);
      if (!monto.ok) return monto;
      const r = separarGasto(S(), g, monto.datos, quien, { deuda: nuevoId(), prestamo: nuevoId() });
      if (!r.ok) return no(r.codigo === 'mas-que-el-gasto' ? 'mas-que-el-maximo' as const : r.codigo);
      const a = x.aplicar([...(r.datos.deuda ? [{ col: 'deudas' as const, doc: r.datos.deuda }] : []), ...r.datos.movs.map((m) => ({ col: 'movs' as const, doc: m }))]);
      return a.ok ? si({ nombre: r.datos.nombre, queda: r.datos.queda, monto: monto.datos, moneda: r.datos.moneda }) : a;
    },

    // ---------- goals (MET-01, MET-02) ----------
    formularioMeta(id?: string): FormularioMeta {
      const m = id ? S().metas.find((y) => y.id === id) : undefined, mes = mesDe(hoy());
      return {
        editando: !!m, desde: sumarMeses(mes, 1),
        borrador: m ? { id: m.id, nombre: m.nombre, monto: paraEditar(m.monto), mes: m.mes } : { id: nuevoId(), nombre: '', monto: '', mes: sumarMeses(mes, 12) },
      };
    },
    guardarMeta(b: BorradorMeta): ResultadoApp<null, ErrorGuardar> {
      const nombre = b.nombre.trim(), monto = montoDe(b.monto);
      if (!monto.ok) return monto;
      if (!nombre) return no('falta-nombre');
      if (!monto.datos) return no('falta-monto');
      const previa = S().metas.find((m) => m.id === b.id);
      const m: Meta = { ...(previa ?? { archivada: false }), id: b.id, nombre, monto: monto.datos, mes: b.mes || previa?.mes || sumarMeses(mesDe(hoy()), 12) };
      return x.aplicar([{ col: 'metas', doc: m }]);
    },
    archivarMeta(id: string): void {
      const m = S().metas.find((y) => y.id === id);
      if (!m) return;
      const r = archivarMeta(S(), m);
      x.aplicar([{ col: 'metas', doc: r.meta }, ...r.borrarApartados.map((a) => ({ col: 'apartados' as const, borrar: a }))]);
    },
    apartar(metaId: string, cuentaId: string, texto: string, signo: 1 | -1): ResultadoApp<null, ErrorGuardar> {
      const monto = montoDe(texto);
      if (!monto.ok) return monto;
      const r = apartar(S(), metaId, cuentaId, monto.datos, signo, hoy(), nuevoId());
      if (!r.ok) return no(r.codigo);
      return x.aplicar([{ col: 'apartados', doc: r.datos }]);
    },

    // ---------- categories (LIM-01, LIM-03) ----------
    formularioCategoria(id?: string): FormularioCategoria {
      const k = id ? S().categorias.find((c) => c.id === id) : undefined;
      return {
        editando: !!k, archivada: !!k?.archivada, colores: COLORES, iconos: ICONOS,
        borrador: k
          ? { id: k.id, nombre: k.nombre, tipo: k.tipo, color: k.color ?? COLORES[0]!, icono: k.icono ?? 'puntos', tope: k.tope ? paraEditar(k.tope) : '' }
          : { id: nuevoId(), nombre: '', tipo: 'gasto', color: COLORES[0]!, icono: 'puntos', tope: '' },
      };
    },
    guardarCategoria(b: BorradorCategoria): ResultadoApp<null, ErrorGuardar> {
      const nombre = b.nombre.trim(), tope = b.tipo === 'gasto' ? montoDe(b.tope) : si(CERO);
      if (!tope.ok) return tope;
      if (!nombre) return no('falta-nombre');
      const previa = S().categorias.find((k) => k.id === b.id);
      const k: Categoria = { ...(previa ?? { base: false, archivada: false }), id: b.id, nombre, tipo: previa ? previa.tipo : b.tipo, color: b.color, icono: b.icono, tope: tope.datos };
      return x.aplicar([{ col: 'categorias', doc: k }]);
    },
    archivarCategoria(id: string): ResultadoApp<{ archivada: boolean }, ErrorGuardar> {
      const k = S().categorias.find((c) => c.id === id);
      if (!k) return no('falta-categoria');
      const a = x.aplicar([{ col: 'categorias', doc: { ...k, archivada: !k.archivada } as Categoria }]);
      return a.ok ? si({ archivada: !k.archivada }) : a;
    },

    // ---------- Ajustes (AJU-01 to AJU-05, CTA-04) ----------
    guardarAjustes(b: BorradorAjustes): ResultadoApp<null, ErrorGuardar> {
      const irregular = montoDe(b.irregular);
      if (!irregular.ok) return irregular;
      const aj = cambiarTipoDeCambio(S().aj, leerTasa(b.tc), hoy());
      x.ponerAjustes({ ...aj, irregular: irregular.datos, inflacion: leerTasa(b.inflacion), horas: parseInt(b.horas, 10) || 0 });
      return si(null);
    },
    elegirColor(id: string): void {
      if (COLORES_PRINCIPALES.includes(id)) x.ponerAjustes({ ...S().aj, color: id });
    },

    // ---------- starting (DAT-02) ----------
    empezar(b: BorradorEmpezar): ResultadoApp<null, ErrorGuardar> {
      const h = hoy(), mes = mesDe(h);
      const irregular = montoDe(b.irregular), ingreso = montoDe(b.ingreso);
      if (!irregular.ok) return irregular;
      if (!ingreso.ok) return ingreso;
      const N: Estado = { aj: { ...ajustesBase(), empezado: true, irregular: irregular.datos }, cuentas: [], categorias: categoriasBase(), movs: [], fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [] };
      for (const c of b.cuentas.filter((y) => y.nombre.trim())) {
        const s = montoDe(c.saldo, true);
        if (!s.ok) return s;
        N.cuentas.push({ id: nuevoId(), nombre: c.nombre.trim(), moneda: c.moneda, saldoInicial: s.datos, rendimiento: 0, diaADia: c.moneda === 'BOB', archivada: false, desde: h });
      }
      if (!N.cuentas.length) return no('falta-cuenta');
      const banco = N.cuentas[1] ?? N.cuentas[0]!, idx = Math.max(1, parseInt(b.cuentaIngreso, 10) || 1);
      if (ingreso.datos) {
        N.fijos.push({ id: nuevoId(), nombre: 'Sueldo', tipo: 'ingreso', monto: ingreso.datos, cuentaId: (N.cuentas[idx - 1] ?? banco).id, categoriaId: 'sueldo', dia: diaDe(b.diaIngreso, 25), desde: mes, activo: true });
      }
      for (const g of b.gastos) {
        const m = montoDe(g.monto);
        if (!m.ok) return m;
        if (!g.nombre.trim() || !m.datos) continue;
        N.fijos.push({ id: nuevoId(), nombre: g.nombre.trim(), tipo: 'gasto', monto: m.datos, cuentaId: banco.id, categoriaId: 'casa', dia: diaDe(g.dia, 1), desde: mes, activo: true });
      }
      const mal = validarTodo(N);
      if (mal) return no(mal);
      x.reemplazar(N);
      return si(null);
    },

    // ---------- backup (DAT-04) and deleting everything (DAT-06) ----------
    respaldo(): { nombre: string; contenido: string } | null {
      if (x.ejemplo()) return null;
      const s = S(), datos: Record<string, unknown> = { aj: s.aj };
      for (const c of COLECCIONES) datos[c] = s[c];
      return { nombre: `rumbo-respaldo-${hoy()}.json`, contenido: JSON.stringify({ app: 'rumbo', version: 2, fecha: hoy(), datos }, null, 1) };
    },
    leerRespaldo(texto: string): { ok: true; datos: ResumenRespaldo } | { ok: false; error: ErrorRespaldo } {
      leido = null;
      let o: unknown;
      try { o = JSON.parse(texto); } catch { return { ok: false, error: { codigo: 'no-es-respaldo' } }; }
      if (!esRespaldo(o)) return { ok: false, error: { codigo: 'no-es-respaldo' } };
      let datos = o.datos;
      if (o.version === 1) {
        const conv = v1ACentavos(datos as never);
        if (!conv.ok) {
          const p = conv.problemas[0]!;
          const doc = p.coleccion === 'aj' ? null : ((datos[p.coleccion] as Record<string, unknown>[] | undefined) ?? []).find((d) => d.id === p.id);
          const nombre = doc ? String(doc.nota || doc.nombre || '') || null : null;
          return { ok: false, error: { codigo: p.motivo, coleccion: p.coleccion, nombre, fecha: doc && typeof doc.fecha === 'string' ? doc.fecha : null } };
        }
        datos = conv.datos as typeof datos;
      }
      const N = { aj: { ...ajustesBase(), ...(datos.aj ?? {}), empezado: true } } as Estado;
      for (const c of COLECCIONES) (N as unknown as Record<string, unknown>)[c] = Array.isArray(datos[c]) ? datos[c] : [];
      const mal = validarTodo(N);
      if (mal === 'cargando') return { ok: false, error: { codigo: 'cargando' } };
      if (mal) return { ok: false, error: { codigo: 'no-es-respaldo' } };
      leido = N;
      return {
        ok: true,
        datos: {
          cuentas: N.cuentas.length, movs: N.movs.length, fijos: N.fijos.length, deudas: N.deudas.length, metas: N.metas.length,
          fecha: typeof o.fecha === 'string' ? o.fecha : null, version: o.version,
        },
      };
    },
    cargarRespaldo(): ResultadoApp<null, 'sin-respaldo' | 'cargando' | CodigoError> {
      if (!leido) return no('sin-respaldo');
      const N = leido;
      leido = null;
      x.reemplazar(N);
      return si(null);
    },
    borrarTodo: (): void => { leido = null; x.borrarTodo(); },
  };
}

// What starting and loading a backup hand to the store: the main document and every collection.
export const datosDe = (N: Estado): Datos => ({
  main: { aj: N.aj } as Datos['main'],
  cols: Object.fromEntries(COLECCIONES.map((c) => [c, N[c]])) as unknown as Datos['cols'],
});

