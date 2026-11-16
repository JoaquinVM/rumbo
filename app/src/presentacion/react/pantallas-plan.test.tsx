// @vitest-environment jsdom
// 5.1 to 5.4 · The rest of the screens with the app on a memory store: the Desglose and a category to its movements,
// Plan with each balance in 2 decimals, the detail of a loan and of a goal, the categories, Ajustes with the color and
// the backup, starting with my data, and «Me deben una parte».
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Datos } from '@rumbo/contratos';
import { appDePrueba, datosDePrueba } from '../../composicion/prueba';
import { Inicio } from './Inicio';

// The hash goes back to empty before each test, and its hashchange (async in jsdom) arrives before the test starts
beforeEach(async () => { window.scrollTo = vi.fn() as never; location.hash = ''; await new Promise((r) => setTimeout(r, 0)); });
afterEach(cleanup);

const aviso = (): string | null | undefined => document.querySelector('.toast')?.textContent;
const ir = (hash: string): void => { location.hash = hash; fireEvent(window, new HashChangeEvent('hashchange')); };

function conPrestamoYMeta(): Datos {
  const d = datosDePrueba();
  const cols = d.cols as unknown as Record<string, unknown[]>;
  cols.deudas = [{ id: 'banco', tipo: 'prestamo', nombre: 'Préstamo del banco', moneda: 'BOB', saldoInicial: 1840000, interes: 14, cuota: 90000, dia: 20, desde: '2026-10-01', archivada: false }];
  cols.fijos = [...cols.fijos!, { id: 'cuota', nombre: 'Cuota del préstamo', tipo: 'gasto', monto: 90000, cuentaId: 'bn', categoriaId: 'intereses', dia: 20, deudaId: 'banco', desde: '2026-11', activo: true }];
  cols.metas = [{ id: 'fondo', nombre: 'Fondo de emergencia', monto: 1500000, mes: '2027-12', archivada: false }];
  cols.apartados = [{ id: 'a1', metaId: 'fondo', cuentaId: 'bn', monto: 100000, fecha: '2026-10-05' }];
  return d;
}

describe('Desglose (DES-01, DES-05)', () => {
  it('tocar Comida fuera abre Movimientos de ese mes con esa categoría, todas las cuentas y el mismo total', () => {
    const { app } = appDePrueba();
    render(<Inicio app={app} />);
    ir('#movimientos');
    fireEvent.click(screen.getByRole('button', { name: 'Efectivo' })); // a filter by account that DES-05 takes away
    ir('#desglose');
    const resumen = screen.getByRole('region', { name: 'Resumen del mes' });
    expect(within(resumen).getByText('Bs 35')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Comida fuera/ }));
    expect(location.hash).toBe('#movimientos');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(screen.getByRole('button', { name: 'Quitar el filtro Comida fuera' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Todas' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('−Bs 35,00', { selector: 'span[style]' })).toBeTruthy();
  });
});

describe('Plan (PAN-03, FMT-02)', () => {
  it('muestra el patrimonio primero y cada cuenta con su saldo en dos decimales y «Cuadrar»', () => {
    const { app } = appDePrueba();
    render(<Inicio app={app} />);
    ir('#plan');
    expect(screen.getByRole('region', { name: 'Patrimonio' }).textContent).toContain('Bs 19.165');
    expect(screen.getByText('Bs 615,00')).toBeTruthy();
    expect(screen.getByText('US$ 1.200,00')).toBeTruthy();
    expect(screen.getByText('≈ Bs 15.000')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Cuadrar' })).toHaveLength(3);
  });

  it('cuadrar Banco a 3.500 deja un ajuste y lo avisa', () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    ir('#plan');
    fireEvent.click(screen.getAllByRole('button', { name: 'Cuadrar' })[1]!);
    const hoja = screen.getByRole('dialog');
    expect(within(hoja).getByLabelText('Saldo real')).toHaveProperty('value', '3.550');
    fireEvent.change(within(hoja).getByLabelText('Saldo real'), { target: { value: '3.500' } });
    fireEvent.click(within(hoja).getByRole('button', { name: 'Cuadrar' }));
    expect(aviso()).toBe('Ajuste de −Bs 50,00 registrado');
    expect(almacen.escrituras).toEqual([expect.stringMatching(/^PUT movs\//)]);
    expect(screen.getByText('Bs 3.500,00')).toBeTruthy();
  });
});

describe('préstamo y meta (PAN-07, PAN-08)', () => {
  it('el préstamo: Bs 18.400 por pagar, terminas oct 2028, 3 próximas cuotas; pagar la cuota la separa en interés y capital', () => {
    const { app } = appDePrueba(conPrestamoYMeta());
    render(<Inicio app={app} />);
    ir('#plan');
    fireEvent.click(screen.getByRole('button', { name: /Préstamo del banco/ }));
    expect(screen.getByRole('region', { name: 'Por pagar' }).textContent).toContain('Bs 18.400');
    expect(screen.getByText('oct 2028')).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Próximas cuotas' })).getAllByRole('row')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar un pago' }));
    const hoja = screen.getByRole('dialog');
    expect(within(hoja).getByText('Interés Bs 214,67 (gasto) · capital Bs 685,33 (baja la deuda)')).toBeTruthy();
    expect(within(hoja).getByLabelText(/Es la cuota de nov 2026/)).toHaveProperty('checked', true);
    fireEvent.click(within(hoja).getByRole('button', { name: 'Guardar' }));
    expect(aviso()).toBe('Guardado');
    expect(screen.getByRole('region', { name: 'Por pagar' }).textContent).toContain('Bs 17.715');
  });

  it('la meta: Bs 1.000 de Bs 15.000; apartar más que el libre lo dice y apartar 300 lo hace', () => {
    const { app } = appDePrueba(conPrestamoYMeta());
    render(<Inicio app={app} />);
    ir('#plan');
    fireEvent.click(screen.getByRole('button', { name: /Fondo de emergencia/ }));
    const llevas = screen.getByRole('region', { name: 'Llevas' });
    expect(llevas.textContent).toContain('Bs 1.000');
    expect(llevas.textContent).toContain('de Bs 15.000');
    const ap = screen.getByRole('region', { name: 'Apartar' });
    fireEvent.click(within(ap).getByRole('button', { name: /^Banco · / }));
    fireEvent.change(within(ap).getByLabelText('Monto'), { target: { value: '100.000' } });
    fireEvent.click(within(ap).getByRole('button', { name: 'Apartar' }));
    expect(aviso()).toMatch(/^En Banco puedes apartar hasta Bs [\d.]+,\d\d$/);
    fireEvent.change(within(ap).getByLabelText('Monto'), { target: { value: '300' } });
    fireEvent.click(within(ap).getByRole('button', { name: 'Apartar' }));
    expect(aviso()).toBe('Apartado');
    expect(llevas.textContent).toContain('Bs 1.300');
  });
});

describe('categorías (PAN-09) y Ajustes (AJU-05, DAT-04, DAT-06)', () => {
  it('«16 categorías · 0 con tope» abre el editor y un tope nuevo se ve en Plan', () => {
    const { app } = appDePrueba();
    render(<Inicio app={app} />);
    ir('#plan');
    fireEvent.click(screen.getByRole('button', { name: /16 categorías · 0 con tope/ }));
    fireEvent.click(screen.getByRole('button', { name: /Súper/ }));
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Tope mensual (vacío = sin tope)'), { target: { value: '1400' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));
    expect(aviso()).toBe('Categoría guardada');
    expect(screen.getByText('Tope Bs 1.400 al mes')).toBeTruthy();
  });

  it('elegir Rosa pastel cambia el color al instante y se guarda', () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rosa pastel' }));
    expect(screen.getByRole('button', { name: 'Rosa pastel' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('tema')!.textContent).toContain('#F4A6C8');
    expect(almacen.escrituras).toEqual(['PUT ajustes']);
  });

  it('cargar un respaldo de la v1 muestra qué trae y reemplaza solo al confirmar', async () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    const v1 = { app: 'rumbo', version: 1, fecha: '2026-11-01', datos: { aj: { tc: 12.5 }, cuentas: [{ id: 'b', nombre: 'Banco', moneda: 'BOB', saldoInicial: 3550.5 }], movs: [], fijos: [] } };
    const archivo = new File([JSON.stringify(v1)], 'r.json', { type: 'application/json' });
    fireEvent.change(document.getElementById('cargarArchivo')!, { target: { files: [archivo] } });
    const bloque = await screen.findByRole('region', { name: 'Cargar respaldo' });
    expect(bloque.textContent).toContain('Trae 1 cuentas, 0 movimientos, 0 fijos, 0 deudas y 0 metas (del 1 nov)');
    expect(almacen.escrituras).toEqual([]);
    fireEvent.click(within(bloque).getByRole('button', { name: 'Reemplazar mis datos' }));
    expect(aviso()).toBe('Respaldo cargado');
    expect(almacen.escrituras).toEqual(['PUT datos']);
    ir('#plan');
    expect(screen.getByText('Bs 3.550,50')).toBeTruthy();
  });

  it('un archivo que no es de Rumbo no cambia nada; borrar todo pide un segundo toque', async () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes' }));
    fireEvent.change(document.getElementById('cargarArchivo')!, { target: { files: [new File(['hola'], 'x.txt')] } });
    expect(await screen.findByText('El archivo no es un respaldo de Rumbo.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Borrar todo' }));
    expect(almacen.escrituras).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Toca otra vez para borrar todo' }));
    expect(almacen.escrituras).toEqual(['DELETE datos']);
    expect(aviso()).toBe('Tus datos se borraron');
    expect(screen.getByText('Datos de ejemplo')).toBeTruthy();
  });
});

describe('empezar con mis datos (DAT-02) y me deben una parte (DEU-11)', () => {
  it('desde el ejemplo, empezar crea las cuentas y vuelve a Rumbo con el libre hasta el sueldo', () => {
    const { app, almacen } = appDePrueba(null);
    render(<Inicio app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Empezar con mis datos' }));
    const hoja = screen.getByRole('dialog');
    fireEvent.change(within(hoja).getByLabelText('Saldo hoy', { selector: '#e-cs0' }), { target: { value: '650' } });
    fireEvent.change(within(hoja).getByLabelText('Saldo hoy', { selector: '#e-cs1' }), { target: { value: '3550' } });
    fireEvent.change(within(hoja).getByLabelText('Monto al mes'), { target: { value: '8000' } });
    fireEvent.change(within(hoja).getByLabelText('Monto', { selector: '#e-gm0' }), { target: { value: '2500' } });
    fireEvent.click(within(hoja).getByRole('button', { name: 'Ver mi rumbo' }));
    expect(aviso()).toBe('Listo. Anota tus gastos con el botón +');
    expect(almacen.escrituras).toEqual(['PUT datos']);
    expect(screen.queryByText('Datos de ejemplo')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Hoy' })).getByText('hasta tu sueldo del 25')).toBeTruthy();
  });

  it('del almuerzo de 35, Amigo debe 20: el gasto queda en 15', () => {
    const { app } = appDePrueba();
    render(<Inicio app={app} />);
    ir('#movimientos');
    fireEvent.click(screen.getByRole('button', { name: /Almuerzo/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Me deben una parte' }));
    const hoja = screen.getByRole('dialog');
    fireEvent.change(within(hoja).getByLabelText('Cuánto te deben'), { target: { value: '20' } });
    fireEvent.change(within(hoja).getByLabelText('¿Quién te debe?'), { target: { value: 'Amigo' } });
    expect(within(hoja).getByText('Tu gasto queda en Bs 15,00 y Amigo te debe Bs 20,00 más. Tu cuenta no cambia.')).toBeTruthy();
    fireEvent.click(within(hoja).getByRole('button', { name: 'Guardar' }));
    expect(aviso()).toBe('Listo: Amigo te debe Bs 20,00 más');
    expect(screen.getByRole('button', { name: /Almuerzo.*−Bs 15,00/ })).toBeTruthy();
  });
});
