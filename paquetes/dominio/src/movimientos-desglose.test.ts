import { describe, expect, it } from 'vitest';
import { base, conFijos, HOY, prestamo } from './base.prueba';
import { detalleCategoria, resumenMes } from './desglose';
import { centavos as c, mostrar, mostrarNumero } from './dinero';
import type { Categoria, Estado } from './modelo';
import {
  avanceTopes, avisoTope, categoriasPorUso, conTipoDeCambio, gastoMesCat, movimientosDelMes, nivelTope, notasSugeridas, validarTransferencia,
} from './movimientos';
import { indicadores, ritmo } from './ritmo';
import { saldoCuenta } from './saldos';

const conTope = (S: Estado, id: string, tope: number): Categoria => {
  const k = S.categorias.find((x) => x.id === id)!;
  k.tope = c(tope);
  return k;
};

describe('movimientos y topes', () => {
  it('MOV-02 segundo almuerzo: Efectivo, Comida fuera primera y «Almuerzo» entre las notas', () => {
    const S = base();
    S.movs = [1, 2, 3].map((i) => ({ id: 'c' + i, tipo: 'gasto' as const, cuentaId: 'ef', categoriaId: 'comida', monto: c(3500), fecha: `2026-11-0${i}`, nota: 'Almuerzo' }));
    S.movs.push({ id: 'v', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'super', monto: c(100), fecha: '2026-06-01', nota: 'Viejo' });
    expect(categoriasPorUso(S, 'gasto', HOY)[0]?.id).toBe('comida');
    expect(notasSugeridas(S, 'comida')).toEqual(['Almuerzo']);
    S.categorias.find((x) => x.id === 'comida')!.archivada = true;
    expect(categoriasPorUso(S, 'gasto', HOY).some((x) => x.id === 'comida')).toBe(false);
  });

  it('MOV-03 transferir Bs 1.250 de Banco a Dólares y recibir US$ 100: Banco baja 1250, Dólares sube 100, el gastado no cambia', () => {
    const S = base();
    const t = { cuentaId: 'bn', cuentaDestinoId: 'us', monto: c(125000), montoDestino: c(10000) };
    expect(validarTransferencia(S, t)).toBeNull();
    S.movs = [{ id: 't', tipo: 'transferencia', fecha: '2026-11-08', ...t }];
    expect(saldoCuenta(S, S.cuentas[1]!)).toBe(230000);
    expect(saldoCuenta(S, S.cuentas[2]!)).toBe(130000);
    const r = resumenMes(S, '2026-11');
    expect(r.salio).toBe(0);
    expect(r.entro).toBe(0);
  });

  it('MOV-03 misma cuenta de origen y destino no se guarda; entre monedas pide lo recibido', () => {
    const S = base();
    expect(validarTransferencia(S, { cuentaId: 'bn', cuentaDestinoId: 'bn', monto: c(100) })).toBe('misma-cuenta');
    expect(validarTransferencia(S, { cuentaId: 'bn', cuentaDestinoId: 'us', monto: c(100) })).toBe('falta-monto-destino');
    expect(validarTransferencia(S, { cuentaId: 'bn', cuentaDestinoId: 'ef', monto: c(0) })).toBe('falta-monto');
    expect(validarTransferencia(S, { cuentaId: 'bn', cuentaDestinoId: 'ef', monto: c(100) })).toBeNull();
  });

  it('MOV-04 noviembre filtrado por Efectivo: solo lo que entra o sale de Efectivo, por día con su gasto', () => {
    const S = base();
    S.movs = [
      { id: 'a', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(3500), fecha: '2026-11-03' },
      { id: 'b', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'transporte', monto: c(1250), fecha: '2026-11-03' },
      { id: 'c', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'ef', monto: c(70000), fecha: '2026-11-05' },
      { id: 'd', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'super', monto: c(32000), fecha: '2026-11-05' },
      { id: 'e', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(4000), fecha: '2026-10-30' },
      { id: 'f', tipo: 'gasto', cuentaId: 'us', categoriaId: 'compras', monto: c(2000), fecha: '2026-11-05', tc: 12 },
    ];
    const ef = movimientosDelMes(S, '2026-11', 'ef');
    expect(ef.map((d) => [d.fecha, d.movs.map((m) => m.id), d.gastado])).toEqual([['2026-11-05', ['c'], 0], ['2026-11-03', ['b', 'a'], 4750]]);
    const todas = movimientosDelMes(S, '2026-11');
    expect(todas[0]).toMatchObject({ fecha: '2026-11-05', gastado: 32000 + 25000 });
    expect(todas.flatMap((d) => d.movs).map((m) => m.id)).not.toContain('e');
  });

  it('MOV-05 Comida fuera lleva 850 de 1000 y se escribe 35: «después de esto llevas 89 % de tu tope»', () => {
    const S = base();
    conTope(S, 'comida', 100000);
    S.movs = [{ id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(85000), fecha: '2026-11-03' }];
    const g = { id: 'nuevo', categoriaId: 'comida', cuentaId: 'ef', monto: c(3500), fecha: HOY };
    expect(Math.round(avisoTope(S, g)! * 100)).toBe(89);
    expect(avisoTope(S, { ...g, monto: c(100) })).toBeCloseTo(0.851);
    expect(avisoTope(S, { ...g, id: '1', monto: c(3500) })).toBeNull(); // editing the same expense does not count it twice
    expect(avisoTope(S, { ...g, categoriaId: 'super' })).toBeNull();
  });

  it('MOV-06 en octubre se gastaron US$ 20 a 12,5 y hoy el tipo es 14: el Desglose de octubre sigue en Bs 250', () => {
    const S = base();
    const m = conTipoDeCambio(S, { id: 'u', tipo: 'gasto', cuentaId: 'us', categoriaId: 'compras', monto: c(2000), fecha: '2026-10-15' });
    expect(m.tc).toBe(12.5);
    expect(conTipoDeCambio(S, { id: 'b', tipo: 'gasto', cuentaId: 'bn', monto: c(1), fecha: HOY }).tc).toBeUndefined();
    expect(conTipoDeCambio(S, { id: 't', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', monto: c(1), fecha: HOY }).tc).toBe(12.5);
    S.movs = [m];
    S.aj.tc = 14;
    expect(resumenMes(S, '2026-10').salio).toBe(25000);
    expect(gastoMesCat(S, '2026-10').compras).toBe(25000);
  });

  it('LIM-03 Comida fuera con tope 1000 y 1150 en octubre: 115 %; en noviembre vuelve a 0 de 1000', () => {
    const S = base();
    conTope(S, 'comida', 100000);
    S.movs = [{ id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(115000), fecha: '2026-10-15' }];
    expect(avanceTopes(S, '2026-10')[0]).toMatchObject({ gastado: 115000, pct: 1.15, nivel: 'rojo' });
    expect(avanceTopes(S, '2026-11')[0]).toMatchObject({ gastado: 0, pct: 0, nivel: 'ok' });
  });

  it('LIM-03 los fijos confirmados cuentan en el tope', () => {
    const S = base();
    conTope(S, 'casa', 300000);
    S.movs = [{ id: 'm_f_2026-11', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'casa', monto: c(250000), fecha: '2026-11-05', fijoId: 'f', mes: '2026-11' }];
    expect(avanceTopes(S, '2026-11')[0]).toMatchObject({ gastado: 250000, nivel: 'ambar' });
  });

  it('LIM-04 Comida fuera con 850 de 1000: ámbar, «llevas Bs 850 de tu tope de Bs 1.000 (85 %)»; con 1150 rojo, «Te pasaste Bs 150»', () => {
    expect(nivelTope(0.85)).toBe('ambar');
    expect(nivelTope(0.8)).toBe('ambar');
    expect(nivelTope(1)).toBe('rojo');
    expect(nivelTope(0.5)).toBe('ok');
    const S = base();
    const k = conTope(S, 'comida', 100000);
    S.movs = [{ id: '1', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(85000), fecha: '2026-11-03' }];
    const t = avanceTopes(S, '2026-11')[0]!;
    expect(`${k.nombre}: llevas ${mostrar(t.gastado)} de tu tope de ${mostrar(k.tope!)} (${Math.round(t.pct * 100)} %)`)
      .toBe('Comida fuera: llevas Bs 850 de tu tope de Bs 1.000 (85 %)');
    S.movs[0]!.monto = c(115000);
    const r = avanceTopes(S, '2026-11')[0]!;
    expect(r.nivel).toBe('rojo');
    expect(`Te pasaste ${mostrar(r.gastado - k.tope!)}`).toBe('Te pasaste Bs 150');
  });
});

describe('desglose', () => {
  it('DES-01 en octubre entraron 9800 y salieron 7335: quedó 2.465', () => {
    const S = base();
    S.movs = [
      { id: 'i', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'sueldo', monto: c(980000), fecha: '2026-10-25' },
      { id: 'g1', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'casa', monto: c(250000), fecha: '2026-10-05', fijoId: 'r', mes: '2026-10' },
      { id: 'g2', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(483500), fecha: '2026-10-09' },
    ];
    const r = resumenMes(S, '2026-10');
    expect(r).toMatchObject({ entro: 980000, salio: 733500, quedo: 246500 });
    expect([mostrarNumero(r.entro), mostrarNumero(r.salio), mostrarNumero(r.quedo)]).toEqual(['9.800', '7.335', '2.465']);
  });

  it('DES-02 entran 9800, Casa suma 2880 y la persona trabaja 160 horas: 29 de cada 100 y 47 horas', () => {
    const S = base();
    S.movs = [
      { id: 'i', tipo: 'ingreso', cuentaId: 'bn', categoriaId: 'sueldo', monto: c(980000), fecha: '2026-10-25' },
      { id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'casa', monto: c(288000), fecha: '2026-10-05' },
    ];
    const r = resumenMes(S, '2026-10'), d = detalleCategoria(S, r, ritmo(S, HOY), 'casa');
    expect(mostrarNumero(d.deCada100! * 100)).toBe('29');
    expect(d.horas).toBe(47);
    S.aj.horas = 0;
    expect(detalleCategoria(S, r, ritmo(S, HOY), 'casa').horas).toBeNull(); // AJU-03: no hours, no hours shown
  });

  it('DES-02 Súper suma 1300 con un tope de 1400: ámbar con «93 % de tu tope de Bs 1.400»', () => {
    const S = base();
    conTope(S, 'super', 140000);
    S.movs = [{ id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'super', monto: c(130000), fecha: '2026-11-05' }];
    const d = detalleCategoria(S, resumenMes(S, '2026-11'), ritmo(S, HOY), 'super');
    expect(d.nivel).toBe('ambar');
    expect(`${Math.round(d.pctTope! * 100)} % de tu tope de ${mostrar(c(140000))}`).toBe('93 % de tu tope de Bs 1.400');
  });

  it('DES-02 en 10 años suma su promedio por 120 meses', () => {
    const S = base();
    S.movs = [{ id: 'g', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: c(60000), fecha: HOY }];
    const R = ritmo(S, HOY);
    expect(detalleCategoria(S, resumenMes(S, '2026-11'), R, 'comida').enDiezAnios).toBeCloseTo(60000 * 120);
  });

  it('DES-03 con tipo 12,5 se compran US$ 50 por Bs 650 y se cuadra con −200: cambio −Bs 25 y cuadres −Bs 200', () => {
    const S = base();
    S.movs = [
      { id: 't', tipo: 'transferencia', cuentaId: 'ef', cuentaDestinoId: 'us', monto: c(65000), montoDestino: c(5000), tc: 12.5, fecha: HOY },
      { id: 'a', tipo: 'ajuste', cuentaId: 'bn', monto: c(20000), sentido: -1, fecha: HOY },
    ];
    const r = resumenMes(S, '2026-11');
    expect(r.cambio).toBe(-2500);
    expect(r.ajustes).toBe(-20000);
    // what stayed + those lines = change of net worth by movements, in Bs at 12,5
    const antes = 65000 + 355000 + 120000 * 12.5;
    const despues = saldoCuenta(S, S.cuentas[0]!) + saldoCuenta(S, S.cuentas[1]!) + saldoCuenta(S, S.cuentas[2]!) * 12.5;
    expect(r.quedo + r.cambio + r.ajustes + r.cierres).toBe(despues - antes);
    // selling dollars the other way round
    S.movs = [{ id: 'v', tipo: 'transferencia', cuentaId: 'us', cuentaDestinoId: 'bn', monto: c(1000), montoDestino: c(13000), tc: 12.5, fecha: HOY }];
    expect(resumenMes(S, '2026-11').cambio).toBe(500);
  });

  it('DES-04 cuota de 900 con 214,67 de interés este mes: el promedio de Intereses usa 214,67', () => {
    const S = conFijos(base(), [{ nombre: 'Cuota', tipo: 'gasto', monto: c(90000), categoriaId: 'intereses', dia: 20, deudaId: 'pr' }]);
    S.deudas = [prestamo()];
    const R = ritmo(S, HOY);
    expect(R.fijCat.intereses).toBe(21467);
    expect(R.capital).toBe(68533);
  });
});

describe('indicadores', () => {
  it('IND-01 entran 10000 al mes y el neto es 2000: tasa de ahorro 20 %', () => {
    const S = conFijos(base(), [
      { nombre: 'Sueldo', tipo: 'ingreso', monto: c(1000000), categoriaId: 'sueldo', dia: 25 },
      { nombre: 'Gastos', tipo: 'gasto', monto: c(800000), categoriaId: 'casa', dia: 5 },
    ]);
    expect(indicadores(S, HOY).tasa).toBe(0.2);
  });

  it('IND-01 entran 8000 y la cuota de 2000 con 200 de interés es el único gasto: 97,5 %', () => {
    const S = conFijos(base(), [
      { nombre: 'Sueldo', tipo: 'ingreso', monto: c(800000), categoriaId: 'sueldo', dia: 25 },
      { nombre: 'Cuota', tipo: 'gasto', monto: c(200000), categoriaId: 'intereses', dia: 20, deudaId: 'pr' },
    ]);
    S.deudas = [prestamo({ saldoInicial: c(2000000), interes: 12, cuota: c(200000) })];
    const I = indicadores(S, HOY);
    expect(I.R.fijCat.intereses).toBe(20000);
    expect(I.R.capital).toBe(180000);
    expect(I.tasa).toBeCloseTo(0.975, 12);
  });

  it('IND-02 cuentas en Bs 19.200 y gasto mensual 7440: colchón de 2,6 meses; lo que te deben no cuenta', () => {
    const S = conFijos(base(), [{ nombre: 'Gastos', tipo: 'gasto', monto: c(744000), categoriaId: 'casa', dia: 5 }]);
    S.deudas = [{ id: 'am', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: c(40000) }];
    const I = indicadores(S, HOY);
    expect(I.colchon).toBeCloseTo(19200 / 7440, 12);
    expect(mostrarNumero(I.colchon * 100, 1)).toBe('2,6');
  });

  it('IND-03 entran 9500 y salen 7440: +2060, «entra 9.500 · sale 7.440»', () => {
    const S = conFijos(base(), [
      { nombre: 'Sueldo', tipo: 'ingreso', monto: c(800000), categoriaId: 'sueldo', dia: 25 },
      { nombre: 'Gastos', tipo: 'gasto', monto: c(744000), categoriaId: 'casa', dia: 5 },
    ]);
    S.aj.irregular = c(150000);
    const R = ritmo(S, HOY);
    expect(mostrar(R.neto, 0, true)).toBe('+Bs 2.060');
    expect(`entra ${mostrarNumero(R.ingreso)} · sale ${mostrarNumero(R.gasto)}`).toBe('entra 9.500 · sale 7.440');
  });

  it('IND-04 debe 18400 al banco (termina en oct 2028) y 1500 a su hermano: Bs 19.900 y «sin préstamos en oct 2028»', () => {
    const S = base();
    S.deudas = [prestamo(), { id: 'he', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000) }];
    const I = indicadores(S, HOY);
    expect(I.deudaTotal).toBe(1990000);
    expect(mostrar(I.deudaTotal)).toBe('Bs 19.900');
    expect(I.libreDePrestamos).toBe('2028-10');
    expect(I.hayPrestamos).toBe(true);
    S.deudas.push(prestamo({ id: 'p2', saldoInicial: c(1000000), interes: 24, cuota: c(15000) }));
    expect(indicadores(S, HOY).libreDePrestamos).toBeNull(); // a loan that does not go down
  });
});
