// PAN-02, PAN-04, DAT-01, FIJ-02: the Rumbo screen at 375 px in the phone's theme, and confirming and skipping a fixed item.
import { datosDePrueba, expect, hoy, sinScrollHorizontal, test } from './persona';

test('sin datos guardados se ve el ejemplo, sin scroll horizontal y en el tema del teléfono', async ({ page, persona }, info) => {
  await page.goto('/');
  await expect(page.getByText('Datos de ejemplo')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A este ritmo');
  await expect(page.getByRole('region', { name: 'Hoy' })).toContainText('Libre');
  await expect(page.getByRole('region', { name: 'Por confirmar' })).toContainText('Luz');
  await sinScrollHorizontal(page);
  const oscuro = info.project.use.colorScheme === 'dark';
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(oscuro ? 'rgb(14, 20, 17)' : 'rgb(237, 240, 234)');
  expect(await persona.leer()).toMatchObject({ main: null }); // the example is never saved
});

test('confirmar un fijo con otro monto y saltar otro', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await page.goto('/');
  const pc = page.getByRole('region', { name: 'Por confirmar' });
  await expect(pc).toContainText('Por confirmar · 2');
  await expect(pc).toContainText('vence hoy');
  await sinScrollHorizontal(page);
  const mes = hoy().slice(0, 7);
  await page.locator(`#pc-luz_${mes}`).fill('185,50');
  await page.locator(`#pc-luz_${mes}`).locator('xpath=../..').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.locator('.toast')).toHaveText('Luz confirmado');
  await pc.getByRole('button', { name: 'No este mes' }).click();
  await expect(page.locator('.toast')).toHaveText('Saltado este mes');
  await expect(pc).toHaveCount(0);
  await expect.poll(async () => (await persona.leer()).cols.ocurrencias?.map((o) => [o.id, o.estado]).sort())
    .toEqual([[`internet_${mes}`, 'saltado'], [`luz_${mes}`, 'confirmado']]);
  expect((await persona.movs()).find((m) => m.id === `m_luz_${mes}`)).toMatchObject({ tipo: 'gasto', monto: 18550, cuentaId: 'bn', categoriaId: 'casa', fijoId: 'luz' });
});

test('la API responde solo a quien Access dejó entrar', async ({ request }) => {
  expect((await request.get('/api/v2/datos')).status()).toBe(401);
  expect((await request.get('/api/datos')).status()).toBe(401);
});
