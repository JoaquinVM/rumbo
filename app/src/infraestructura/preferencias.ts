// Layer 4 · Infrastructure: what this device remembers (MOV-02: the last account used), the v1's `rumbo-ultima`.
import type { Ids, Preferencias, Reloj } from '../aplicacion/puertos';

export function preferenciasDelNavegador(ls: Storage | null = globalThis.localStorage ?? null): Preferencias {
  let ultima: string | null = null;
  try { ultima = ls?.getItem('rumbo-ultima') ?? null; } catch { /* blocked */ }
  return {
    ultimaCuenta: () => ultima,
    recordarCuenta: (id) => { ultima = id; try { ls?.setItem('rumbo-ultima', id); } catch { /* blocked */ } },
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');
export const relojDelSistema: Reloj = {
  hoy: () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; },
};

export const idsAlAzar: Ids = { nuevo: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7) };
