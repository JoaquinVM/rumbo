// The documents Rumbo keeps (docs/DOMINIO.md), with the same fields as the v1 and every amount of money in cents
// (DAT-08). Rates are not money: the exchange rate, inflation, account yields and the interest of a debt stay decimal.
import type { Centavos, Moneda } from './dinero';
import type { Dia, Mes } from './fechas';

export interface Ajustes {
  tc: number;
  tcFecha: Dia | null;
  inflacion: number;
  irregular: Centavos;
  horas: number;
  empezado: boolean;
  color?: string;
}

export interface Cuenta {
  id: string;
  nombre: string;
  moneda: Moneda;
  saldoInicial: Centavos;
  rendimiento?: number;
  diaADia?: boolean;
  archivada?: boolean;
  desde?: Dia;
}

export type TipoCategoria = 'gasto' | 'ingreso';
export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  tope?: Centavos;
  color?: string;
  icono?: string;
  base?: boolean;
  archivada?: boolean;
}

export type TipoMovimiento =
  | 'gasto' | 'ingreso' | 'transferencia' | 'ajuste' | 'pago' | 'cobro' | 'prestamo' | 'recibido' | 'interes' | 'cierre';
export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  fecha: Dia;
  monto: Centavos;
  cuentaId?: string;
  cuentaDestinoId?: string;
  montoDestino?: Centavos;
  categoriaId?: string;
  nota?: string;
  deudaId?: string;
  interes?: Centavos;
  capital?: Centavos;
  sentido?: number;
  tc?: number | null;
  fijoId?: string;
  mes?: Mes;
  deGastoId?: string;
}

export interface Fijo {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  monto: Centavos;
  cuentaId: string;
  categoriaId: string;
  dia: number;
  deudaId?: string | null;
  desde?: Mes;
  activo?: boolean;
}

export interface Ocurrencia {
  id: string;
  fijoId: string;
  mes: Mes;
  estado: 'confirmado' | 'saltado';
  movId: string | null;
}

export type TipoDeuda = 'prestamo' | 'persona' | 'teDeben';
export interface Deuda {
  id: string;
  tipo: TipoDeuda;
  nombre: string;
  moneda: Moneda;
  saldoInicial: Centavos;
  interes?: number;
  cuota?: Centavos;
  dia?: number;
  fechaEsperada?: Mes | null;
  desde?: Dia;
  archivada?: boolean;
}

export interface Meta {
  id: string;
  nombre: string;
  monto: Centavos;
  mes: Mes;
  archivada?: boolean;
}

export interface Apartado {
  id: string;
  metaId: string;
  cuentaId: string;
  monto: Centavos;
  fecha: Dia;
}

export interface Estado {
  aj: Ajustes;
  cuentas: Cuenta[];
  categorias: Categoria[];
  movs: Movimiento[];
  fijos: Fijo[];
  ocurrencias: Ocurrencia[];
  deudas: Deuda[];
  metas: Meta[];
  apartados: Apartado[];
}

export const COLECCIONES = ['cuentas', 'categorias', 'movs', 'fijos', 'ocurrencias', 'deudas', 'metas', 'apartados'] as const;

// A result the screen has to read: TypeScript makes it handle every error code.
export type Resultado<T, C extends string> = { ok: true; datos: T } | { ok: false; codigo: C; maximo?: Centavos };
export const bien = <T>(datos: T): { ok: true; datos: T } => ({ ok: true, datos });
export const error = <C extends string>(codigo: C, maximo?: Centavos): { ok: false; codigo: C; maximo?: Centavos } =>
  maximo === undefined ? { ok: false, codigo } : { ok: false, codigo, maximo };

export const activos = <T extends { archivada?: boolean }>(a: readonly T[]): T[] => a.filter((x) => !x.archivada);
export const cuentaDe = (S: Estado, id: string | undefined): Cuenta | undefined => S.cuentas.find((c) => c.id === id);
export const monedaDe = (S: Estado, id: string | undefined): Moneda => cuentaDe(S, id)?.moneda ?? 'BOB';
export const deudaDe = (S: Estado, id: string | undefined): Deuda | undefined => S.deudas.find((d) => d.id === id);
export const fijosActivos = (S: Estado): Fijo[] => S.fijos.filter((f) => f.activo !== false);
