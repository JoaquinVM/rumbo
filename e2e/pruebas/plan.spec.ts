// DES-05, PAN-03, PAN-07, PAN-08, PAN-09, DEU-02, FIJ-06, MET-02, FMT-02: the Desglose to a category's movements, Plan,
// paying a loan's installment and setting money aside for a goal. Every check reads what reached the server.
import { datosDePrueba, expect, hoy, sinScrollHorizontal, test, type Datos } from './persona';

// The test person plus a loan of Bs 18.400 at 14 % whose installment is due today, and a goal.
function conPrestamoYMeta(): Datos {
  const d = datosDePrueba(), h = hoy(), mes = h.slice(0, 7), dia = Number(h.slice(8));
  d.cols.deudas = [{ id: 'banco', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia, desde: `${mes}-01`, archivada: false }];
  d.cols.fijos = [...d.cols.fijos!, { id: 'cuota', nombre: 'Cuota del préstamo', tipo: 'gasto', monto: 90000, cuentaId: 'bn', categoriaId: 'casa', dia, deudaId: 'banco', desde: mes, activo: true }];
  d.cols.metas = [{ id: 'fondo', nombre: 'Fondo de emergencia', monto: 1500000, mes: `${Number(mes.slice(0, 4)) + 1}-12`, archivada: false }];
  return d;
}

test('el Desglose lleva de una categoría a sus movimientos con el mismo total', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await page.goto('/#movimientos');
  await page.getByRole('group', { name: 'Filtrar por cuenta' }).getByRole('button', { name: 'Efectivo' }).click();
  await page.getByRole('link', { name: 'Desglose' }).click();
  const resumen = page.getByRole('region', { name: 'Resumen del mes' });
  await expect(resumen).toContainText('Bs 356'); // 35 + 320,50
  await sinScrollHorizontal(page);
  await page.getByRole('button', { name: /Súper.*Bs 321/ }).click();
  await expect(page).toHaveURL(/#movimientos$/);
  await expect(page.getByRole('button', { name: 'Quitar el filtro Súper' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Filtrar por cuenta' }).getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.card').filter({ hasText: 'Súper' })).toContainText('−Bs 320,50');
});

test('Plan: patrimonio, cuentas con dos decimales y cuadrar', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await page.goto('/#plan');
  await expect(page.getByRole('region', { name: 'Patrimonio' })).toContainText('Bs 18.845'); // 615 + 3.229,50 + 15.000
  await expect(page.getByText('Bs 3.229,50')).toBeVisible();
  await expect(page.getByText('US$ 1.200,00')).toBeVisible();
  await sinScrollHorizontal(page);
  await page.locator('.row').filter({ hasText: 'Efectivo' }).getByRole('button', { name: 'Cuadrar' }).click();
  const hoja = page.getByRole('dialog');
  await hoja.getByLabel('Saldo real').fill('600');
  await hoja.getByRole('button', { name: 'Cuadrar' }).click();
  await expect(page.locator('.toast')).toHaveText('Ajuste de −Bs 15,00 registrado');
  await expect.poll(async () => (await persona.movs()).find((m) => m.tipo === 'ajuste')).toMatchObject({ cuentaId: 'ef', monto: 1500, sentido: -1 });
});

test('pagar la cuota de un préstamo desde su detalle', async ({ page, persona }) => {
  await persona.cargar(conPrestamoYMeta());
  await page.goto('/#plan');
  await page.getByRole('button', { name: /Préstamo del banco/ }).click();
  await expect(page.getByRole('region', { name: 'Por pagar' })).toContainText('Bs 18.400');
  await expect(page.getByRole('region', { name: 'Próximas cuotas' })).toContainText('214,67');
  await sinScrollHorizontal(page);
  await page.getByRole('button', { name: 'Registrar un pago' }).click();
  const hoja = page.getByRole('dialog');
  await expect(hoja.getByRole('heading', { name: 'Pagar Préstamo del banco' })).toBeVisible();
  await expect(hoja.locator('#p-split')).toHaveText('Interés Bs 214,67 (gasto) · capital Bs 685,33 (baja la deuda)');
  await expect(hoja.getByRole('button', { name: 'Banco · Bs 3.229,50' })).toHaveAttribute('aria-pressed', 'true');
  await sinScrollHorizontal(page);
  await hoja.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Guardado');
  await expect(page.getByRole('region', { name: 'Por pagar' })).toContainText('Bs 17.715');
  const mes = hoy().slice(0, 7);
  await expect.poll(async () => (await persona.leer()).cols.ocurrencias?.map((o) => [o.id, o.estado])).toEqual([[`cuota_${mes}`, 'confirmado']]);
  expect((await persona.movs()).find((m) => m.tipo === 'pago')).toMatchObject({ deudaId: 'banco', cuentaId: 'bn', monto: 90000, interes: 21467, capital: 68533, fijoId: 'cuota', mes });
});

test('apartar para una meta y desapartar', async ({ page, persona }) => {
  await persona.cargar(conPrestamoYMeta());
  await page.goto('/#plan');
  await page.getByRole('button', { name: /Fondo de emergencia/ }).click();
  await expect(page.getByRole('region', { name: 'Llevas' })).toContainText('Bs 0');
  await sinScrollHorizontal(page);
  const ap = page.getByRole('region', { name: 'Apartar' });
  await ap.getByRole('button', { name: /^Banco · / }).click();
  await ap.getByLabel('Monto').fill('300');
  await ap.getByRole('button', { name: 'Apartar', exact: true }).click();
  await expect(page.locator('.toast')).toHaveText('Apartado');
  await expect(page.getByRole('region', { name: 'Llevas' })).toContainText('Bs 300');
  await ap.getByLabel('Monto').fill('500');
  await ap.getByRole('button', { name: 'Desapartar' }).click();
  await expect(page.locator('.toast')).toHaveText('En Banco esta meta tiene Bs 300,00 apartados');
  await expect.poll(async () => (await persona.leer()).cols.apartados).toMatchObject([{ metaId: 'fondo', cuentaId: 'bn', monto: 30000 }]);
});

test('un tope nuevo desde Categorías y topes', async ({ page, persona }) => {
  await persona.cargar(datosDePrueba());
  await page.goto('/#plan');
  await page.getByRole('button', { name: /6 categorías · 0 con tope/ }).click();
  await page.getByRole('button', { name: /Súper/ }).click();
  await page.getByRole('dialog').getByLabel('Tope mensual (vacío = sin tope)').fill('1.400');
  await sinScrollHorizontal(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Tope Bs 1.400 al mes')).toBeVisible();
  await expect.poll(async () => (await persona.leer()).cols.categorias?.find((k) => k.id === 'super')?.tope).toBe(140000);
});
