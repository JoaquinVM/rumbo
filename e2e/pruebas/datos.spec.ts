// DAT-01, DAT-02, DAT-04, DAT-06, AJU-05, PAN-10: starting with my data from the example, downloading and loading a
// backup (also one of the v1), the main color, deleting everything, and what lets a phone install Rumbo.
import { readFile } from 'node:fs/promises';
import { abrir, datosDePrueba, expect, sinScrollHorizontal, test } from './persona';

test('empezar con mis datos desde el ejemplo', async ({ page, persona }) => {
  await abrir(page, '/');
  await expect(page.getByText('Datos de ejemplo')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar con mis datos' }).click();
  const hoja = page.getByRole('dialog');
  await expect(hoja.getByRole('heading', { name: 'Empecemos con lo tuyo' })).toBeVisible();
  await hoja.locator('#e-cs0').fill('650');
  await hoja.locator('#e-cs1').fill('3550');
  await hoja.getByLabel('Monto al mes').fill('8000');
  await hoja.locator('#e-gm0').fill('2500');
  await sinScrollHorizontal(page);
  await hoja.getByRole('button', { name: 'Ver mi rumbo' }).click();
  await expect(page.locator('.toast')).toHaveText('Listo. Anota tus gastos con el botón +');
  await expect(page.getByText('Datos de ejemplo')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Hoy' })).toBeVisible();
  await expect.poll(async () => (await persona.leer()).cols.cuentas?.map((c) => [c.nombre, c.saldoInicial]).sort()).toEqual([['Banco', 355000], ['Efectivo', 65000]]);
  const d = await persona.leer();
  expect(d.main?.aj).toMatchObject({ empezado: true });
  expect(d.cols.fijos?.map((f) => [f.nombre, f.monto, f.dia]).sort()).toEqual([['Renta', 250000, 5], ['Sueldo', 800000, 25]]);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Hoy' })).toBeVisible();
  await expect(page.getByText('Datos de ejemplo')).toHaveCount(0);
});

test('descargar un respaldo y cargarlo de vuelta después de borrar todo', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await abrir(page, '/');
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await sinScrollHorizontal(page);
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descargar respaldo' }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/^rumbo-respaldo-\d{4}-\d{2}-\d{2}\.json$/);
  const archivo = await descarga.path();
  const respaldo = JSON.parse(await readFile(archivo, 'utf8'));
  expect(respaldo).toMatchObject({ app: 'rumbo', version: 2 });
  expect(respaldo.datos.cuentas.map((c: { saldoInicial: number }) => c.saldoInicial).sort()).toEqual([120000, 355000, 65000]);

  await page.getByRole('button', { name: 'Borrar todo' }).click();
  await page.getByRole('button', { name: 'Toca otra vez para borrar todo' }).click();
  await expect(page.locator('.toast')).toHaveText('Tus datos se borraron');
  await expect(page.getByText('Datos de ejemplo')).toBeVisible();
  await expect.poll(async () => (await persona.leer()).main).toBeNull();

  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.locator('#cargarArchivo').setInputFiles(archivo);
  const bloque = page.getByRole('region', { name: 'Cargar respaldo' });
  await expect(bloque).toContainText('Trae 3 cuentas, 2 movimientos, 2 fijos, 0 deudas y 0 metas');
  await bloque.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.toast')).toHaveText('Respaldo cargado');
  await expect.poll(async () => (await persona.movs()).length).toBe(2);
  const d = await persona.leer();
  expect(d.cols.cuentas?.map((c) => c.saldoInicial).sort()).toEqual([120000, 355000, 65000]);
});

test('cargar un respaldo de la v1: se pasa a centavos y se ve igual', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await abrir(page, '/');
  await page.getByRole('button', { name: 'Ajustes' }).click();
  const v1 = {
    app: 'rumbo', version: 1, fecha: '2026-11-01',
    datos: {
      aj: { tc: 12.5, tcFecha: '2026-11-01', inflacion: 8, irregular: 0, horas: 160, empezado: true },
      cuentas: [{ id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550.5, rendimiento: 0, diaADia: true, archivada: false }],
      categorias: [{ id: 'comida', nombre: 'Comida fuera', tipo: 'gasto', tope: 0, color: '#E0703A', icono: 'comida' }],
      movs: [{ id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35, fecha: '2026-11-02', nota: 'Almuerzo' }],
      fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [],
    },
  };
  await page.locator('#cargarArchivo').setInputFiles({ name: 'v1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(v1)) });
  await page.getByRole('region', { name: 'Cargar respaldo' }).getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.locator('.toast')).toHaveText('Respaldo cargado');
  await expect.poll(async () => (await persona.leer()).cols.cuentas?.[0]?.saldoInicial).toBe(355050);
  expect((await persona.movs())[0]).toMatchObject({ monto: 3500 });
  await page.getByRole('link', { name: 'Plan' }).click();
  await expect(page.getByText('Bs 3.515,50')).toBeVisible();

  // One with an amount of 3 decimals loads nothing and says which one
  await page.getByRole('button', { name: 'Ajustes' }).click();
  v1.datos.movs[0]!.monto = 12.555;
  await page.locator('#cargarArchivo').setInputFiles({ name: 'v1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(v1)) });
  await expect(page.locator('.alert.r')).toHaveText('No se cargó nada: en este respaldo, el movimiento «Almuerzo» del 2 nov tiene un monto con más de 2 decimales.');
  expect((await persona.movs())[0]).toMatchObject({ monto: 3500 });
});

test('el color principal se guarda y se ve igual al volver a abrir', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await abrir(page, '/');
  await page.getByRole('button', { name: 'Ajustes' }).click();
  await page.getByRole('button', { name: 'Morado' }).click();
  await expect.poll(async () => (await persona.leer()).main?.aj.color).toBe('morado');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Hoy' })).toBeVisible();
  const azul = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--azul').trim());
  expect(['#6A3FCF', '#7550DA']).toContain(azul);
});

test('PAN-10: la página trae el manifest y los íconos para instalarla', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await abrir(page, '/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('crossorigin', 'use-credentials');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/iconos/icono-180.png');
  const m = await page.request.get('/manifest.webmanifest', { headers: { 'cf-access-jwt-assertion': persona.token } });
  expect(m.headers()['content-type']).toContain('application/manifest+json');
  expect(await m.json()).toMatchObject({ name: 'Rumbo', display: 'standalone' });
  for (const n of ['180', '192', '512']) {
    const r = await page.request.get(`/iconos/icono-${n}.png`);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toBe('image/png');
  }
});
