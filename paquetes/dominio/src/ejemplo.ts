// DAT-01: the example shown before starting, the same as the v1's (makeDemo) in cents. It is never saved. It is built
// around «today»: three months of fixed items (the electricity of this month still pending), 80 days of everyday
// expenses from a fixed seed, a dollar purchase, an adjustment, a loan, two people and two goals.
import { centavos as c, restar, type Centavos } from './dinero';
import { diaDeLaSemana, fechaFijo, mesDe, sumarDias, sumarMeses, type Dia } from './fechas';
import { ajustesBase, categoriasBase } from './catalogo';
import type { Estado, Fijo, Movimiento } from './modelo';
import { interesDelMes } from './prestamos';
import { saldoDeuda } from './saldos';

const TOPES: Record<string, number> = { comida: 100000, super: 140000, ocio: 70000 };

export function ejemplo(hoy: Dia): Estado {
  const mes = mesDe(hoy), desde = sumarMeses(mes, -2);
  const S: Estado = {
    aj: { ...ajustesBase(), tc: 12.5, tcFecha: sumarDias(hoy, -9), inflacion: 8, irregular: c(200000), horas: 160, empezado: false },
    categorias: categoriasBase().map((k) => ({ ...k, tope: c(TOPES[k.id] ?? 0) })),
    cuentas: [
      { id: 'efectivo', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: c(120000), rendimiento: 0, diaADia: true, archivada: false },
      { id: 'banco', nombre: 'Banco', moneda: 'BOB', saldoInicial: c(520000), rendimiento: 2, diaADia: true, archivada: false },
      { id: 'dolares', nombre: 'Dólares', moneda: 'USD', saldoInicial: c(110000), rendimiento: 0, diaADia: false, archivada: false },
    ],
    deudas: [
      { id: 'prestamo', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: c(2045600), interes: 14, cuota: c(90000), dia: 20, archivada: false },
      { id: 'hermano', tipo: 'persona', nombre: 'Hermano', moneda: 'BOB', saldoInicial: c(150000), archivada: false },
      { id: 'amigo', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: c(40000), fechaEsperada: sumarMeses(mes, 1), archivada: false },
    ],
    fijos: ([
      { id: 'f-sueldo', nombre: 'Sueldo', tipo: 'ingreso', monto: c(800000), cuentaId: 'banco', categoriaId: 'sueldo', dia: 25 },
      { id: 'f-renta', nombre: 'Renta', tipo: 'gasto', monto: c(250000), cuentaId: 'banco', categoriaId: 'casa', dia: 5 },
      { id: 'f-luz', nombre: 'Luz', tipo: 'gasto', monto: c(18000), cuentaId: 'banco', categoriaId: 'casa', dia: 8 },
      { id: 'f-stream', nombre: 'Streaming', tipo: 'gasto', monto: c(6000), cuentaId: 'banco', categoriaId: 'suscripciones', dia: 12 },
      { id: 'f-internet', nombre: 'Internet', tipo: 'gasto', monto: c(20000), cuentaId: 'banco', categoriaId: 'casa', dia: 15 },
      { id: 'f-cuota', nombre: 'Cuota del préstamo', tipo: 'gasto', monto: c(90000), cuentaId: 'banco', categoriaId: 'intereses', dia: 20, deudaId: 'prestamo' },
    ] as Fijo[]).map((f) => ({ ...f, desde, activo: true })),
    movs: [], ocurrencias: [], metas: [], apartados: [],
  };
  let n = 0;
  const mov = (m: Omit<Movimiento, 'id'>): void => { S.movs.push({ id: 'd' + n++, nota: '', ...m }); };

  // The fixed items confirmed in the past months (this month's electricity stays pending)
  for (const m of [sumarMeses(mes, -2), sumarMeses(mes, -1), mes]) {
    for (const f of S.fijos) {
      const fecha = fechaFijo(f.dia, m);
      if (fecha >= hoy || (f.id === 'f-luz' && m === mes)) continue;
      const id = 'd' + n;
      if (f.deudaId) {
        const d = S.deudas[0]!, interes = interesDelMes(saldoDeuda(S, d), d.interes);
        mov({ tipo: 'pago', deudaId: d.id, cuentaId: f.cuentaId, monto: f.monto, interes, capital: restar(f.monto, interes), fecha, fijoId: f.id, mes: m, nota: f.nombre });
      } else mov({ tipo: f.tipo, cuentaId: f.cuentaId, categoriaId: f.categoriaId, monto: f.monto, fecha, fijoId: f.id, mes: m, nota: f.nombre });
      S.ocurrencias.push({ id: `${f.id}_${m}`, fijoId: f.id, mes: m, estado: 'confirmado', movId: id });
    }
  }

  // Everyday life: the same random sequence as the v1, so the example looks the same
  let semilla = 11;
  const rnd = (): number => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  const r = (a: number, b: number): Centavos => c((Math.round((a + rnd() * (b - a)) / 5) * 5) * 100);
  for (let i = 1; i <= 80; i++) {
    const fecha = sumarDias(hoy, -i), wd = diaDeLaSemana(fecha);
    if (rnd() < 0.5) mov({ tipo: 'gasto', cuentaId: 'efectivo', categoriaId: 'comida', monto: r(25, 120), fecha, nota: ['Almuerzo', 'Salteñas', 'Café', 'Cena'][i % 4] as string });
    if (wd === 6) mov({ tipo: 'gasto', cuentaId: 'banco', categoriaId: 'super', monto: r(250, 380), fecha, nota: 'Súper de la semana' });
    if (rnd() < 0.45) mov({ tipo: 'gasto', cuentaId: 'efectivo', categoriaId: 'transporte', monto: r(10, 45), fecha, nota: ['Taxi', 'Micro', 'Gasolina'][i % 3] as string });
    if (wd === 5 && rnd() < 0.7) mov({ tipo: 'gasto', cuentaId: 'banco', categoriaId: 'ocio', monto: r(80, 220), fecha, nota: ['Cine', 'Salida con amigos', 'Concierto'][i % 3] as string });
    if (rnd() < 0.06) mov({ tipo: 'gasto', cuentaId: 'banco', categoriaId: 'compras', monto: r(150, 500), fecha, nota: ['Ropa', 'Audífonos', 'Regalo'][i % 3] as string });
    if (i % 14 === 3) mov({ tipo: 'transferencia', cuentaId: 'banco', cuentaDestinoId: 'efectivo', monto: c(70000), fecha, nota: 'Retiro del cajero' });
    if (i % 30 === 7) mov({ tipo: 'ingreso', cuentaId: 'banco', categoriaId: 'negocio', monto: r(1300, 1900), fecha, nota: 'Retiro del negocio' });
    if (i === 33) mov({ tipo: 'gasto', cuentaId: 'banco', categoriaId: 'salud', monto: c(25000), fecha, nota: 'Consulta' });
  }
  mov({ tipo: 'transferencia', cuentaId: 'banco', cuentaDestinoId: 'dolares', monto: c(125000), montoDestino: c(10000), fecha: sumarDias(hoy, -2), nota: 'Compra de dólares' });
  mov({ tipo: 'ajuste', cuentaId: 'efectivo', monto: c(4500), sentido: -1, fecha: sumarDias(hoy, -7), nota: 'Cuadre de cuenta' });

  S.metas = [
    { id: 'fondo', nombre: 'Fondo de emergencia', monto: c(1500000), mes: sumarMeses(mes, 13), archivada: false },
    { id: 'viaje', nombre: 'Viaje', monto: c(900000), mes: sumarMeses(mes, 8), archivada: false },
  ];
  S.apartados = [
    { id: 'a1', metaId: 'fondo', cuentaId: 'dolares', monto: c(27632), fecha: sumarDias(hoy, -40) },
    { id: 'a2', metaId: 'fondo', cuentaId: 'dolares', monto: c(4368), fecha: `${mes}-01` },
    { id: 'a3', metaId: 'viaje', cuentaId: 'dolares', monto: c(9600), fecha: sumarDias(hoy, -35) },
  ];
  return S;
}
