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


// ---------- Desglose (DES-01 to DES-05) ----------

export interface CategoriaDesglose {
  categoria: CategoriaVista;
  total: number;
  tope: number | null;
  pctTope: number | null; // of its limit, LIM-04
  nivel: 'ok' | 'ambar' | 'rojo' | null;
  deCada100: number | null; // DES-02
  horas: number | null; // DES-02, AJU-03
  enDiezAnios: number | null; // DES-02: an estimate in cents
}

export interface VistaDesglose {
  mes: Mes;
  entro: number;
  salio: number;
  quedo: number;
  porHora: number | null; // cents per hour of work
  capital: number; // DES-04
  ajustes: number; // DES-03
  cambio: number;
  cierres: number;
  categorias: CategoriaDesglose[];
  ingresos: IngresoDesglose[]; // DES-06: biggest first; they add up to `entro`
}

export interface IngresoDesglose {
  categoria: CategoriaVista;
  total: number;
  deCada100: number; // DES-06: of every 100 that came in
}

// ---------- Plan (PAN-03, PAN-07 to PAN-09) ----------

export interface CuentaPlan {
  id: string;
  nombre: string;
  moneda: MonedaApp;
  saldo: number; // in its currency
  enBs: number | null; // a dollar account, in Bs
  apartado: number; // in its currency
  rendimiento: number;
  diaADia: boolean;
}

export interface FijoPlan {
  id: string;
  nombre: string;
  tipo: 'gasto' | 'ingreso';
  monto: number;
  moneda: MonedaApp;
  dia: number;
  cuenta: string;
  categoria: CategoriaVista;
  icono: string;
  pendiente: boolean;
}

export interface DeudaPlan {
  id: string;
  nombre: string;
  tipo: 'prestamo' | 'persona' | 'teDeben';
  moneda: MonedaApp;
  saldo: number;
  interes: number; // a rate
  cuota: number;
  fin: Mes | null;
  crece: boolean;
  fechaEsperada: Mes | null;
}

export interface MetaVista {
  id: string;
  nombre: string;
  ap: number;
  monto: number;
  pct: number;
  mes: Mes;
  aporte: number;
}

export interface VistaPlan {
  patrimonio: { total: number; cuentas: number; teDeben: number; deudas: number };
  cuentas: CuentaPlan[];
  fijos: FijoPlan[];
  fijosEntra: number;
  fijosSale: number;
  deudas: DeudaPlan[];
  metas: MetaVista[];
  apartadoMetas: number;
  categorias: { cantidad: number; topes: { nombre: string; tope: number }[] };
}

export interface VistaDeuda {
  id: string;
  nombre: string;
  tipo: 'prestamo' | 'persona' | 'teDeben';
  moneda: MonedaApp;
  saldo: number;
  fechaEsperada: Mes | null;
  movimientos: FilaMovimiento[];
  prestamo: {
    inicial: number;
    pagado: number;
    fin: Mes | null;
    cuotas: number;
    crece: boolean;
    interesPorPagar: number;
    tasa: number;
    cuota: number;
    dia: number | null;
    proximas: { mes: Mes; interes: number; capital: number; saldo: number }[];
    adelanto: { fin: Mes; mesesAntes: number; interesAhorrado: number; libreAlDia: number } | null; // PRO-08
  } | null;
}

export interface VistaMeta {
  id: string;
  nombre: string;
  monto: number;
  mes: Mes;
  ap: number;
  pct: number;
  vasBien: boolean;
  neto: number; // the monthly net of the ritmo, an estimate
  pide: number;
  faltaMes: number;
  aporte: number;
  meses: number;
  esteMes: number;
  falta: number;
  cuentas: { id: string; nombre: string; moneda: MonedaApp; libre: number }[];
  dondeEsta: { cuentaId: string; cuenta: string; moneda: MonedaApp; monto: number; enBs: number | null }[];
}

export interface CategoriaEditable extends CategoriaVista {
  tope: number;
  archivada: boolean;
}

export interface VistaAjustes {
  tc: number;
  tcFecha: Dia | null;
  tcDias: number | null;
  ultimoCambio: { tc: number; fecha: Dia } | null;
  irregular: number;
  promedioIrregular: number;
  inflacion: number;
  horas: number;
  color: string;
}

// ---------- forms ----------

export interface BorradorCuenta {
  id: string;
  nombre: string;
  moneda: MonedaApp;
  saldo: string; // only for a new account (FMT-03)
  rendimiento: string;
  diaADia: boolean;
}
export interface FormularioCuenta {
  editando: boolean;
  borrador: BorradorCuenta;
  saldo: number | null; // the current balance of an account being edited
  tieneMovimientos: boolean; // its currency does not change
  archivada: boolean;
}

export interface BorradorFijo {
  id: string;
  nombre: string;
  tipo: 'gasto' | 'ingreso';
  monto: string;
  dia: string;
  cuentaId: string;
  categoriaId: string;
  deudaId: string | null;
}
export interface FormularioFijo {
  editando: boolean;
  borrador: BorradorFijo;
  cuentas: CuentaVista[];
  categorias: { gasto: CategoriaVista[]; ingreso: CategoriaVista[] };
  prestamos: { id: string; nombre: string; moneda: MonedaApp }[];
}

export interface BorradorDeuda {
  id: string;
  tipo: 'prestamo' | 'persona' | 'teDeben';
  nombre: string;
  moneda: MonedaApp;
  saldo: string;
  interes: string;
  cuota: string;
  dia: string;
  fechaEsperada: string; // AAAA-MM or empty
  cuentaMov: string | null; // DEU-07: the money moves today through this account
  crearFijo: boolean; // FIJ-04
  cuentaFijo: string | null;
}
export interface FormularioDeuda {
  editando: boolean;
  borrador: BorradorDeuda;
  cuentas: CuentaVista[];
  saldoInicial: number; // of a debt being edited
}

export type TipoPago = 'pago' | 'cobro' | 'prestamo' | 'recibido';
export interface FormularioPago {
  deuda: { id: string; nombre: string; tipo: 'prestamo' | 'persona' | 'teDeben'; moneda: MonedaApp };
  tipo: TipoPago;
  cuentas: CuentaVista[];
  cuentaId: string;
  monto: string; // suggested
  interes: number; // DEU-02: of a loan's payment today
  maximo: number | null;
  cuotaDe: Mes | null; // FIJ-06
  fecha: Dia;
}
export interface BorradorPago {
  deudaId: string;
  tipo: TipoPago;
  cuentaId: string;
  monto: string;
  fecha: Dia;
  esCuota: boolean;
}

export interface BorradorMeta {
  id: string;
  nombre: string;
  monto: string;
  mes: Mes;
}
export interface FormularioMeta {
  editando: boolean;
  borrador: BorradorMeta;
  desde: Mes; // the earliest month to pick
}

export interface BorradorCategoria {
  id: string;
  nombre: string;
  tipo: 'gasto' | 'ingreso';
  color: string;
  icono: string;
  tope: string;
}
export interface FormularioCategoria {
  editando: boolean;
  borrador: BorradorCategoria;
  archivada: boolean;
  colores: string[];
  iconos: string[];
}

export interface BorradorAjustes {
  tc: string;
  irregular: string;
  inflacion: string;
  horas: string;
}

export interface BorradorEmpezar {
  cuentas: { nombre: string; moneda: MonedaApp; saldo: string }[];
  ingreso: string;
  diaIngreso: string;
  cuentaIngreso: string; // 1, 2…
  irregular: string;
  gastos: { nombre: string; dia: string; monto: string }[];
}

export interface FormularioSeparar {
  gasto: { id: string; nombre: string; fecha: Dia; monto: number; moneda: MonedaApp };
  personas: { id: string; nombre: string; saldo: number; moneda: MonedaApp }[];
  ocultas: boolean; // people added after this expense
}

export interface ResumenRespaldo {
  cuentas: number;
  movs: number;
  fijos: number;
  deudas: number;
  metas: number;
  fecha: Dia | null;
  version: 1 | 2;
}
export type ErrorRespaldo =
  | { codigo: 'no-es-respaldo' | 'cargando' }
  | { codigo: 'mas-de-2-decimales' | 'no-es-numero'; coleccion: string; nombre: string | null; fecha: Dia | null };

export type ErrorGuardar =
  | 'falta-nombre' | 'falta-monto' | 'falta-saldo' | 'falta-cuota' | 'mas-de-2-decimales' | 'falta-cuenta' | 'falta-cuenta-fijo'
  | 'falta-quien' | 'mas-que-el-maximo' | 'mas-que-el-libre' | 'mas-que-lo-apartado' | 'saldo-no-es-cero' | 'falta-categoria'
  | 'otra-moneda' | 'no-es-gasto' | 'cargando' | CodigoError;

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

  leerMonto(texto: string): number | null; // FMT-03: cents, or null if it cannot be read
  desglose(mes: Mes): VistaDesglose;
  plan(): VistaPlan;
  deuda(id: string, adelanto: number): VistaDeuda | null; // adelanto in cents a month
  meta(id: string): VistaMeta | null;
  categorias(): CategoriaEditable[];
  ajustes(): VistaAjustes;

  formularioCuenta(id?: string): FormularioCuenta;
  guardarCuenta(b: BorradorCuenta): ResultadoApp<null, ErrorGuardar>;
  archivarCuenta(id: string): ResultadoApp<{ archivada: boolean; nombre: string }, ErrorGuardar>; // CTA-08
  cuadrar(id: string, real: string): ResultadoApp<{ diferencia: number; moneda: MonedaApp }, ErrorGuardar>; // CTA-03

  formularioFijo(id?: string): FormularioFijo | null; // null: there is no account yet
  guardarFijo(b: BorradorFijo): ResultadoApp<null, ErrorGuardar>;
  quitarFijo(id: string): void;

  formularioDeuda(id?: string): FormularioDeuda;
  primeraCuota(dia: string): Mes; // FIJ-07
  guardarDeuda(b: BorradorDeuda): ResultadoApp<null, ErrorGuardar>;
  archivarDeuda(id: string): ResultadoApp<{ pendiente: number; moneda: MonedaApp }, ErrorGuardar>; // DEU-09
  formularioPago(deudaId: string, tipo: TipoPago): FormularioPago | null; // null: no account in its currency
  pagar(b: BorradorPago): ResultadoApp<null, ErrorGuardar>;

  formularioSeparar(gastoId: string): FormularioSeparar | null;
  separarGasto(gastoId: string, monto: string, quien: string | { nombre: string }): ResultadoApp<{ nombre: string; queda: number; monto: number; moneda: MonedaApp }, ErrorGuardar>;

  formularioMeta(id?: string): FormularioMeta;
  guardarMeta(b: BorradorMeta): ResultadoApp<null, ErrorGuardar>;
  archivarMeta(id: string): void;
  apartar(metaId: string, cuentaId: string, monto: string, signo: 1 | -1): ResultadoApp<null, ErrorGuardar>;

  formularioCategoria(id?: string): FormularioCategoria;
  guardarCategoria(b: BorradorCategoria): ResultadoApp<null, ErrorGuardar>;
  archivarCategoria(id: string): ResultadoApp<{ archivada: boolean }, ErrorGuardar>;

  guardarAjustes(b: BorradorAjustes): ResultadoApp<null, ErrorGuardar>;
  elegirColor(id: string): void; // AJU-05

  empezar(b: BorradorEmpezar): ResultadoApp<null, ErrorGuardar>; // DAT-02
  respaldo(): { nombre: string; contenido: string } | null; // DAT-04; null in the example
  leerRespaldo(texto: string): { ok: true; datos: ResumenRespaldo } | { ok: false; error: ErrorRespaldo };
  cargarRespaldo(): ResultadoApp<null, 'sin-respaldo' | 'cargando' | CodigoError>;
  borrarTodo(): void; // DAT-06
}
