// Ensayo de punta a punta de Rumbo v1 en modo navegador (localStorage), a 375 px.
// Ensayo opcional en un navegador real (no corre en CI). Uso:
//   PLAYWRIGHT=<ruta a playwright-core> CHROME=<ruta a Chrome> node pruebas/ensayo.cjs index.html <carpeta-capturas>
const path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT || 'playwright-core');
const FILE = 'file://' + path.resolve(process.argv[2] || 'index.html');
const OUT = process.argv[3] || require('os').tmpdir();
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
  const page = await browser.newPage({viewport: {width: 375, height: 812}});
  const errores = [];
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errores.push('console: ' + m.text()); });
  await page.goto(FILE + '#rumbo'); await page.waitForTimeout(400);
  const texto = async () => page.locator('#view').innerText();
  const sinScroll = async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const paso = async (n, fn) => { try { await fn(); log('ok -', n); } catch (e) { log('FALLA -', n, e.message.split('\n')[0]); errores.push(n); } };
  const expect = (c, msg) => { if (!c) throw new Error(msg); };

  await paso('DAT-01 ejemplo visible y nada guardado', async () => {
    expect((await page.locator('#banner').innerText()).includes('Esto es un ejemplo'), 'sin banner');
    expect(await page.evaluate(() => localStorage.getItem('rumbo-v2')) === null, 'guardó algo');
  });
  for (const v of ['rumbo', 'movimientos', 'desglose', 'plan']) await paso(`PAN-04 ${v} sin scroll horizontal`, async () => { await page.goto(FILE + '#' + v); await page.waitForTimeout(250); expect(await sinScroll(), 'scroll horizontal'); });

  await paso('DAT-02 empezar con mis datos', async () => {
    await page.goto(FILE + '#rumbo'); await page.waitForTimeout(300);
    await page.click('[data-act="empezar"]');
    await page.fill('#e-cs0', '650'); await page.fill('#e-cs1', '3.550');
    await page.fill('#e-im', '8.000'); await page.fill('#e-id', '25'); await page.fill('#e-ic', '2'); await page.fill('#e-irr', '1500');
    await page.fill('#e-gm0', '2500'); await page.fill('#e-gd0', '5');
    await page.fill('#e-gn1', 'Luz'); await page.fill('#e-gd1', '8'); await page.fill('#e-gm1', '180');
    await page.click('#fE button[type="submit"]'); await page.waitForTimeout(400);
    const t = await texto(); expect(!/Esto es un ejemplo/.test(await page.locator('#banner').innerText()), 'sigue en ejemplo');
    expect(/Hoy/.test(t), 'sin bloque Hoy');
    await page.goto(FILE + '#plan'); await page.waitForTimeout(250);
    const p = await texto(); expect(p.includes('Bs 4.200'), 'patrimonio 4.200 no aparece: ' + p.slice(0, 200));
  });

  await paso('MOV-01/02 anotar un gasto en efectivo', async () => {
    await page.click('.fab'); await page.waitForTimeout(200);
    await page.fill('#m-monto', '35'); await page.click('[data-cuenta]:has-text("Efectivo")');
    await page.click('[data-cat="comida"]'); await page.fill('#m-nota', 'Almuerzo');
    await page.click('#fMov button[type="submit"]'); await page.waitForTimeout(300);
    await page.goto(FILE + '#plan'); await page.waitForTimeout(250);
    expect((await texto()).includes('Bs 615'), 'efectivo no bajó a 615');
    await page.click('.fab'); await page.waitForTimeout(200);
    const sug = await page.locator('#fMov').innerText(); expect(sug.includes('Almuerzo'), 'sin nota sugerida');
    expect(await page.locator('[data-cuenta][aria-pressed="true"]').innerText().then(s => s.includes('Efectivo')), 'no recordó la cuenta');
    await page.click('[data-close]');
  });

  await paso('CTA-01 crear cuenta en dólares', async () => {
    await page.click('[data-act="nuevaCuenta"]'); await page.fill('#c-n', 'Dólares'); await page.click('[data-mon="USD"]'); await page.fill('#c-s', '1.200');
    await page.click('#fC button[type="submit"]'); await page.waitForTimeout(250);
    expect((await texto()).includes('US$ 1.200'), 'sin cuenta en dólares');
  });

  await paso('MOV-03 y CTA-06 transferir Bs a dólares y usar el tipo', async () => {
    await page.click('.fab'); await page.click('[data-tipo="transferencia"]');
    await page.click('[data-desde]:has-text("Banco")'); await page.click('[data-hacia]:has-text("Dólares")');
    await page.fill('#m-monto', '1250'); await page.fill('#m-dest', '100'); await page.waitForTimeout(100);
    expect((await page.locator('#m-tc').innerText()).includes('12,50'), 'no calcula el tipo');
    await page.check('#m-usartc'); await page.click('#fMov button[type="submit"]'); await page.waitForTimeout(300);
    const t = await texto(); expect(t.includes('US$ 1.300'), 'dólares no subió'); expect(t.includes('Bs 2.300'), 'banco no bajó');
  });

  await paso('CTA-03 cuadrar efectivo', async () => {
    await page.click('[data-act="cuadrar"] >> nth=0'); await page.fill('#q-s', '600'); await page.click('#fQ button[type="submit"]'); await page.waitForTimeout(250);
    expect((await texto()).includes('Bs 600'), 'no cuadró');
    await page.goto(FILE + '#movimientos'); await page.waitForTimeout(250); expect((await texto()).includes('Ajuste'), 'sin ajuste visible');
  });

  await paso('FIJ-02 confirmar la luz con otro monto', async () => {
    await page.goto(FILE + '#rumbo'); await page.waitForTimeout(250);
    const t = await texto();
    if (!/por confirmar/i.test(t)) { log('   (hoy no hay fijos vencidos; se omite)'); return; }
    const n0 = await page.locator('[data-act="confirmarFijo"]').count(); expect(n0 === 2, 'esperaba 2 pendientes (renta y luz), hay ' + n0);
    await page.locator('.blk.a input.inp').last().fill('195'); await page.locator('[data-act="confirmarFijo"]').last().click(); await page.waitForTimeout(250);
    await page.locator('[data-act="saltarFijo"]').first().click(); await page.waitForTimeout(250);
    expect(!/por confirmar/i.test(await texto()), 'sigue pendiente');
    await page.goto(FILE + '#movimientos'); await page.waitForTimeout(250); const mv = await texto(); expect(mv.includes('Bs 195,00') && mv.includes('Fijo'), 'sin movimiento de 195');
  });

  await paso('DEU-01/02 crear préstamo con fijo y registrar un pago', async () => {
    await page.goto(FILE + '#plan'); await page.waitForTimeout(250);
    await page.click('[data-act="nuevaDeuda"]'); await page.fill('#d-n', 'Préstamo del banco'); await page.fill('#d-s', '18.400');
    await page.fill('#d-i', '14'); await page.fill('#d-dia', '20'); await page.fill('#d-c', '900');
    await page.click('#fD button[type="submit"]'); await page.waitForTimeout(250);
    const t = await texto(); expect(t.includes('Bs 18.400'), 'sin préstamo'); expect(/Cuota · Préstamo del banco/.test(t), 'sin fijo de cuota');
    await page.click('[data-act="verDeuda"]'); await page.waitForTimeout(200);
    const d = await texto(); expect(d.includes('214,67') && d.includes('685,33') && d.includes('17.714,67'), 'cuotas mal: ' + d.slice(0, 300));
    await page.fill('#adel', '300'); await page.dispatchEvent('#adel', 'input'); await page.waitForTimeout(150);
    await page.locator('#adel').evaluate(e => { e.value = 300; e.dispatchEvent(new Event('input', {bubbles: true})); }); await page.waitForTimeout(150);
    expect((await page.locator('#adelRes').innerText()).includes('7 meses antes'), 'adelanto mal: ' + await page.locator('#adelRes').innerText());
    await page.click('[data-act="pagoDeuda"][data-tipo="pago"]'); await page.waitForTimeout(150);
    expect((await page.locator('#p-split').innerText()).includes('214,67'), 'split mal');
    await page.click('#fP button[type="submit"]'); await page.waitForTimeout(250);
    expect((await texto()).includes('17.714,67') || (await texto()).includes('17.715'), 'saldo no bajó');
    await page.click('[data-act="volver"]');
  });

  const datos = () => page.evaluate(() => JSON.parse(localStorage.getItem('rumbo-v2')));
  await paso('FIJ-06 pagar la cuota a mano la confirma', async () => {
    const D = await datos(); const pago = D.movs.find(m => m.tipo === 'pago');
    expect(pago && pago.fijoId, 'el pago no quedó como cuota');
    expect(D.ocurrencias.some(o => o.movId === pago.id && o.estado === 'confirmado'), 'la cuota sigue por confirmar');
  });

  await paso('FIJ-07 préstamo nuevo con el día pasado empieza el mes siguiente', async () => {
    await page.goto(FILE + '#plan'); await page.waitForTimeout(250);
    await page.click('[data-act="nuevaDeuda"]'); await page.fill('#d-n', 'Moto'); await page.fill('#d-s', '3000');
    await page.fill('#d-i', '10'); await page.fill('#d-dia', '1'); await page.fill('#d-c', '300');
    expect((await page.locator('#d-body').innerText()).includes('La primera cuota que te pregunta es la de'), 'sin aviso de primera cuota');
    await page.click('#fD button[type="submit"]'); await page.waitForTimeout(250);
    const D = await datos(); const f = D.fijos.find(x => x.nombre === 'Cuota · Moto'); const h = new Date();
    const sig = new Date(h.getFullYear(), h.getMonth() + 1, 1); const ym = `${sig.getFullYear()}-${String(sig.getMonth() + 1).padStart(2, '0')}`;
    expect(f && (h.getDate() > 1 ? f.desde === ym : true), 'desde mal: ' + (f && f.desde));
  });

  await paso('DEU-06/07/10 deuda en dólares: solo cuentas en dólares, entra el dinero y no se paga de más', async () => {
    await page.click('[data-act="nuevaDeuda"]'); await page.click('[data-dt="persona"]'); await page.fill('#d-n', 'Ana'); await page.click('[data-dm="USD"]');
    const chips = await page.locator('#d-body [data-dpc]:not([data-dpc=""])').allInnerTexts();
    expect(chips.length === 1 && chips[0].includes('Dólares'), 'ofrece cuentas de otra moneda: ' + chips.join('|'));
    await page.click('#d-body [data-dpc]:not([data-dpc=""])'); await page.fill('#d-s', '100');
    await page.click('#fD button[type="submit"]'); await page.waitForTimeout(250);
    const D = await datos(); const ana = D.deudas.find(d => d.nombre === 'Ana'); const us = D.cuentas.find(c => c.moneda === 'USD');
    const r = D.movs.find(m => m.tipo === 'recibido' && m.deudaId === ana.id); expect(r && r.cuentaId === us.id && r.monto === 100, 'no entró a Dólares');
    await page.click(`[data-act="verDeuda"][data-id="${ana.id}"]`); await page.waitForTimeout(200);
    await page.click('[data-act="pagoDeuda"][data-tipo="pago"]'); await page.waitForTimeout(150);
    const cs = await page.locator('#p-cs [data-pc]').allInnerTexts(); expect(cs.length === 1 && cs[0].includes('Dólares'), 'paga desde otra moneda');
    await page.fill('#p-m', '150'); await page.click('#fP button[type="submit"]'); await page.waitForTimeout(200);
    expect((await page.locator('.toast').last().innerText()).includes('El máximo es'), 'dejó pagar de más');
    await page.click('[data-close]'); await page.click('[data-act="volver"]');
  });

  await paso('CTA-08 no archiva una cuenta con saldo', async () => {
    await page.goto(FILE + '#plan'); await page.waitForTimeout(250);
    await page.click('[data-act="editCuenta"]:has-text("Efectivo")'); await page.click('#c-arch'); await page.waitForTimeout(200);
    expect((await page.locator('.toast').last().innerText()).includes('antes de archivarla'), 'archivó con saldo');
    const D = await datos(); expect(!D.cuentas.find(c => c.nombre === 'Efectivo').archivada, 'quedó archivada'); await page.click('[data-close]');
  });

  await paso('MET-01/02 crear meta y apartar con tope del saldo', async () => {
    await page.click('[data-act="nuevaMeta"]'); await page.fill('#mt-n', 'Fondo de emergencia'); await page.fill('#mt-m', '15.000');
    await page.click('#fM button[type="submit"]'); await page.waitForTimeout(250);
    await page.click('[data-act="verMeta"]'); await page.waitForTimeout(200);
    await page.click('[data-act="metaCuenta"]:has-text("Banco")'); await page.fill('#ap-monto', '90000');
    await page.click('[data-act="apartar"][data-signo="1"]'); await page.waitForTimeout(200);
    expect((await page.locator('.toast').last().innerText()).includes('puedes apartar hasta'), 'dejó apartar más que el saldo');
    await page.fill('#ap-monto', '100'); await page.click('[data-act="apartar"][data-signo="1"]'); await page.waitForTimeout(200);
    const tx = await texto(); expect(tx.includes('Bs 100'), 'no apartó: ' + (await page.locator('.toast').allInnerTexts()).join('|') + ' :: ' + tx.slice(0, 300).replace(/\n/g,' / '));
    await page.click('[data-act="volver"]');
  });

  await paso('LIM-01/03 tope a comida fuera y aviso al anotar', async () => {
    await page.click('[data-act="verCategorias"]'); await page.click('[data-act="editCat"][data-id="comida"]');
    await page.fill('#k-t', '100'); await page.click('#fK button[type="submit"]'); await page.waitForTimeout(200);
    await page.click('[data-act="volver"]');
    await page.click('.fab'); await page.click('[data-cat="comida"]'); await page.fill('#m-monto', '50'); await page.waitForTimeout(100);
    expect((await page.locator('#m-tope').innerText()).includes('85 %'), 'sin aviso de tope: ' + await page.locator('#m-tope').innerText());
    await page.click('#fMov button[type="submit"]'); await page.waitForTimeout(250);
    await page.goto(FILE + '#rumbo'); await page.waitForTimeout(250);
    expect((await texto()).includes('Comida fuera: llevas'), 'sin aviso en Rumbo');
  });

  await paso('AJU tipo de cambio, inflación e irregular', async () => {
    await page.click('[data-act="ajustes"]'); await page.fill('#a-inf', '10'); await page.click('#fAjustes button[type="submit"]'); await page.waitForTimeout(200);
    await page.click('[data-act="volver"]'); await page.goto(FILE + '#rumbo'); await page.waitForTimeout(250); expect((await texto()).includes('10 % de inflación'), 'no tomó la inflación');
  });

  await paso('DAT-03 todo sobrevive a recargar', async () => {
    await page.reload(); await page.waitForTimeout(400); await page.goto(FILE + '#plan'); await page.waitForTimeout(300);
    const t = await texto(); expect(t.includes('Fondo de emergencia') && t.includes('Préstamo del banco') && t.includes('Dólares'), 'se perdió algo');
  });

  await paso('DAT-04 archivo ajeno no cambia nada', async () => {
    await page.click('[data-act="ajustes"]');
    await page.setInputFiles('#cargarArchivo', {name: 'otro.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"otra"}')}); await page.waitForTimeout(250);
    expect((await texto()).includes('no es un respaldo de Rumbo'), 'no avisó'); await page.click('[data-act="volver"]');
  });

  for (const v of ['rumbo', 'movimientos', 'desglose', 'plan']) {
    await page.goto(FILE + '#' + v); await page.waitForTimeout(250);
    await paso(`PAN-04 ${v} con datos sin scroll horizontal`, async () => expect(await sinScroll(), 'scroll'));
    await page.screenshot({path: path.join(OUT, `real-${v}.png`), fullPage: true});
  }
  log(errores.length ? '\nERRORES:\n' + errores.join('\n') : '\nSin errores de JavaScript');
  await browser.close();
})();
