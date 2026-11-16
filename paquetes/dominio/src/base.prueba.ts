// The base state of the tests, the same as the v1's (pruebas/v1/verificar.mjs) in cents: Efectivo Bs 650, Banco
// Bs 3.550 and Dólares US$ 1.200 with the exchange rate at 12,50. Only the tests use it.
import { centavos as c } from './dinero';
import type { Categoria, Deuda, Estado, Fijo } from './modelo';

export const HOY = '2026-11-10';

const cat = (id: string, nombre: string, tipo: 'gasto' | 'ingreso'): Categoria => ({ id, nombre, tipo, tope: c(0), base: true, archivada: false });
export const categoriasBase = (): Categoria[] => [
  cat('comida', 'Comida fuera', 'gasto'), cat('super', 'Súper', 'gasto'), cat('casa', 'Casa', 'gasto'),
  cat('transporte', 'Transporte', 'gasto'), cat('salud', 'Salud', 'gasto'), cat('ocio', 'Ocio', 'gasto'),
  cat('compras', 'Compras', 'gasto'), cat('suscripciones', 'Suscripciones', 'gasto'), cat('educacion', 'Educación', 'gasto'),
  cat('intereses', 'Intereses', 'gasto'), cat('otros_g', 'Otros', 'gasto'),
  cat('sueldo', 'Sueldo', 'ingreso'), cat('negocio', 'Negocio', 'ingreso'), cat('ventas', 'Ventas', 'ingreso'),
  cat('extra', 'Extra', 'ingreso'), cat('otros_i', 'Otros', 'ingreso'),
];

export const vacio = (): Estado => ({
  aj: { tc: 12.5, tcFecha: null, inflacion: 8, irregular: c(0), horas: 160, empezado: false },
  cuentas: [], categorias: [], movs: [], fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [],
});

export function base(): Estado {
  const S = vacio();
  S.aj = { ...S.aj, tc: 12.5, tcFecha: '2026-11-01', inflacion: 0, irregular: c(0), horas: 160, empezado: true };
  S.categorias = categoriasBase();
  S.cuentas = [
    { id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: c(65000), rendimiento: 0, diaADia: true },
    { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(355000), rendimiento: 0, diaADia: true },
    { id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: c(120000), rendimiento: 0, diaADia: false },
  ];
  return S;
}

// The bank loan of the specs: Bs 18.400 at 14 % with a payment of Bs 900 on the 20th.
export const prestamo = (extra: Partial<Deuda> = {}): Deuda =>
  ({ id: 'pr', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: c(1840000), interes: 14, cuota: c(90000), dia: 20, ...extra });

export function conFijos(S: Estado, lista: (Partial<Fijo> & Pick<Fijo, 'nombre' | 'tipo' | 'monto' | 'categoriaId' | 'dia'>)[]): Estado {
  S.fijos = lista.map((f, i) => ({ id: 'f' + i, cuentaId: 'bn', desde: '2026-11', activo: true, ...f }));
  return S;
}

// The Hoy scenario: salary on the 25th; electricity, streaming, internet and the loan payment still to pay; a goal
// that asks Bs 500 this month.
export function escenarioHoy(): Estado {
  const S = conFijos(base(), [
    { nombre: 'Sueldo', tipo: 'ingreso', monto: c(800000), categoriaId: 'sueldo', dia: 25 },
    { nombre: 'Luz', tipo: 'gasto', monto: c(18000), categoriaId: 'casa', dia: 8 },
    { nombre: 'Streaming', tipo: 'gasto', monto: c(6000), categoriaId: 'suscripciones', dia: 12 },
    { nombre: 'Internet', tipo: 'gasto', monto: c(20000), categoriaId: 'casa', dia: 15 },
    { nombre: 'Cuota', tipo: 'gasto', monto: c(90000), categoriaId: 'intereses', dia: 20 },
  ]);
  S.metas = [{ id: 'm', nombre: 'Meta', monto: c(650000), mes: '2027-12' }];
  return S;
}
