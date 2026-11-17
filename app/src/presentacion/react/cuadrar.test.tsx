// @vitest-environment jsdom
// CTA-03 and FMT-02 · «Cuadrar» starts from the same balance Plan shows, with its cents and its sign: in the v1, Plan
// showed it rounded and the field lost the minus, so squaring without changing anything wrote an adjustment.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Datos } from '@rumbo/contratos';
import { appDePrueba, datosDePrueba } from '../../composicion/prueba';
import { cargarDiferidas } from './diferidas';
import { Inicio } from './Inicio';

beforeAll(async () => { await cargarDiferidas(); });
beforeEach(async () => { window.scrollTo = vi.fn() as never; location.hash = '#plan'; await new Promise((r) => setTimeout(r, 0)); });
afterEach(cleanup);

function con(cuentas: { id: string; nombre: string; moneda: 'BOB' | 'USD'; saldoInicial: number }[]): Datos {
  const d = datosDePrueba();
  (d.cols as unknown as Record<string, unknown[]>).cuentas = cuentas.map((c) => ({ ...c, rendimiento: 0, diaADia: c.moneda === 'BOB', archivada: false }));
  (d.cols as unknown as Record<string, unknown[]>).movs = [];
  (d.cols as unknown as Record<string, unknown[]>).fijos = [];
  return d;
}

describe('CTA-03: cuadrar parte del mismo saldo que Plan', () => {
  it.each([
    ['con centavos', 'BOB', 123456, 'Bs 1.234,56', '1.234,56'],
    ['negativo', 'BOB', -1234, '−Bs 12,34', '-12,34'],
    ['negativo entero', 'BOB', -50000, '−Bs 500,00', '-500'],
    ['en dólares', 'USD', 120025, 'US$ 1.200,25', '1.200,25'],
  ] as const)('%s', (_, moneda, saldo, texto, campo) => {
    const { app, almacen } = appDePrueba(con([{ id: 'c', nombre: 'Cuenta', moneda, saldoInicial: saldo }]));
    render(<Inicio app={app} />);
    expect(screen.getByText(texto)).toBeTruthy(); // Plan
    fireEvent.click(screen.getByRole('button', { name: 'Cuadrar' }));
    const hoja = screen.getByRole('dialog');
    expect(hoja.textContent).toContain(`Rumbo calcula ${texto}.`);
    expect(within(hoja).getByLabelText('Saldo real')).toHaveProperty('value', campo);
    fireEvent.click(within(hoja).getByRole('button', { name: 'Cuadrar' }));
    expect(document.querySelector('.toast')?.textContent).toBe('Ya estaba cuadrada');
    expect(almacen.escrituras).toEqual([]);
  });
});
