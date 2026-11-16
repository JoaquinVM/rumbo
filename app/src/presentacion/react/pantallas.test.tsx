// @vitest-environment jsdom
// 4.2 and 4.3 · The screens with the app on a memory store: Rumbo with Hoy and Por confirmar, anotar a gasto with the
// balance of each account in 2 decimals, Movimientos by category, and the saving notices of DAT-07.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App, EstadoGuardado } from '@rumbo/contratos';
import { appDePrueba } from '../../composicion/prueba';
import { Inicio } from './Inicio';

beforeEach(() => { window.scrollTo = vi.fn() as never; location.hash = ''; });
afterEach(cleanup);

describe('pantalla Rumbo (PAN-02)', () => {
  it('muestra el titular, Hoy y Por confirmar, y confirma la Luz', async () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^A este ritmo, en 5 años tendrás Bs [\d.]+\.$/);
    const hoy = screen.getByRole('region', { name: 'Hoy' });
    expect(within(hoy).getByText('hasta tu sueldo del 25')).toBeTruthy();
    expect(within(hoy).getByText('por 15 días', { exact: false })).toBeTruthy();
    const pc = screen.getByRole('region', { name: 'Por confirmar' });
    expect(within(pc).getByText('venció el 8')).toBeTruthy();
    fireEvent.click(within(pc).getByRole('button', { name: 'Confirmar' }));
    expect(document.querySelector('.toast')?.textContent).toBe('Luz confirmado');
    expect(screen.queryByRole('region', { name: 'Por confirmar' })).toBeNull();
    expect(almacen.escrituras).toEqual(['PUT movs/m_luz_2026-11', 'PUT ocurrencias/luz_2026-11']);
  });

  it('«¿Y si…?» dibuja la línea verde y dice cuánto tendrías', () => {
    const { app } = appDePrueba();
    render(<Inicio app={app} />);
    fireEvent.change(screen.getByLabelText('Ingreso extra al mes'), { target: { value: '1000' } });
    expect(screen.getByText('Con tus ajustes')).toBeTruthy();
    expect(screen.getByText(/frente a seguir igual/).textContent).toMatch(/\+Bs [\d.]+ frente a seguir igual\./);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar ajustes' }));
    expect(screen.queryByText('Con tus ajustes')).toBeNull();
  });
});

describe('anotar (MOV-01, FMT-02)', () => {
  it('anota un gasto con el saldo de cada cuenta en dos decimales', async () => {
    const { app, almacen } = appDePrueba();
    render(<Inicio app={app} />);
    fireEvent.click(screen.getByRole('button', { name: 'Anotar' }));
    const hoja = screen.getByRole('dialog');
    expect(within(hoja).getByRole('button', { name: 'Efectivo · Bs 615,00' })).toBeTruthy();
    expect(within(hoja).getByRole('button', { name: 'Dólares · US$ 1.200,00' })).toBeTruthy();
    fireEvent.change(within(hoja).getByLabelText('Monto'), { target: { value: '0,125' } });
    fireEvent.click(within(hoja).getByRole('button', { name: 'Guardar' }));
    expect(document.querySelector('.toast')?.textContent).toBe('Usa hasta 2 decimales');
    fireEvent.change(within(hoja).getByLabelText('Monto'), { target: { value: '35' } });
    fireEvent.click(within(hoja).getByRole('button', { name: 'Guardar' }));
    expect(document.querySelector('.toast')?.textContent).toBe('Gasto anotado');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(almacen.escrituras).toEqual([expect.stringMatching(/^PUT movs\/nuevo\d$/)]);
  });
});

describe('Movimientos (MOV-04, MOV-07)', () => {
  it('elige Comida fuera, muestra su total y se quita con la ✕', async () => {
    const { app } = appDePrueba();
    app.anotar({ id: 'taxi', tipo: 'gasto', cuentaId: 'ef', cuentaDestinoId: null, categoriaId: 'transporte', monto: '20', montoDestino: '', nota: 'Taxi', fecha: '2026-11-10', usarTc: false });
    render(<Inicio app={app} />);
    await act(async () => { location.hash = '#movimientos'; dispatchEvent(new HashChangeEvent('hashchange')); });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Noviembre de 2026');
    expect(screen.getByText('Taxi')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Categoría: Todas ▾' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Comida fuera' }));
    expect(screen.getByText('1 movimiento en noviembre')).toBeTruthy();
    expect(screen.queryByText('Taxi')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar el filtro Comida fuera' }));
    expect(screen.getByText('Taxi')).toBeTruthy();
  });
});

describe('avisos del guardado (DAT-07)', () => {
  const con = (g: Partial<EstadoGuardado>): App => {
    const { app } = appDePrueba();
    const base = app.estado.bind(app);
    return { ...app, estado: () => ({ ...base(), guardado: { ...base().guardado, ...g } }) };
  };
  it('sin señal dice que hay cambios sin guardar', () => {
    render(<Inicio app={con({ pendientes: 2 })} />);
    expect(screen.getByText('Hay cambios sin guardar.')).toBeTruthy();
  });
  it('con la sesión vencida pide entrar en otra pestaña', () => {
    render(<Inicio app={con({ pendientes: 1, sesionVencida: true })} />);
    expect(screen.getByRole('link', { name: 'Vuelve a entrar en otra pestaña' }).getAttribute('target')).toBe('_blank');
  });
});
