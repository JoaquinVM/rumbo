// 4.1 · The use cases of the first screens: anotar, editar, borrar, transferir, confirmar y saltar un fijo. Each one
// changes the state and queues its writes in order, after checking them with the shared contracts (DAT-09).
import { describe, expect, it } from 'vitest';
import type { BorradorMovimiento } from '@rumbo/contratos';
import { appDePrueba } from '../composicion/prueba';

const gasto = (b: Partial<BorradorMovimiento> = {}): BorradorMovimiento => ({
  id: 'g1', tipo: 'gasto', cuentaId: 'ef', cuentaDestinoId: null, categoriaId: 'comida', monto: '35', montoDestino: '', nota: ' Almuerzo ',
  fecha: '2026-11-10', usarTc: false, ...b,
});
const movs = (app: ReturnType<typeof appDePrueba>['app']) => app.movimientos({ mes: '2026-11', cuenta: 'todas', categoria: null }).dias.flatMap((d) => d.filas);

describe('anotar (MOV-01, MOV-02, FMT-03)', () => {
  it('anota un gasto de 35 desde Efectivo: se guarda en centavos y Efectivo baja 35', () => {
    const { app, almacen } = appDePrueba();
    expect(app.anotar(gasto())).toEqual({ ok: true, datos: { aviso: 'gasto' } });
    expect(almacen.escrituras).toEqual(['PUT movs/g1']);
    expect(movs(app).find((m) => m.id === 'g1')).toMatchObject({ monto: 3500, nota: 'Almuerzo', categoria: { id: 'comida' } });
    expect(app.formulario()!.cuentas.find((c) => c.id === 'ef')!.saldo).toBe(65000 - 3500 - 3500);
  });

  it('el formulario abre con la última cuenta usada y la categoría más usada primero', () => {
    const { app } = appDePrueba();
    app.anotar(gasto({ cuentaId: 'bn' }));
    const f = app.formulario()!;
    expect(f.borrador).toMatchObject({ cuentaId: 'bn', categoriaId: 'comida', tipo: 'gasto', fecha: '2026-11-10' });
    expect(app.notasSugeridas('comida')).toEqual(['Almuerzo']);
  });

  it('no guarda más de 2 decimales, un monto vacío ni un gasto sin categoría', () => {
    const { app, almacen } = appDePrueba();
    expect(app.anotar(gasto({ monto: '0,125' }))).toEqual({ ok: false, codigo: 'mas-de-2-decimales' });
    expect(app.anotar(gasto({ monto: '' }))).toEqual({ ok: false, codigo: 'falta-monto' });
    expect(app.anotar(gasto({ categoriaId: null }))).toEqual({ ok: false, codigo: 'falta-categoria' });
    expect(app.anotar(gasto({ fecha: '10/11/2026' }))).toEqual({ ok: false, codigo: 'fecha-invalida' }); // the contracts say no
    expect(almacen.escrituras).toEqual([]);
  });

  it('editar conserva el fijo y el tipo de cambio guardados, y avisa «Guardado»', () => {
    const { app, almacen } = appDePrueba();
    app.confirmarFijo('luz_2026-11', '180');
    const f = app.formulario('m_luz_2026-11')!;
    expect(f.editando).toBe(true);
    expect(f.borrador.monto).toBe('180');
    expect(app.anotar({ ...f.borrador, monto: '185,50' })).toEqual({ ok: true, datos: { aviso: 'guardado' } });
    expect(movs(app).find((m) => m.id === 'm_luz_2026-11')).toMatchObject({ monto: 18550, fijo: true });
    expect(almacen.escrituras.at(-1)).toBe('PUT movs/m_luz_2026-11');
  });

  it('CTA-07: un gasto de antes de abrir la cuenta lo dice', () => {
    const { app } = appDePrueba();
    expect(app.anotar(gasto({ fecha: '2026-10-20' }))).toEqual({ ok: true, datos: { aviso: 'antes-de-abrir', cuenta: 'Efectivo' } });
  });

  it('MOV-05: el aviso del tope cuando llega al 80 %', () => {
    const { app } = appDePrueba();
    expect(app.avisoTope(gasto({ monto: '900' }))).toBeNull(); // Comida fuera has no limit yet
  });
});

describe('transferir (MOV-03, MOV-06, CTA-06)', () => {
  const transferencia = (b: Partial<BorradorMovimiento> = {}): BorradorMovimiento =>
    gasto({ id: 't1', tipo: 'transferencia', cuentaId: 'bn', cuentaDestinoId: 'us', categoriaId: null, monto: '1.250', montoDestino: '100', nota: '', ...b });

  it('Bs 1.250 de Banco a Dólares y llegan US$ 100: guarda los dos montos, el tipo de cambio del día y no es gasto', () => {
    const { app } = appDePrueba();
    expect(app.tipoDeCambio(transferencia())).toBe(12.5);
    expect(app.anotar(transferencia())).toEqual({ ok: true, datos: { aviso: 'transferencia' } });
    const t = movs(app).find((m) => m.id === 't1')!;
    expect([t.monto, t.montoDestino]).toEqual([125000, 10000]);
    expect(app.movimientos({ mes: '2026-11', cuenta: 'todas', categoria: null }).salio).toBe(3500);
  });

  it('usar ese cambio como tipo de cambio lo guarda en los Ajustes', () => {
    const { app, almacen } = appDePrueba();
    app.anotar(transferencia({ monto: '1.300', usarTc: true }));
    expect(almacen.escrituras).toEqual(['PUT movs/t1', 'PUT ajustes']);
    expect(app.rumbo({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 }).tcFijo).toBe(13);
  });

  it('la misma cuenta no se puede, y entre monedas pide lo que llegó', () => {
    const { app, almacen } = appDePrueba();
    expect(app.anotar(transferencia({ cuentaDestinoId: 'bn' }))).toEqual({ ok: false, codigo: 'misma-cuenta' });
    expect(app.anotar(transferencia({ montoDestino: '' }))).toEqual({ ok: false, codigo: 'falta-monto-destino' });
    expect(almacen.escrituras).toEqual([]);
  });
});

describe('borrar, confirmar y saltar (MOV-04, FIJ-02, DEU-08)', () => {
  it('confirmar la Luz escribe el gasto y después el mes; borrar el gasto vuelve a pedirla', () => {
    const { app, almacen } = appDePrueba();
    const v = () => app.rumbo({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 });
    expect(v().porConfirmar.map((p) => p.clave)).toEqual(['luz_2026-11']);
    expect(app.confirmarFijo('luz_2026-11', '')).toEqual({ ok: false, codigo: 'falta-monto' });
    expect(app.confirmarFijo('luz_2026-11', '180')).toEqual({ ok: true, datos: { nombre: 'Luz' } });
    expect(almacen.escrituras).toEqual(['PUT movs/m_luz_2026-11', 'PUT ocurrencias/luz_2026-11']);
    expect(v().porConfirmar).toEqual([]);
    expect(app.confirmarFijo('luz_2026-11', '180')).toEqual({ ok: false, codigo: 'ya-estaba' });
    app.borrarMovimiento('m_luz_2026-11');
    expect(almacen.escrituras.slice(2)).toEqual(['DELETE movs/m_luz_2026-11', 'DELETE ocurrencias/luz_2026-11']);
    expect(v().porConfirmar.map((p) => p.clave)).toEqual(['luz_2026-11']);
  });

  it('saltar la Luz no crea un gasto, solo el mes saltado', () => {
    const { app, almacen } = appDePrueba();
    expect(app.saltarFijo('luz_2026-11').ok).toBe(true);
    expect(almacen.escrituras).toEqual(['PUT ocurrencias/luz_2026-11']);
  });
});

describe('el ejemplo (DAT-01)', () => {
  it('sin datos guardados se ve el ejemplo, se puede anotar y nada se guarda', () => {
    const { app, almacen } = appDePrueba(null);
    expect(app.estado()).toMatchObject({ cargado: true, ejemplo: true });
    const f = app.formulario()!;
    expect(app.anotar({ ...f.borrador, monto: '20' }).ok).toBe(true);
    const k = app.rumbo({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 }).porConfirmar[0]!.clave;
    app.confirmarFijo(k, '180');
    expect(almacen.escrituras).toEqual([]);
  });
});
