// Compares every money rule of the v1 (the frozen oracle) with Rumbo 2 on one state, with the tolerances of
// design.md («Inventario de reglas de dinero»): «exacto» is the same number to the cent; «≤ 1 c» is at most one cent
// for each rounding the v2 does where the v1 kept decimals (a dollar account, debt, movement or goal). Returns every
// difference it finds; none means Rumbo 2 gives the v1's numbers.
import type * as Dominio from '@rumbo/dominio';
import type { EstadoV1 } from './generador';

type V1 = Record<string, any>;
type Dom = typeof Dominio;

const aC = (bs: number): number => Math.round(bs * 100) + 0;
const ES = 1e-6; // floating point noise of the estimates, in cents

// A month of interest that is exactly half a cent: the v1's decimals may round it either way; FMT-05 rounds it up.
// The generator's rates have at most 1 decimal, so the exact interest is saldo × T ÷ 12000 with T = rate × 10.
const esEmpate = (saldo: number, tasa: number): boolean => {
  const T = Math.round(tasa * 10);
  return Math.abs(tasa * 10 - T) < 1e-9 && (saldo * T) % 12000 === 6000;
};

export function comparar(v1: V1, dom: Dom, hoy: string, S1: EstadoV1): string[] {
  const dif: string[] = [];
  const conv = dom.v1ACentavos(S1 as any);
  if (!conv.ok) return [`no convierte: ${JSON.stringify(conv.problemas)}`];
  const S2 = conv.datos as unknown as Dominio.Estado;
  const h = new Date(`${hoy}T12:00:00`), mes = hoy.slice(0, 7), tc = S1.aj.tc;
  const usd = (moneda: string): number => (moneda === 'USD' ? 1 : 0);
  const exacto = (que: string, a: number, b: number): void => { if (aC(a) !== b) dif.push(`${que}: v1 ${aC(a)} v2 ${b}`); };
  const cerca = (que: string, a: number, b: number, tol: number): void => {
    if (!(Math.abs(a * 100 - b) <= tol + ES)) dif.push(`${que}: v1 ${a * 100} v2 ${b} (tolerancia ${tol})`);
  };
  const estimado = (que: string, a: number, b: number, tol = ES): void => {
    if (!(Math.abs(a * 100 - b) <= tol + Math.abs(b) * 1e-12)) dif.push(`${que}: v1 ${a * 100} v2 ${b} (tolerancia ${tol})`);
  };
  const igual = (que: string, a: unknown, b: unknown): void => {
    if (JSON.stringify(a) !== JSON.stringify(b)) dif.push(`${que}: v1 ${JSON.stringify(a)} v2 ${JSON.stringify(b)}`);
  };
  // The same text, unless the v1 number is within the tolerance of a rounding boundary of what is shown.
  const texto = (que: string, a: number, b: number, tol: number, dec = 0): void => {
    if (v1.money(a, dec) === dom.mostrar(b, dec)) return;
    const paso = dec ? 0.01 : 1, resto = Math.abs(a / paso) % 1;
    if (Math.abs(resto - 0.5) * paso * 100 <= tol + ES) return;
    dif.push(`${que}: v1 «${v1.money(a, dec)}» v2 «${dom.mostrar(b, dec)}»`);
  };

  // CTA-02, CTA-07, DEU, MET-02: balances, exact
  for (const c of S1.cuentas) {
    const c2 = S2.cuentas.find((x) => x.id === c.id)!;
    exacto(`saldo ${c.id}`, v1.saldoCuenta(S1, c), dom.saldoCuenta(S2, c2));
    exacto(`apartado ${c.id}`, v1.apartadoCuenta(S1, c.id), dom.apartadoCuenta(S2, c.id));
  }
  for (const d of S1.deudas) exacto(`saldo ${d.id}`, v1.saldoDeuda(S1, d), dom.saldoDeuda(S2, S2.deudas.find((x) => x.id === d.id)!));

  // CTA-05: ≤ 1 c for each account or debt in dollars
  const p1 = v1.patrimonio(S1), p2 = dom.patrimonio(S2);
  const nCu = S1.cuentas.reduce((t, c) => t + usd(c.moneda), 0);
  const nDe = (tipos: string[]): number => S1.deudas.filter((d) => tipos.includes(d.tipo) && !d.archivada).reduce((t, d) => t + usd(d.moneda), 0);
  cerca('patrimonio cuentas', p1.cuentas, p2.cuentas, nCu);
  cerca('patrimonio te deben', p1.teDeben, p2.teDeben, nDe(['teDeben']));
  cerca('patrimonio deudas', p1.deudas, p2.deudas, nDe(['prestamo', 'persona']));
  const tolPat = nCu + nDe(['teDeben', 'prestamo', 'persona']);
  cerca('patrimonio', p1.total, p2.total, tolPat);
  texto('patrimonio en texto', p1.total, p2.total, tolPat);

  // CTA-04, CTA-06: exact
  igual('días del tipo de cambio', v1.tcDias(S1, h), dom.diasDelTipoDeCambio(S2, hoy));
  igual('último cambio', v1.ultimoCambio(S1), dom.ultimoCambio(S2));

  // FIJ-02, HOY-03: which fixed items are pending and the next income, exact
  const fdm = (l: any[]): string[] => l.map((p) => `${p.fijo.id}_${p.mes ?? ''}_${p.fecha}`);
  igual('por confirmar', fdm(v1.pendientes(S1, h)), fdm(dom.pendientes(S2, hoy)));
  const px1 = v1.proximoIngreso(S1, h), px2 = dom.proximoIngreso(S2, hoy);
  igual('próximo ingreso', px1 && `${px1.fijo.id} ${px1.fecha}`, px2 && `${px2.fijo.id} ${px2.fecha}`);

  // MET-03: ≤ 1 c each
  const metasActivas = S1.metas.filter((m) => !m.archivada);
  for (const m of S1.metas) {
    const a = v1.infoMeta(S1, m, h), b = dom.infoMeta(S2, S2.metas.find((x) => x.id === m.id)!, hoy);
    const enUsd = S1.apartados.some((x) => x.metaId === m.id && S1.cuentas.find((c) => c.id === x.cuentaId)?.moneda === 'USD');
    igual(`meses de ${m.id}`, a.meses, b.meses);
    (enUsd ? cerca : (q: string, x: number, y: number) => exacto(q, x, y))(`apartado de ${m.id}`, a.ap, b.ap, 1);
    cerca(`aporte de ${m.id}`, a.aporte, b.aporte, 1);
    cerca(`este mes de ${m.id}`, a.esteMes, b.esteMes, 1);
    cerca(`falta de ${m.id}`, a.falta, b.falta, 1);
  }

  // HOY-01, HOY-02: ≤ 1 c for each day-to-day account in dollars, fixed item in dollars and goal
  const H1 = v1.calcHoy(S1, h), H2 = dom.calcHoy(S2, hoy);
  const nDisp = S1.cuentas.filter((c) => c.diaADia && !c.archivada).reduce((t, c) => t + usd(c.moneda), 0);
  const nComp = H1.comp.reduce((t: number, p: any) => t + usd(S1.cuentas.find((c) => c.id === p.fijo.cuentaId)?.moneda ?? 'BOB'), 0);
  cerca('disponible', H1.disp, H2.disp, nDisp);
  cerca('fijos por pagar', H1.compBs, H2.compBs, nComp);
  cerca('falta apartar', H1.metas, H2.metas, metasActivas.length);
  const tolLibre = nDisp + nComp + metasActivas.length;
  cerca('libre', H1.libre, H2.libre, tolLibre);
  igual('días', [H1.dias, H1.limite], [H2.dias, H2.limite]);
  igual('fijos de Hoy', fdm(H1.comp), fdm(H2.comp));
  texto('libre en texto', H1.libre, H2.libre, tolLibre);
  texto('al día en texto', H1.alDia, H2.alDia, tolLibre / H1.dias);

  // MOV-06, LIM-03, DES-01, DES-03: each month of movements, ≤ 1 c for each movement in dollars
  const meses = [...new Set([...S1.movs.map((m) => m.fecha.slice(0, 7)), mes])];
  const enDolares = (m: any): number => {
    const mon = m.cuentaId ? S1.cuentas.find((c) => c.id === m.cuentaId)?.moneda : S1.deudas.find((d) => d.id === m.deudaId)?.moneda;
    const dest = m.cuentaDestinoId ? S1.cuentas.find((c) => c.id === m.cuentaDestinoId)?.moneda : undefined;
    return mon === 'USD' || dest === 'USD' ? 1 : 0;
  };
  // movements in dollars that add to what a category spent in a month
  const nCat = (delMes: any[], k: string): number => delMes
    .filter((m) => (m.tipo === 'gasto' && m.categoriaId === k) || (k === 'intereses' && (m.tipo === 'interes' || (m.tipo === 'pago' && m.interes))))
    .reduce((t, m) => t + enDolares(m), 0);
  for (const ym of meses) {
    const delMes = S1.movs.filter((m) => m.fecha.slice(0, 7) === ym);
    const n = (tipos: string[]): number => delMes.filter((m) => tipos.includes(m.tipo)).reduce((t, m) => t + enDolares(m), 0);
    const g1 = v1.gastoMesCat(S1, ym), g2 = dom.gastoMesCat(S2, ym);
    for (const k of new Set([...Object.keys(g1), ...Object.keys(g2)])) cerca(`gastado ${ym} ${k}`, g1[k] ?? 0, g2[k] ?? 0, nCat(delMes, k));
    const r1 = v1.resumenMes(S1, ym), r2 = dom.resumenMes(S2, ym);
    const nGasto = n(['gasto', 'pago', 'interes']), nIng = n(['ingreso']);
    cerca(`entró ${ym}`, r1.entro, r2.entro, nIng);
    cerca(`salió ${ym}`, r1.salio, r2.salio, nGasto);
    cerca(`quedó ${ym}`, r1.quedo, r2.quedo, nGasto + nIng);
    cerca(`capital ${ym}`, r1.capital, r2.capital, n(['pago']));
    cerca(`cuadres ${ym}`, r1.ajustes, r2.ajustes, n(['ajuste']));
    cerca(`cambio de moneda ${ym}`, r1.cambio, r2.cambio, n(['transferencia']));
    cerca(`deudas cerradas ${ym}`, r1.cierres, r2.cierres, n(['cierre']));
    // LIM-03, LIM-04: the same colour, unless the expense is within the tolerance of 80 % or 100 %
    const t1 = v1.avanceTopes(S1, ym), t2 = dom.avanceTopes(S2, ym);
    igual(`topes ${ym}`, t1.map((t: any) => t.cat.id), t2.map((t) => t.cat.id));
    t1.forEach((t: any, i: number) => {
      const b = t2[i]!, tol = nCat(delMes, t.cat.id);
      cerca(`tope ${ym} ${t.cat.id}`, t.gastado, b.gastado, tol);
      const borde = [0.8, 1].some((p) => Math.abs(t.gastado * 100 - p * b.cat.tope!) <= tol + ES);
      if (t.nivel !== b.nivel && !borde) dif.push(`nivel ${ym} ${t.cat.id}: v1 ${t.nivel} v2 ${b.nivel}`);
    });
  }

  // DEU-02, DEU-04, DEU-05, PRO-08: amortization, exact. Each row is checked from the v1's own balance. Where the
  // exact interest is half a cent, the v1's decimals sometimes round it down and FMT-05 rounds it up: that row may
  // differ by a cent and, from there on, the whole table carries that cent (at most Bs 1 in all).
  const amortiza = (que: string, saldo: number, tasa: number, cuota: number, extra: number): void => {
    const a = v1.amortizar(saldo, tasa, cuota, extra), b = dom.amortizar(aC(saldo) as any, tasa, aC(cuota) as any, aC(extra) as any);
    let empates = 0, s = aC(saldo);
    for (const [i, x] of a.filas.entries()) {
      const it = dom.interesDelMes(s as any, tasa), empate = esEmpate(s, tasa);
      if (empate) empates++;
      if (aC(x.interes) !== it && !(empate && aC(x.interes) === it - 1)) dif.push(`${que} fila ${i} interés: v1 ${aC(x.interes)} v2 ${it}`);
      const pago = Math.min(aC(cuota) + aC(extra), s + aC(x.interes));
      if (aC(x.capital) !== pago - aC(x.interes) || aC(x.saldo) !== s - aC(x.capital)) dif.push(`${que} fila ${i}: capital o saldo`);
      s = aC(x.saldo);
    }
    if (!empates) igual(`${que}`, [a.filas.length, a.crece, aC(a.interes)], [b.filas.length, b.crece, b.interes]);
    else if (Math.abs(aC(a.interes) - b.interes) > 100 || a.crece !== b.crece || Math.abs(a.filas.length - b.filas.length) > 1) {
      dif.push(`${que} con ${empates} empates: v1 ${a.filas.length} ${aC(a.interes)}, v2 ${b.filas.length} ${b.interes}`);
    }
  };
  for (const d of S1.deudas.filter((x) => x.tipo === 'prestamo')) {
    const d2 = S2.deudas.find((x) => x.id === d.id)!;
    const saldo = v1.saldoDeuda(S1, d);
    amortiza(`amortización ${d.id}`, saldo, d.interes, d.cuota, 0);
    amortiza(`adelanto ${d.id}`, saldo, d.interes, d.cuota, 300);
    const a = v1.infoPrestamo(S1, d, h), b = dom.infoPrestamo(S2, d2, hoy);
    igual(`desde ${d.id}`, a.desde, b.desde);
    if (a.cuotas === b.cuotas) igual(`fin ${d.id}`, a.fin, b.fin);
  }

  // PRO-02, DES-04, AJU-01, IND: estimates; the interest of a loan's payment rounds to the cent like the v1
  const R1 = v1.ritmo(S1, h), R2 = dom.ritmo(S2, hoy);
  const prestamosConFijo = S1.fijos.filter((f) => f.activo !== false && f.tipo === 'gasto' && S1.deudas.some((d) => d.id === f.deudaId && d.tipo === 'prestamo' && !d.archivada));
  const tolCuota = prestamosConFijo.length * 2;
  for (const k of ['fijIng', 'fijGas', 'irr', 'varGas', 'ingreso', 'gasto', 'neto', 'months'] as const) {
    estimado(`ritmo ${k}`, k === 'months' ? R1[k] / 100 : R1[k], k === 'months' ? R2[k] : R2[k]);
  }
  for (const k of new Set([...Object.keys(R1.varCat), ...Object.keys(R2.varCat)])) estimado(`ritmo varCat ${k}`, R1.varCat[k] ?? 0, R2.varCat[k] ?? 0);
  for (const k of new Set([...Object.keys(R1.fijCat), ...Object.keys(R2.fijCat)])) estimado(`ritmo fijCat ${k}`, R1.fijCat[k] ?? 0, R2.fijCat[k] ?? 0, k === 'intereses' ? tolCuota : ES);
  estimado('ritmo capital', R1.capital, R2.capital, tolCuota);
  estimado('promedio irregular', v1.promedioIrregular(S1, h), dom.promedioIrregular(S2, hoy));
  texto('neto en texto', R1.neto, R2.neto, ES);

  const I1 = v1.indicadores(S1, h), I2 = dom.indicadores(S2, hoy);
  cerca('deuda total', I1.deudaTotal, I2.deudaTotal, nDe(['prestamo', 'persona']));
  igual('sin préstamos', [I1.libreDePrestamos, I1.hayPrestamos], [I2.libreDePrestamos, I2.hayPrestamos]);
  if (R1.ingreso > 0) {
    const tol = (tolCuota + ES) / (R1.ingreso * 100);
    if (Math.abs(I1.tasa - I2.tasa) > tol + 1e-12) dif.push(`tasa de ahorro: v1 ${I1.tasa} v2 ${I2.tasa}`);
  }
  if (R1.gasto > 0) {
    const tol = (nCu + ES) / (R1.gasto * 100) + 1e-12;
    if (Math.abs(I1.colchon - I2.colchon) > tol) dif.push(`colchón: v1 ${I1.colchon} v2 ${I2.colchon}`);
  }

  // MET-05: the same «vas bien», unless the net is within the tolerance of what the goals ask
  const E1 = v1.estadoMetas(S1, h), E2 = dom.estadoMetas(S2, hoy);
  estimado('metas piden', E1.pide, E2.pide);
  if (E1.vasBien !== E2.vasBien && Math.abs(E1.neto - (E1.pide - 0.5)) * 100 > ES) dif.push(`vas bien: v1 ${E1.vasBien} v2 ${E2.vasBien}`);

  // PRO-01 to PRO-08: every point of the chart within Bs 1, the same headline and the same month the savings end
  for (const anios of [1, 5, 20]) {
    for (const nominal of [false, true]) {
      const n = anios * 12, a = v1.proyectar(S1, h, n, { nominal }), b = dom.proyectar(S2, hoy, n, { nominal });
      const peor = a.pts.reduce((t: number, v: number, i: number) => Math.max(t, Math.abs(v * 100 - b.pts[i]!)), 0);
      if (!(peor < 100)) dif.push(`proyección ${anios} años ${nominal ? 'nominal' : ''}: se aleja ${peor} c`);
      texto(`titular ${anios} años`, a.pts[n], b.pts[n]!, peor);
      const cero1 = a.pts.findIndex((v: number, i: number) => i > 0 && v < 0 && a.pts[0] >= 0);
      const cero2 = b.pts.findIndex((v, i) => i > 0 && v < 0 && b.pts[0]! >= 0);
      if (cero1 !== cero2 && Math.abs((a.pts[cero1] ?? 0) * 100) > peor && Math.abs((a.pts[cero2] ?? 0) * 100) > peor) dif.push(`se acaban: v1 ${cero1} v2 ${cero2}`);
      igual(`fin de préstamos ${anios}`, a.prest.map((p: any) => p.fin), b.prest.map((p) => p.fin));
    }
  }
  const top = Object.entries(R1.varCat as Record<string, number>).sort((x, y) => y[1] - x[1]).slice(0, 4);
  const recortes = Object.fromEntries(top.map(([k], i) => [k, [10, 25, 50, 60][i]!]));
  const p0 = S1.deudas.find((d) => d.tipo === 'prestamo' && !d.archivada);
  const a = v1.proyectar(S1, h, 60, { recortes, extra: 750, adelanto: p0 ? { deudaId: p0.id, monto: 300 } : null });
  const b = dom.proyectar(S2, hoy, 60, { recortes, extra: 75000, adelanto: p0 ? { deudaId: p0.id, monto: 30000 } : null });
  estimado('¿y si? neto', a.neto, b.neto);
  const peor = a.pts.reduce((t: number, v: number, i: number) => Math.max(t, Math.abs(v * 100 - b.pts[i]!)), 0);
  if (!(peor < 100)) dif.push(`¿y si?: se aleja ${peor} c`);
  igual('¿y si? recortes', top.map(([k]) => k), dom.paraRecortar(R2).map(([k]) => k));

  // FMT-01, 02, 04: the same text for every amount of the state
  for (const m of S1.movs) {
    const c = aC(m.monto);
    igual(`texto ${m.id}`, [v1.money(m.monto), v1.money(m.monto, 2), v1.usd(m.monto, 2), v1.money(-m.monto, 2, true)],
      [dom.mostrar(c), dom.mostrar(c, 2), dom.mostrarUsd(c, 2), dom.mostrar(-c, 2, true)]);
  }

  // DEU-11: splitting each expense with the v1 and with the v2 gives the same amounts
  for (const g of S1.movs.filter((m) => m.tipo === 'gasto').slice(0, 5)) {
    const g2 = S2.movs.find((m) => m.id === g.id)!;
    const quien = v1.teDebenPara(S1, g)[0];
    igual(`a quién ${g.id}`, v1.teDebenPara(S1, g).map((d: any) => d.id), dom.teDebenPara(S2, g2).map((d) => d.id));
    for (const parte of [g.monto, Math.round(g.monto * 37) / 100, g.monto + 0.01]) {
      const x = v1.separarGasto(S1, g, parte, quien ? quien.id : { nombre: 'Nueva' });
      const y = dom.separarGasto(S2, g2, aC(parte) as any, quien ? quien.id : { nombre: 'Nueva' }, { deuda: 'n', prestamo: 'p' });
      if (x.error || !y.ok) { igual(`separar ${g.id} ${parte}`, !!x.error, !y.ok); continue; }
      igual(`separar ${g.id} ${parte}`, x.movs.map((m: any) => [m.tipo, aC(m.monto)]), y.datos.movs.map((m) => [m.tipo, m.monto]));
    }
  }
  return dif;
}
