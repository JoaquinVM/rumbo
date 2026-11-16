// A person of their own for each test (the fake Access of servidor-prueba.mjs), starting with nothing saved, and
// their data straight from the server. The token goes only to Rumbo's server, never to Google Fonts.
import { test as base, expect, type APIRequestContext } from '@playwright/test';

export const TOKEN = 'token-de-prueba-e2e'; // same as servidor-prueba.mjs
const ORIGEN = 'localhost:4173';

export interface Datos { main: { aj: Record<string, unknown> } | null; cols: Record<string, Record<string, unknown>[]> }
export interface Persona {
  token: string;
  cargar(d: Datos): Promise<void>;
  leer(): Promise<Datos>;
  movs(): Promise<Record<string, unknown>[]>;
}

let siguiente = 0;
export const test = base.extend<{ persona: Persona }>({
  persona: async ({ page, request }, usar, info) => {
    const token = `${TOKEN}-${info.workerIndex * 1000 + siguiente++}`;
    const headers = { 'cf-access-jwt-assertion': token };
    expect((await request.delete('/api/v2/datos', { headers })).status()).toBe(204);
    await page.route((url) => url.host === ORIGEN, (r) => r.continue({ headers: { ...r.request().headers(), ...headers } }));
    const leer = async (api: APIRequestContext = request): Promise<Datos> => (await api.get('/api/v2/datos', { headers })).json();
    await usar({
      token,
      cargar: async (d) => { expect((await request.put('/api/v2/datos', { headers, data: d })).status()).toBe(204); },
      leer: () => leer(),
      movs: async () => (await leer()).cols.movs ?? [],
    });
  },
});
export { expect };

const pad = (n: number): string => String(n).padStart(2, '0');
export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const cat = (id: string, nombre: string, color: string, icono: string, tipo: 'gasto' | 'ingreso') =>
  ({ id, nombre, color, icono, tipo, tope: 0, base: true, archivada: false });

// Efectivo Bs 650, Banco Bs 3.550 and Dólares US$ 1.200 at 12,50; the electricity and internet due today; an
// almuerzo and the supermarket today. Amounts in cents.
export function datosDePrueba(): Datos {
  const h = hoy(), mes = h.slice(0, 7), dia = Number(h.slice(8));
  return {
    main: { aj: { tc: 12.5, tcFecha: h, inflacion: 8, irregular: 0, horas: 160, empezado: true } },
    cols: {
      categorias: [
        cat('comida', 'Comida fuera', '#E0703A', 'comida', 'gasto'), cat('super', 'Súper', '#3E9B5C', 'carrito', 'gasto'),
        cat('casa', 'Casa', '#5A6CD8', 'casa', 'gasto'), cat('transporte', 'Transporte', '#2F93B5', 'auto', 'gasto'),
        cat('sueldo', 'Sueldo', '#1E7A55', 'bandeja', 'ingreso'), cat('negocio', 'Negocio', '#2E8F86', 'maletin', 'ingreso'),
      ],
      cuentas: [
        { id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 65000, rendimiento: 0, diaADia: true, archivada: false },
        { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 355000, rendimiento: 0, diaADia: true, archivada: false },
        { id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: 120000, rendimiento: 0, diaADia: false, archivada: false },
      ],
      fijos: [
        { id: 'luz', nombre: 'Luz', tipo: 'gasto', monto: 18000, cuentaId: 'bn', categoriaId: 'casa', dia, desde: mes, activo: true },
        { id: 'internet', nombre: 'Internet', tipo: 'gasto', monto: 20000, cuentaId: 'bn', categoriaId: 'casa', dia, desde: mes, activo: true },
      ],
      movs: [
        { id: 'almuerzo', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 3500, fecha: h, nota: 'Almuerzo' },
        { id: 'super', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'super', monto: 32050, fecha: h, nota: 'Súper de la semana' },
      ],
      ocurrencias: [], deudas: [], metas: [], apartados: [],
    },
  };
}

// PAN-04: nothing wider than the 375 px screen.
export async function sinScrollHorizontal(page: import('@playwright/test').Page): Promise<void> {
  const a = await page.evaluate(() => ({ pagina: document.documentElement.scrollWidth, ventana: window.innerWidth }));
  expect(a.ventana).toBe(375);
  expect(a.pagina).toBeLessThanOrEqual(a.ventana);
}

// Opens Anotar and waits until the page has put the cursor in the amount (Anotar.tsx does it 60 ms after opening):
// typing in another field before that would send the text to the amount, as a person typing in that instant would.
export async function abrirAnotar(page: import('@playwright/test').Page): Promise<import('@playwright/test').Locator> {
  await page.getByRole('button', { name: 'Anotar' }).click();
  const hoja = page.getByRole('dialog');
  await expect(hoja.locator('#m-monto')).toBeFocused();
  return hoja;
}
