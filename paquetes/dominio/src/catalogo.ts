// The base catalog of a new Rumbo, the same as the v1's (CATS_BASE, AJ_BASE): categories with their color and icon,
// and the starting settings. Money in cents.
import { CERO, centavos } from './dinero';
import type { Ajustes, Categoria } from './modelo';

const base = (id: string, nombre: string, color: string, icono: string, tipo: 'gasto' | 'ingreso'): Categoria =>
  ({ id, nombre, color, icono, tipo, base: true, tope: CERO, archivada: false });

export const categoriasBase = (): Categoria[] => [
  base('comida', 'Comida fuera', '#E0703A', 'comida', 'gasto'),
  base('super', 'Súper', '#3E9B5C', 'carrito', 'gasto'),
  base('casa', 'Casa', '#5A6CD8', 'casa', 'gasto'),
  base('transporte', 'Transporte', '#2F93B5', 'auto', 'gasto'),
  base('salud', 'Salud', '#D04F78', 'salud', 'gasto'),
  base('ocio', 'Ocio', '#9A5BD0', 'ocio', 'gasto'),
  base('compras', 'Compras', '#C08A1F', 'bolsa', 'gasto'),
  base('suscripciones', 'Suscripciones', '#6B7F8C', 'play', 'gasto'),
  base('educacion', 'Educación', '#2E8F86', 'libro', 'gasto'),
  base('intereses', 'Intereses', '#B5482E', 'porcentaje', 'gasto'),
  base('otros_g', 'Otros', '#808A84', 'puntos', 'gasto'),
  base('sueldo', 'Sueldo', '#1E7A55', 'bandeja', 'ingreso'),
  base('negocio', 'Negocio', '#2E8F86', 'maletin', 'ingreso'),
  base('ventas', 'Ventas', '#4A8F3A', 'etiqueta', 'ingreso'),
  base('extra', 'Extra', '#3E9B5C', 'estrella', 'ingreso'),
  base('otros_i', 'Otros', '#6A8A7A', 'puntos', 'ingreso'),
];

export const ajustesBase = (): Ajustes =>
  ({ tc: 12.5, tcFecha: null, inflacion: 8, irregular: centavos(0), horas: 160, empezado: false });

// A category that is no longer there (v1 catDe): shown as «Sin categoría».
export const categoriaDesconocida = (id: string): Categoria =>
  ({ id, nombre: 'Sin categoría', color: '#808A84', icono: 'puntos', tipo: 'gasto' });
