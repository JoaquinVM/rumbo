// The app as the screens see it (design.md, Capas): what each screen shows and what it can do. The presentation knows
// only this file; the application layer implements it and the composition hands it over. Plain data, no rules.
// Money is always in whole cents of its currency (Bs unless it says `moneda`); estimates (ritmo, projection, «¿Y si…?»,
// the amount a day) may carry fractions of a cent and are rounded when shown. Commands answer with a code, never a
// text: the screen picks the words.
import type { CodigoError } from './api.js';

export type MonedaApp = 'BOB' | 'USD';
export type Dia = string; // AAAA-MM-DD
export type Mes = string; // AAAA-MM
export type OrigenDatos = 'servidor' | 'artifact' | 'navegador' | 'memoria';

export type ResultadoApp<T, C extends string> = { ok: true; datos: T } | { ok: false; codigo: C };

export interface EstadoGuardado {
  pendientes: number; // DAT-07: writes that did not reach the server yet
  sesionVencida: boolean; // DAT-07: Cloudflare Access asked to sign in again
  perdido: string | null; // a write the server refused (DAT-09)
  sinRespuesta: boolean; // the data did not answer in 10 s
  noAbrio: boolean; // the artifact's base failed on this visit
}

export interface EstadoApp {
  cargado: boolean;
  ejemplo: boolean; // DAT-01: the example, never saved
  origen: OrigenDatos;
  hoy: Dia;
  color: string; // AJU-05: the main color
  guardado: EstadoGuardado;
}

export interface CategoriaVista {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  tipo: 'gasto' | 'ingreso';
}

export interface CuentaVista {
  id: string;
  nombre: string;
  moneda: MonedaApp;
  saldo: number; // in its currency
}

// ---------- Rumbo ----------

export interface OpcionesRumbo {
  anios: number; // 1, 5, 10 or 20
  nominal: boolean;
  recortes: Record<string, number>; // % less in a category
  extra: number; // extra income a month
  adelanto: number; // extra a month to the first loan
}

export type MarcaGrafica =
  | { tipo: 'prestamo'; indice: number; fin: Mes; nombre: string }
  | { tipo: 'meta'; indice: number; nombre: string };

export interface VistaRumbo {
  hoy: Dia;
  meses: number;
  titular: {
    seAcabaEn: Mes | null; // PRO-07
    salePorMes: number; // PRO-07: −neto
    final: number;
    nominalFinal: number;
    enDolares: number; // final ÷ exchange rate
    inflacion: number;
    patrimonio: { total: number; cuentas: number; deudas: number; teDeben: number };
  };
  serie: number[];
  netoNegativo: boolean;
  serieAjustes: number[] | null; // PRO-08: the green line
  marcas: MarcaGrafica[];
  tcFijo: number | null; // PRO-06: only with a dollar account
  hayMetas: boolean;
  hoyBloque: {
    libre: number;
    alDia: number;
    dias: number;
    disp: number;
    compBs: number;
    metas: number;
    prox: { nombre: string; fecha: Dia } | null;
  };
  porConfirmar: { clave: string; nombre: string; cuenta: string; fecha: Dia; monto: number }[];
  proximos: { nombre: string; fecha: Dia }[];
  avisoTipoDeCambio: { dias: number | null; tc: number } | null;
  avisosTopes: { nombre: string; gastado: number; tope: number; pct: number; nivel: 'ambar' | 'rojo' }[];
  metas: {
    lista: { id: string; nombre: string; ap: number; monto: number; pct: number; mes: Mes; aporte: number }[];
    pide: number;
    vasBien: boolean;
    faltaMes: number;
  };
  indicadores: {
    tasa: number;
    colchon: number;
    neto: number;
    ingreso: number;
    gasto: number;
    deudaTotal: number;
    hayPrestamos: boolean;
    libreDePrestamos: Mes | null;
  };
  ySi: {
    categorias: { id: string; nombre: string; promedio: number }[];
    maxExtra: number; // in whole Bs, the slider's top
    prestamo: { nombre: string } | null;
    resultado: {
      final: number;
      diferencia: number;
      adelanto: { fin: Mes; mesesAntes: number; interesAhorrado: number } | null;
    } | null;
  };
}

// ---------- Movimientos ----------

export interface FilaMovimiento {
  id: string;
  tipo: 'gasto' | 'ingreso' | 'transferencia' | 'ajuste' | 'pago' | 'cobro' | 'prestamo' | 'recibido' | 'interes' | 'cierre';
  nota: string;
  fecha: Dia;
  fijo: boolean;
  monto: number;
  montoDestino: number | null;
  interes: number | null;
  capital: number | null;
  sentido: number;
  cuenta: { nombre: string; moneda: MonedaApp } | null;
  destino: { nombre: string; moneda: MonedaApp } | null;
  deuda: { nombre: string; tipo: 'prestamo' | 'persona' | 'teDeben'; moneda: MonedaApp } | null;
  categoria: CategoriaVista;
}

export interface OpcionesMovimientos {
  mes: Mes;
  cuenta: string; // 'todas' or an account id
  categoria: string | null; // MOV-07
}

export interface VistaMovimientos {
  mes: Mes;
  hoy: Dia;
  salio: number;
  entro: number;
  cantidad: number;
  cuentas: { id: string; nombre: string }[];
  cuentaElegida: string | null; // its name, with a filter
  categoria: (CategoriaVista & { total: number; cantidad: number }) | null;
  elegibles: CategoriaVista[];
  dias: { fecha: Dia; total: number; filas: FilaMovimiento[] }[];
}

// ---------- Anotar ----------

export type TipoAnotar = 'gasto' | 'ingreso' | 'transferencia';

export interface BorradorMovimiento {
  id: string;
  tipo: TipoAnotar;
  cuentaId: string;
  cuentaDestinoId: string | null;
  categoriaId: string | null;
  monto: string; // as written (FMT-03)
  montoDestino: string;
  nota: string;
  fecha: Dia;
  usarTc: boolean; // CTA-06: keep the rate of this exchange as the exchange rate
}

export interface FormularioMovimiento {
  editando: boolean;
  borrador: BorradorMovimiento;
  cuentas: CuentaVista[];
  porUso: { gasto: CategoriaVista[]; ingreso: CategoriaVista[] }; // MOV-02
}

export type ErrorAnotar =
  | 'falta-monto' | 'mas-de-2-decimales' | 'misma-cuenta' | 'falta-monto-destino' | 'falta-categoria' | 'falta-cuenta'
  | 'cargando' // the contracts' check has not arrived yet
  | CodigoError;

export type Anotado =
  | { aviso: 'gasto' | 'ingreso' | 'transferencia' | 'guardado' }
  | { aviso: 'antes-de-abrir'; cuenta: string }; // CTA-07

export interface DetalleMovimiento {
  id: string;
  tipo: FilaMovimiento['tipo'];
  donde: string; // account or debt
  fecha: Dia;
  monto: number;
  moneda: MonedaApp;
  interes: number | null;
  capital: number | null;
  deGasto: { nombre: string; fecha: Dia } | null; // DEU-12
}

export type ErrorFijo = 'falta-monto' | 'mas-de-2-decimales' | 'ya-estaba' | 'cargando' | CodigoError;

// ---------- the app ----------

export interface App {
  estado(): EstadoApp;
  suscribir(alCambiar: () => void): () => void;

  rumbo(o: OpcionesRumbo): VistaRumbo;
  movimientos(o: OpcionesMovimientos): VistaMovimientos;

  formulario(id?: string): FormularioMovimiento | null; // null: there is no account yet
  notasSugeridas(categoriaId: string): string[];
  avisoTope(b: BorradorMovimiento): number | null; // MOV-05: % of the limit after this expense, from 80 %
  tipoDeCambio(b: BorradorMovimiento): number | null; // CTA-06: Bs per dollar of an exchange being written
  anotar(b: BorradorMovimiento): ResultadoApp<Anotado, ErrorAnotar>;
  borrarMovimiento(id: string): void;
  detalle(id: string): DetalleMovimiento | null;
  devolverAlGasto(id: string): ResultadoApp<null, 'no-sale-de-un-gasto' | 'cargando' | CodigoError>;

  confirmarFijo(clave: string, monto: string): ResultadoApp<{ nombre: string }, ErrorFijo>;
  saltarFijo(clave: string): ResultadoApp<null, ErrorFijo>;
}
