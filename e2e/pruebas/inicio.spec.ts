// PUB-06 on the empty v2 page: it opens at 375 px without horizontal scroll, follows the light or dark theme, and
// the save API answers only through (fake) Access.
import { expect, test } from '@playwright/test';

const TOKEN = 'token-de-prueba-e2e'; // same as servidor-prueba.mjs

test('la página abre a 375 px sin scroll horizontal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Rumbo' })).toBeVisible();
  const ancho = await page.evaluate(() => ({ pagina: document.documentElement.scrollWidth, ventana: window.innerWidth }));
  expect(ancho.ventana).toBe(375);
  expect(ancho.pagina).toBeLessThanOrEqual(ancho.ventana);
});

test('sigue el modo claro u oscuro del teléfono', async ({ page }, info) => {
  await page.goto('/');
  const oscuro = info.project.use.colorScheme === 'dark';
  const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fondo).toBe(oscuro ? 'rgb(22, 21, 26)' : 'rgb(246, 244, 239)');
});

test('la API responde solo a quien Access dejó entrar', async ({ request }) => {
  expect((await request.get('/api/datos')).status()).toBe(401);
  const r = await request.get('/api/datos', { headers: { 'cf-access-jwt-assertion': TOKEN } });
  expect(r.status()).toBe(200);
  expect(await r.json()).toHaveProperty('cols');
});
