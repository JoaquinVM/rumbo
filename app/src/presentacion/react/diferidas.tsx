// Layer 5 · Presentation: loading the deferred screens (pantallas-diferidas.ts). Until they arrive, nothing is drawn in their
// place (a moment, after the first tap); if the signal drops, they are asked for again.
import type { ReactNode } from 'react';
import type * as M from './pantallas-diferidas';

export type Diferidas = typeof M;
let modulo: Diferidas | null = null;
let pedido: Promise<Diferidas> | null = null;

export const cargarDiferidas = (): Promise<Diferidas> =>
  (pedido ??= import('./pantallas-diferidas').then((m) => (modulo = m), (e: unknown) => { pedido = null; throw e; }));

// Inside a <Suspense>: the module, or it waits for it.
export function Diferido({ con }: { con: (m: Diferidas) => ReactNode }) {
  if (!modulo) throw cargarDiferidas();
  return <>{con(modulo)}</>;
}
