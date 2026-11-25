// Job 084 · The use cases of the rest of the screens: accounts, fixed items, debts and payments, an expense someone
// owes you, goals, categories, Ajustes, starting, the backup and deleting everything. Each one checks what it writes,
// in cents and in order, and the numbers the screens show.
import { describe, expect, it } from 'vitest';
import type { BorradorDeuda, Datos } from '@rumbo/contratos';
import { appDePrueba, datosDePrueba } from '../composicion/prueba';

// A loan of Bs 18.400 at 14 % with a payment of Bs 900 on the 20th, its payment item, a brother you owe and Amigo who
// owes you, and a goal.
function conDeudas(): Datos {
  const d = datosDePrueba();
  const cols = d.cols as unknown as Record<string, unknown[]>;
  cols.deudas = [
    { id: 'banco', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia: 20, desde: '2026-10-01', archivada: false },
    { id: 'amigo', tipo: 'teDeben', nombre: 'Amigo', moneda: 'BOB', saldoInicial: 40000, interes: 0, cuota: 0, dia: 1, desde: '2026-10-01', archivada: false },
  ];
  cols.fijos = [...cols.fijos!, { id: 'cuota', nombre: 'Cuota del préstamo', tipo: 'gasto', monto: 90000, cuentaId: 'bn', categoriaId: 'intereses', dia: 20, deudaId: 'banco', desde: '2026-11', activo: true }];
  cols.metas = [{ id: 'fondo', nombre: 'Fondo de emergencia', monto: 1500000, mes: '2027-12', archivada: false }];
  return d;
}
const deuda = (b: Partial<BorradorDeuda> = {}): BorradorDeuda => ({
  id: 'nueva', tipo: 'prestamo', nombre: 'Auto', moneda: 'BOB', saldo: '10.000', interes: '12', cuota: '500', dia: '5', fechaEsperada: '',
  cuentaMov: null, crearFijo: true, cuentaFijo: 'bn', ...b,
});

describe('cuentas (CTA-01, CTA-03, CTA-08, FMT-02)', () => {
  it('CTA-01: crea Banco 2 en Bs con 3550 y 2 %, marcada para el día a día, y Plan la muestra con 2 decimales', () => {
    const { app, almacen } = appDePrueba();
    const f = app.formularioCuenta();
    expect(app.guardarCuenta({ ...f.borrador, nombre: ' Banco 2 ', saldo: '3550', rendimiento: '2' })).toEqual({ ok: true, datos: null });
    expect(almacen.documentos[`cuentas/${f.borrador.id}`]).toMatchObject({ nombre: 'Banco 2', moneda: 'BOB', saldoInicial: 355000, rendimiento: 2, diaADia: true, desde: '2026-11-10' });
    expect(app.plan().cuentas.find((c) => c.nombre === 'Banco 2')).toMatchObject({ saldo: 355000, diaADia: true, rendimiento: 2 });
    expect(app.guardarCuenta({ ...app.formularioCuenta().borrador, nombre: '' })).toEqual({ ok: false, codigo: 'falta-nombre' });
    expect(app.guardarCuenta({ ...app.formularioCuenta().borrador, nombre: 'X', saldo: '0,125' })).toEqual({ ok: false, codigo: 'mas-de-2-decimales' });
  });

  it('CTA-03: cuadrar deja el saldo real con un ajuste; si ya estaba, no escribe nada', () => {
    const { app, almacen } = appDePrueba();
    expect(app.cuadrar('bn', '3.500,50')).toEqual({ ok: true, datos: { diferencia: -4950, moneda: 'BOB' } });
    expect(app.plan().cuentas.find((c) => c.id === 'bn')!.saldo).toBe(350050);
    const n = almacen.escrituras.length;
    expect(app.cuadrar('bn', '3500,50')).toEqual({ ok: true, datos: { diferencia: 0, moneda: 'BOB' } });
    expect(almacen.escrituras.length).toBe(n);
  });

  it('CTA-08: una cuenta se archiva solo en cero y sus movimientos siguen', () => {
    const { app } = appDePrueba();
    expect(app.archivarCuenta('ef')).toEqual({ ok: false, codigo: 'saldo-no-es-cero' });
    app.cuadrar('ef', '0');
    expect(app.archivarCuenta('ef')).toEqual({ ok: true, datos: { archivada: true, nombre: 'Efectivo' } });
    expect(app.plan().cuentas.some((c) => c.id === 'ef')).toBe(false);
    expect(app.movimientos({ mes: '2026-11', cuenta: 'ef', categoria: null }).cantidad).toBe(2);
  });
});

describe('fijos (FIJ-01, FIJ-04)', () => {
  it('crea, edita y quita un fijo en centavos; sin nombre o monto no guarda', () => {
    const { app, almacen } = appDePrueba();
    const f = app.formularioFijo()!;
    expect(f.borrador).toMatchObject({ tipo: 'gasto', categoriaId: 'casa', cuentaId: 'ef' });
    expect(app.guardarFijo({ ...f.borrador, nombre: 'Internet', monto: '199,90', dia: '40' })).toEqual({ ok: true, datos: null });
    expect(almacen.documentos[`fijos/${f.borrador.id}`]).toMatchObject({ nombre: 'Internet', monto: 19990, dia: 31, desde: '2026-11', activo: true, deudaId: null });
    expect(app.guardarFijo({ ...f.borrador, nombre: '' })).toEqual({ ok: false, codigo: 'falta-nombre' });
    expect(app.guardarFijo({ ...f.borrador, nombre: 'Internet', monto: '' })).toEqual({ ok: false, codigo: 'falta-monto' });
    app.quitarFijo(f.borrador.id);
    expect(app.plan().fijos.some((x) => x.id === f.borrador.id)).toBe(false);
  });
});

describe('deudas (DEU-01, DEU-02, DEU-07, DEU-09, DEU-10, FIJ-06, FIJ-07, PAN-07)', () => {
  it('FIJ-07: un préstamo nuevo crea el fijo de su cuota desde el mes siguiente si su día ya pasó', () => {
    const { app, almacen } = appDePrueba();
    expect(app.primeraCuota('5')).toBe('2026-12');
    expect(app.primeraCuota('20')).toBe('2026-11');
    expect(app.guardarDeuda(deuda())).toEqual({ ok: true, datos: null });
    expect(almacen.documentos['deudas/nueva']).toMatchObject({ tipo: 'prestamo', saldoInicial: 1000000, interes: 12, cuota: 50000, dia: 5 });
    expect(Object.entries(almacen.documentos).find(([k]) => k.startsWith('fijos/'))![1]).toMatchObject({ nombre: 'Cuota · Auto', monto: 50000, deudaId: 'nueva', desde: '2026-12', categoriaId: 'intereses' });
    expect(app.guardarDeuda(deuda({ id: 'otra', cuota: '' }))).toEqual({ ok: false, codigo: 'falta-cuota' });
    expect(app.guardarDeuda(deuda({ id: 'otra', moneda: 'USD', cuentaFijo: 'bn' }))).toEqual({ ok: false, codigo: 'falta-cuenta-fijo' });
  });

  it('DEU-07: si el dinero entra hoy, la deuda arranca en 0 y el movimiento la sube, sin ser ingreso', () => {
    const { app } = appDePrueba();
    app.guardarDeuda(deuda({ tipo: 'persona', nombre: 'Hermano', saldo: '1.500', cuentaMov: 'ef', crearFijo: false }));
    const v = app.deuda('nueva', 0)!;
    expect(v).toMatchObject({ saldo: 150000, tipo: 'persona', prestamo: null });
    expect(v.movimientos).toMatchObject([{ tipo: 'recibido', monto: 150000, nota: 'Te prestó Hermano' }]);
    expect(app.desglose('2026-11').entro).toBe(0);
  });

  it('DEU-02 y FIJ-06: pagar la cuota de 900 separa 214,67 de interés, baja la deuda y la saca de Por confirmar', () => {
    const { app, almacen } = appDePrueba(conDeudas());
    const f = app.formularioPago('banco', 'pago')!;
    expect(f).toMatchObject({ cuentaId: 'bn', monto: '900', interes: 21467, maximo: 1861467, cuotaDe: '2026-11' });
    expect(app.pagar({ deudaId: 'banco', tipo: 'pago', cuentaId: 'bn', monto: '900', fecha: '2026-11-10', esCuota: true })).toEqual({ ok: true, datos: null });
    const mov = Object.entries(almacen.documentos).find(([k]) => k.startsWith('movs/'))![1];
    expect(mov).toMatchObject({ tipo: 'pago', monto: 90000, interes: 21467, capital: 68533, fijoId: 'cuota', mes: '2026-11', nota: 'Pagar Préstamo del banco' });
    expect(almacen.escrituras.slice(-2)).toEqual([expect.stringMatching(/^PUT movs\//), 'PUT ocurrencias/cuota_2026-11']);
    expect(app.deuda('banco', 0)!.saldo).toBe(1771467);
    expect(app.desglose('2026-11').categorias.find((k) => k.categoria.id === 'intereses')!.total).toBe(21467);
  });

  it('DEU-10: no se paga más que el saldo más el interés, ni se cobra más de lo que te deben', () => {
    const { app } = appDePrueba(conDeudas());
    expect(app.pagar({ deudaId: 'banco', tipo: 'pago', cuentaId: 'bn', monto: '18.614,68', fecha: '2026-11-10', esCuota: false })).toEqual({ ok: false, codigo: 'mas-que-el-maximo' });
    expect(app.pagar({ deudaId: 'amigo', tipo: 'cobro', cuentaId: 'ef', monto: '401', fecha: '2026-11-10', esCuota: false })).toEqual({ ok: false, codigo: 'mas-que-el-maximo' });
    expect(app.pagar({ deudaId: 'amigo', tipo: 'cobro', cuentaId: 'us', monto: '100', fecha: '2026-11-10', esCuota: false })).toEqual({ ok: false, codigo: 'otra-moneda' });
  });

  it('PAN-07: el préstamo dice cuándo termina, sus 3 próximas cuotas y lo que ahorras al adelantar', () => {
    const { app } = appDePrueba(conDeudas());
    const P = app.deuda('banco', 0)!.prestamo!;
    expect(P).toMatchObject({ fin: '2028-10', inicial: 1840000, pagado: 0, cuota: 90000, tasa: 14, dia: 20, crece: false, adelanto: null });
    expect(Math.round(P.interesPorPagar / 100)).toBe(2744); // DEU-04
    expect(P.proximas[0]).toEqual({ mes: '2026-11', interes: 21467, capital: 68533, saldo: 1771467 });
    expect(P.proximas).toHaveLength(3);
    const A = app.deuda('banco', 50000)!.prestamo!.adelanto!;
    expect(A.mesesAntes).toBeGreaterThan(0);
    expect(A.interesAhorrado).toBeGreaterThan(0);
  });

  it('DEU-09: archivar una deuda con saldo deja su cierre y apaga el fijo de la cuota', () => {
    const { app, almacen } = appDePrueba(conDeudas());
    expect(app.archivarDeuda('amigo')).toEqual({ ok: true, datos: { pendiente: 40000, moneda: 'BOB' } });
    expect(app.plan().deudas.map((d) => d.id)).toEqual(['banco']);
    app.archivarDeuda('banco');
    expect(almacen.documentos['fijos/cuota']).toMatchObject({ activo: false });
    expect(app.desglose('2026-11').cierres).toBe(1840000 - 40000);
  });
});

describe('DEU-11: me deben una parte de un gasto', () => {
  it('la mitad de la cena: el gasto queda en 150 y Amigo debe 150 más, sin mover la cuenta', () => {
    const { app } = appDePrueba(conDeudas());
    app.anotar({ id: 'cena', tipo: 'gasto', cuentaId: 'ef', cuentaDestinoId: null, categoriaId: 'comida', monto: '300', montoDestino: '', nota: 'Cena', fecha: '2026-11-10', usarTc: false });
    const antes = app.plan().cuentas.find((c) => c.id === 'ef')!.saldo;
    const f = app.formularioSeparar('cena')!;
    expect(f.personas.map((p) => p.nombre)).toEqual(['Amigo']);
    expect(app.separarGasto('cena', '301', 'amigo')).toEqual({ ok: false, codigo: 'mas-que-el-maximo' });
    expect(app.separarGasto('cena', '150', 'amigo')).toEqual({ ok: true, datos: { nombre: 'Amigo', queda: 15000, monto: 15000, moneda: 'BOB' } });
    expect(app.plan().cuentas.find((c) => c.id === 'ef')!.saldo).toBe(antes);
    expect(app.deuda('amigo', 0)!.saldo).toBe(55000);
    expect(app.movimientos({ mes: '2026-11', cuenta: 'todas', categoria: 'comida' }).categoria!.total).toBe(3500 + 15000);
  });
});

describe('metas (MET-01, MET-02, PAN-08)', () => {
  it('apartar 300 desde Banco baja lo que falta este mes; no se aparta más que el libre ni se desaparta más de lo apartado', () => {
    const { app, almacen } = appDePrueba(conDeudas());
    const antes = app.meta('fondo')!;
    expect(antes).toMatchObject({ ap: 0, monto: 1500000, meses: 13 });
    expect(app.apartar('fondo', 'bn', '300', 1)).toEqual({ ok: true, datos: null });
    const v = app.meta('fondo')!;
    expect(v).toMatchObject({ ap: 30000, esteMes: 30000 });
    expect(v.dondeEsta).toEqual([{ cuentaId: 'bn', cuenta: 'Banco', moneda: 'BOB', monto: 30000, enBs: null }]);
    expect(Math.abs(v.falta - (v.aporte - 30000))).toBeLessThanOrEqual(1);
    expect(v.falta).toBeLessThan(antes.falta);
    expect(app.apartar('fondo', 'bn', '1.000.000', 1)).toEqual({ ok: false, codigo: 'mas-que-el-libre' });
    expect(app.apartar('fondo', 'bn', '301', -1)).toEqual({ ok: false, codigo: 'mas-que-lo-apartado' });
    app.archivarMeta('fondo');
    expect(almacen.escrituras.at(-1)).toMatch(/^DELETE apartados\//);
    expect(app.plan().metas).toEqual([]);
  });

  it('MET-01: una meta nueva pide nombre y monto, y es para dentro de un año', () => {
    const { app } = appDePrueba();
    const f = app.formularioMeta();
    expect(f).toMatchObject({ desde: '2026-12', borrador: { mes: '2027-11' } });
    expect(app.guardarMeta({ ...f.borrador, nombre: 'Viaje' })).toEqual({ ok: false, codigo: 'falta-monto' });
    expect(app.guardarMeta({ ...f.borrador, nombre: 'Viaje', monto: '9.000' })).toEqual({ ok: true, datos: null });
    expect(app.plan().metas).toMatchObject([{ nombre: 'Viaje', monto: 900000, mes: '2027-11' }]);
  });
});

describe('categorías y topes (LIM-01, PAN-09)', () => {
  it('pone un tope a Súper en centavos y Plan lo cuenta', () => {
    const { app, almacen } = appDePrueba();
    const f = app.formularioCategoria('super');
    expect(app.guardarCategoria({ ...f.borrador, tope: '1.400' })).toEqual({ ok: true, datos: null });
    expect(almacen.documentos['categorias/super']).toMatchObject({ tope: 140000, tipo: 'gasto', base: true });
    expect(app.plan().categorias).toEqual({ cantidad: 16, topes: [{ nombre: 'Súper', tope: 140000 }] });
    expect(app.archivarCategoria('super')).toEqual({ ok: true, datos: { archivada: true } });
    expect(app.plan().categorias.cantidad).toBe(15);
  });
});

describe('Ajustes (AJU-01 a AJU-05, CTA-04)', () => {
  it('AJU-04: cambiar el tipo de cambio a 13 recalcula el patrimonio y la fecha pasa a hoy', () => {
    const { app } = appDePrueba();
    const antes = app.plan().patrimonio.total;
    expect(app.guardarAjustes({ tc: '13,00', irregular: '1.500,50', inflacion: '10', horas: '' })).toEqual({ ok: true, datos: null });
    expect(app.ajustes()).toMatchObject({ tc: 13, tcFecha: '2026-11-10', irregular: 150050, inflacion: 10, horas: 0 });
    expect(app.plan().patrimonio.total).toBe(antes + 120000 * 0.5);
    expect(app.guardarAjustes({ tc: '13', irregular: '0,125', inflacion: '10', horas: '' })).toEqual({ ok: false, codigo: 'mas-de-2-decimales' });
  });

  it('AJU-05: el color elegido se guarda en Ajustes; uno que no es de los cuatro no cambia nada', () => {
    const { app, almacen } = appDePrueba();
    app.elegirColor('rosa');
    expect(app.estado().color).toBe('rosa');
    expect(almacen.escrituras).toEqual(['PUT ajustes']);
    app.elegirColor('verde');
    expect(app.estado().color).toBe('rosa');
  });

  it('AJU-05: en el ejemplo el color cambia pero no se guarda nada', () => {
    const { app, almacen } = appDePrueba(null);
    app.elegirColor('cielo');
    expect(app.estado()).toMatchObject({ ejemplo: true, color: 'cielo' });
    expect(almacen.escrituras).toEqual([]);
  });
});

describe('empezar con mis datos (DAT-01, DAT-02)', () => {
  it('Efectivo 650, Banco 3550, sueldo 8000 al Banco el 25 y renta 2500 el 5: dos cuentas, dos fijos y el libre hasta el 25', () => {
    const { app, almacen } = appDePrueba(null);
    expect(app.estado().ejemplo).toBe(true);
    const r = app.empezar({
      cuentas: [{ nombre: 'Efectivo', moneda: 'BOB', saldo: '650' }, { nombre: 'Banco', moneda: 'BOB', saldo: '3550' }],
      ingreso: '8000', diaIngreso: '25', cuentaIngreso: '2', irregular: '0',
      gastos: [{ nombre: 'Renta', dia: '5', monto: '2500' }, { nombre: '', dia: '', monto: '' }],
    });
    expect(r).toEqual({ ok: true, datos: null });
    expect(app.estado().ejemplo).toBe(false);
    expect(almacen.escrituras).toEqual(['PUT datos']);
    const d = almacen.documentos.datos as Datos;
    expect(d.main!.aj).toMatchObject({ empezado: true, irregular: 0 });
    expect(d.cols.cuentas.map((c) => [c.nombre, c.saldoInicial])).toEqual([['Efectivo', 65000], ['Banco', 355000]]);
    const banco = d.cols.cuentas[1]!.id;
    expect(d.cols.fijos.map((f) => [f.nombre, f.tipo, f.monto, f.dia, f.cuentaId === banco])).toEqual([['Sueldo', 'ingreso', 800000, 25, true], ['Renta', 'gasto', 250000, 5, true]]);
    expect(d.cols.categorias).toHaveLength(16);
    expect(app.rumbo({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 }).hoyBloque.prox).toEqual({ nombre: 'Sueldo', fecha: '2026-11-25' });
  });

  it('sin ninguna cuenta no empieza y no guarda nada', () => {
    const { app, almacen } = appDePrueba(null);
    expect(app.empezar({ cuentas: [{ nombre: ' ', moneda: 'BOB', saldo: '1' }], ingreso: '', diaIngreso: '', cuentaIngreso: '', irregular: '', gastos: [] })).toEqual({ ok: false, codigo: 'falta-cuenta' });
    expect(almacen.escrituras).toEqual([]);
    expect(app.estado().ejemplo).toBe(true);
  });
});

describe('respaldo (DAT-04) y borrar todo (DAT-06)', () => {
  it('el respaldo es versión 2 en centavos y se carga de vuelta igual', () => {
    const { app } = appDePrueba();
    const r = app.respaldo()!;
    expect(r.nombre).toBe('rumbo-respaldo-2026-11-10.json');
    const o = JSON.parse(r.contenido);
    expect(o).toMatchObject({ app: 'rumbo', version: 2, fecha: '2026-11-10' });
    expect(o.datos.cuentas[1]).toMatchObject({ nombre: 'Banco', saldoInicial: 355000 });
    const otra = appDePrueba(null);
    expect(otra.app.leerRespaldo(r.contenido)).toEqual({ ok: true, datos: { cuentas: 3, movs: 1, fijos: 2, deudas: 0, metas: 0, fecha: '2026-11-10', version: 2 } });
    expect(otra.almacen.escrituras).toEqual([]); // nothing changes before confirming
    expect(otra.app.cargarRespaldo()).toEqual({ ok: true, datos: null });
    expect(otra.almacen.escrituras).toEqual(['PUT datos']);
    expect(otra.app.plan()).toEqual(app.plan());
  });

  it('un respaldo de la v1 con Banco en 3550,5 y un gasto de 35 se pasa a centavos: 355050 y 3500', () => {
    const { app, almacen } = appDePrueba(null);
    const v1 = {
      app: 'rumbo', version: 1, fecha: '2026-11-01',
      datos: {
        aj: { tc: 12.5, tcFecha: '2026-11-01', inflacion: 8, irregular: 1500, horas: 160, empezado: true, color: 'rosa' },
        cuentas: [{ id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550.5, rendimiento: 2, diaADia: true, archivada: false }],
        categorias: [{ id: 'comida', nombre: 'Comida fuera', tipo: 'gasto', tope: 1000, color: '#E0703A', icono: 'comida' }],
        movs: [{ id: 'g', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 35, fecha: '2026-11-02', nota: 'Almuerzo' }],
        fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [],
      },
    };
    expect(app.leerRespaldo(JSON.stringify(v1))).toMatchObject({ ok: true, datos: { cuentas: 1, movs: 1, version: 1 } });
    app.cargarRespaldo();
    const d = almacen.documentos.datos as Datos;
    expect(d.cols.cuentas[0]).toMatchObject({ saldoInicial: 355050, rendimiento: 2 });
    expect(d.cols.movs[0]).toMatchObject({ monto: 3500 });
    expect(d.cols.categorias[0]).toMatchObject({ tope: 100000 });
    expect(d.main!.aj).toMatchObject({ irregular: 150000, tc: 12.5, color: 'rosa', empezado: true });
    expect(app.plan().cuentas[0]!.saldo).toBe(355050 - 3500);
    expect(app.estado().color).toBe('rosa'); // AJU-05: the color comes back with the backup
  });

  it('un respaldo de la v1 con un gasto de 12,555 no carga nada y dice cuál es', () => {
    const { app, almacen } = appDePrueba();
    const v1 = { app: 'rumbo', version: 1, datos: { aj: {}, cuentas: [], movs: [{ id: 'raro', tipo: 'gasto', cuentaId: 'bn', categoriaId: 'comida', monto: 12.555, fecha: '2026-11-02', nota: 'Taxi' }] } };
    expect(app.leerRespaldo(JSON.stringify(v1))).toEqual({ ok: false, error: { codigo: 'mas-de-2-decimales', coleccion: 'movs', nombre: 'Taxi', fecha: '2026-11-02' } });
    expect(app.cargarRespaldo()).toEqual({ ok: false, codigo: 'sin-respaldo' });
    expect(almacen.escrituras).toEqual([]);
  });

  it('un archivo que no es un respaldo de Rumbo, o uno con un monto decimal en la versión 2, no cambia nada', () => {
    const { app, almacen } = appDePrueba();
    expect(app.leerRespaldo('hola')).toEqual({ ok: false, error: { codigo: 'no-es-respaldo' } });
    expect(app.leerRespaldo(JSON.stringify({ app: 'otra', version: 1, datos: { cuentas: [] } }))).toEqual({ ok: false, error: { codigo: 'no-es-respaldo' } });
    const v2 = { app: 'rumbo', version: 2, datos: { aj: {}, cuentas: [{ id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550.5 }] } };
    expect(app.leerRespaldo(JSON.stringify(v2))).toEqual({ ok: false, error: { codigo: 'no-es-respaldo' } });
    expect(almacen.escrituras).toEqual([]);
  });

  it('DAT-06: borrar todo vuelve al ejemplo; en el ejemplo no hay respaldo que descargar', () => {
    const { app, almacen } = appDePrueba();
    app.borrarTodo();
    expect(almacen.escrituras).toEqual(['DELETE datos']);
    expect(app.estado().ejemplo).toBe(true);
    expect(app.respaldo()).toBeNull();
    app.anotar({ id: 'x', tipo: 'gasto', cuentaId: app.formulario()!.borrador.cuentaId, cuentaDestinoId: null, categoriaId: 'comida', monto: '5', montoDestino: '', nota: '', fecha: '2026-11-10', usarTc: false });
    expect(almacen.escrituras).toEqual(['DELETE datos']); // DAT-01: the example is never saved
  });
});

describe('Desglose (DES-01, DES-02, DES-05, DES-06)', () => {
  it('DES-05: el total de cada categoría del Desglose es el de Movimientos con esa categoría', () => {
    const { app } = appDePrueba(conDeudas());
    app.pagar({ deudaId: 'banco', tipo: 'pago', cuentaId: 'bn', monto: '900', fecha: '2026-11-10', esCuota: true });
    const D = app.desglose('2026-11');
    expect(D.categorias.length).toBeGreaterThan(1);
    for (const k of D.categorias) {
      expect(app.movimientos({ mes: '2026-11', cuenta: 'todas', categoria: k.categoria.id }).categoria!.total).toBe(k.total);
    }
    expect(D.salio).toBe(D.categorias.reduce((t, k) => t + k.total, 0));
  });

  it('DES-06: los ingresos del mes por categoría, de mayor a menor, con su de cada 100 y el total de Movimientos', () => {
    const { app } = appDePrueba();
    const ingreso = (id: string, categoriaId: string, monto: string) =>
      app.anotar({ id, tipo: 'ingreso', cuentaId: 'bn', cuentaDestinoId: null, categoriaId, monto, montoDestino: '', nota: '', fecha: '2026-11-10', usarTc: false });
    ingreso('a', 'extra', '800');
    ingreso('b', 'sueldo', '9000');
    const D = app.desglose('2026-11');
    expect(D.ingresos.map((l) => [l.categoria.id, l.total, Math.round(l.deCada100)])).toEqual([['sueldo', 900000, 92], ['extra', 80000, 8]]);
    expect(D.entro).toBe(D.ingresos.reduce((t, l) => t + l.total, 0));
    for (const l of D.ingresos) {
      expect(app.movimientos({ mes: '2026-11', cuenta: 'todas', categoria: l.categoria.id }).categoria!.total).toBe(l.total);
    }
    expect(app.desglose('2026-10').ingresos).toEqual([]);
  });

  it('DES-02: de cada 100 y las horas de trabajo; sin horas en Ajustes no las muestra', () => {
    const { app } = appDePrueba();
    app.anotar({ id: 'i', tipo: 'ingreso', cuentaId: 'bn', cuentaDestinoId: null, categoriaId: 'sueldo', monto: '1600', montoDestino: '', nota: '', fecha: '2026-11-10', usarTc: false });
    const k = app.desglose('2026-11').categorias.find((x) => x.categoria.id === 'comida')!;
    expect(k).toMatchObject({ total: 3500, horas: 4 });
    expect(k.deCada100).toBeCloseTo(2.1875);
    expect(app.desglose('2026-11').porHora).toBe(1000);
    app.guardarAjustes({ tc: '12,5', irregular: '0', inflacion: '8', horas: '' });
    expect(app.desglose('2026-11').categorias.find((x) => x.categoria.id === 'comida')!.horas).toBeNull();
  });
});
