// MOV-01, MOV-03, MOV-04, MOV-07, FMT-02, FMT-03, DAT-07: anotar and edit, transfer between currencies, one category,
// no signal and an expired session. Every check reads what reached the server.
import { abrirAnotar, datosDePrueba, expect, sinScrollHorizontal, test } from './persona';

test.beforeEach(async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Hoy' })).toBeVisible();
});

test('anotar y editar un gasto', async ({ page, persona }) => {
  const hoja = await abrirAnotar(page);
  await expect(hoja.getByRole('heading', { name: 'Anotar' })).toBeVisible();
  await sinScrollHorizontal(page);
  await hoja.locator('#m-monto').fill('0,125');
  await hoja.getByRole('button', { name: 'Efectivo · Bs 615,00' }).click(); // FMT-02: 650 − 35, with 2 decimals on the pill
  await hoja.getByRole('button', { name: 'Comida fuera' }).click();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Usa hasta 2 decimales');
  await hoja.locator('#m-monto').fill('35');
  await hoja.getByRole('button', { name: 'Almuerzo' }).click(); // MOV-02: a suggested note
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Gasto anotado');
  await expect.poll(async () => (await persona.movs()).filter((m) => m.nota === 'Almuerzo').length).toBe(2);
  const nuevo = (await persona.movs()).find((m) => m.nota === 'Almuerzo' && m.id !== 'almuerzo')!;
  expect(nuevo).toMatchObject({ tipo: 'gasto', monto: 3500, cuentaId: 'ef', categoriaId: 'comida' });

  await page.getByRole('link', { name: 'Movimientos' }).click();
  await page.getByRole('button', { name: /Almuerzo.*−Bs 35,00/ }).first().click();
  await expect(hoja.getByRole('heading', { name: 'Editar movimiento' })).toBeVisible();
  await hoja.locator('#m-monto').fill('40,50');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Guardado');
  await expect.poll(async () => (await persona.movs()).find((m) => m.id === nuevo.id)?.monto).toBe(4050);
  await expect(page.getByRole('button', { name: /Almuerzo.*−Bs 40,50/ })).toBeVisible();
});

test('transferir entre monedas: de Banco a Dólares, y usar ese cambio como tipo de cambio', async ({ page, persona }) => {
  const hoja = await abrirAnotar(page);
  await hoja.getByRole('button', { name: 'Transferencia' }).click();
  await hoja.getByRole('button', { name: 'Banco · Bs 3.229,50' }).first().click();
  await hoja.locator('#m-monto').fill('1.250');
  await hoja.getByRole('button', { name: 'Dólares · US$ 1.200,00' }).last().click(); // the one under «Hacia»
  await hoja.locator('#m-dest').fill('100');
  await expect(hoja).toContainText('Este cambio fue a Bs 12,50 por dólar.');
  await hoja.locator('#m-monto').fill('1.300');
  await hoja.getByLabel('Usar Bs 13,00 como mi tipo de cambio').check(); // CTA-06: the movement keeps the new rate
  await sinScrollHorizontal(page);
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Transferencia anotada');
  await expect.poll(async () => (await persona.movs()).find((m) => m.tipo === 'transferencia'))
    .toMatchObject({ cuentaId: 'bn', cuentaDestinoId: 'us', monto: 130000, montoDestino: 10000, tc: 13 });
  await expect.poll(async () => (await persona.leer()).main?.aj.tc).toBe(13); // the settings go right after the movement
  await page.getByRole('link', { name: 'Movimientos' }).click();
  await expect(page.getByRole('button', { name: /Banco → Dólares · a Bs 13,00.*−Bs 1.300,00.*\+US\$ 100,00/ })).toBeVisible();
});

test('elegir y quitar una categoría en Movimientos', async ({ page }) => {
  await page.getByRole('link', { name: 'Movimientos' }).click();
  await expect(page.getByRole('button', { name: /Súper de la semana/ })).toBeVisible();
  await page.getByRole('button', { name: 'Categoría: Todas ▾' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Comida fuera' }).click();
  await expect(page.getByText(/1 movimiento en /)).toBeVisible();
  await expect(page.locator('.card')).toContainText('−Bs 35,00');
  await expect(page.getByRole('button', { name: /Súper de la semana/ })).toHaveCount(0);
  await sinScrollHorizontal(page);
  await page.getByRole('button', { name: 'Quitar el filtro Comida fuera' }).click();
  await expect(page.getByRole('button', { name: /Súper de la semana/ })).toBeVisible();
});

test('sin señal: anota y borra, avisa, y al volver la señal guarda en orden', async ({ page, context, persona }) => {
  const orden: string[] = [];
  page.on('requestfinished', (r) => { if (r.url().includes('/api/v2/docs/movs/')) orden.push(r.method()); });
  await context.setOffline(true);
  const hoja = await abrirAnotar(page);
  await hoja.locator('#m-monto').fill('20');
  await hoja.locator('#m-nota').fill('Sin señal');
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();
  await page.getByRole('link', { name: 'Movimientos' }).click();
  await page.getByRole('button', { name: /Sin señal/ }).click();
  await hoja.getByRole('button', { name: 'Borrar' }).click();
  await hoja.getByRole('button', { name: 'Toca otra vez para borrar' }).click();
  await expect(page.locator('.toast')).toHaveText('Movimiento borrado');
  await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await expect(page.getByText('Hay cambios sin guardar.')).toHaveCount(0, { timeout: 10000 });
  expect(orden).toEqual(['PUT', 'DELETE']);
  expect((await persona.movs()).some((m) => m.nota === 'Sin señal')).toBe(false);
});

test('sesión vencida: pide entrar en otra pestaña y guarda al volver', async ({ page, persona }) => {
  await page.route('**/api/v2/docs/**', (r) => r.fulfill({ status: 401, body: '{"error":"sin-sesion"}' }));
  const hoja = await abrirAnotar(page);
  await hoja.getByRole('button', { name: 'Ingreso' }).click();
  await hoja.locator('#m-monto').fill('500');
  await hoja.getByRole('button', { name: 'Negocio' }).click();
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Tu sesión venció.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vuelve a entrar en otra pestaña' })).toBeVisible();
  expect((await persona.movs()).some((m) => m.tipo === 'ingreso')).toBe(false);
  await page.unroute('**/api/v2/docs/**');
  await page.evaluate(() => dispatchEvent(new Event('focus')));
  await expect(page.getByText('Tu sesión venció.')).toHaveCount(0);
  await expect.poll(async () => (await persona.movs()).find((m) => m.tipo === 'ingreso'))
    .toMatchObject({ monto: 50000, categoriaId: 'negocio' });
});
