// Layer 6 · Composition: the only place that wires everything together. Nobody imports it. It picks where the data
// lives (DAT-03), like the v1: the artifact's base inside the artifact; Rumbo's server when the page says where its API
// is (the server serves it); and otherwise only this browser.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { crearApp } from '../aplicacion/app';
import type { Almacen } from '../aplicacion/puertos';
import { almacenArtifact, type BaseArtifact } from '../infraestructura/almacen-artifact';
import { almacenNavegador } from '../infraestructura/almacen-navegador';
import { almacenServidor } from '../infraestructura/almacen-servidor';
import { idsAlAzar, preferenciasDelNavegador, relojDelSistema } from '../infraestructura/preferencias';
import { Inicio } from '../presentacion/react/Inicio';
import '../presentacion/react/estilos.css';

// Safari ignores touch-action for pinch in some cases: block its gesture events too (decision 42)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

interface Claude { use(n: string): Promise<unknown> }

async function elegirAlmacen(): Promise<Almacen> {
  const claude = (globalThis as { claude?: Claude }).claude;
  try {
    if (claude?.use) {
      const [db, usuario] = (await Promise.all([claude.use('db'), claude.use('user')])) as [BaseArtifact | null, { id(): Promise<string> } | null];
      const id = usuario ? await usuario.id() : null;
      if (db && id) return almacenArtifact(db, id);
    }
  } catch { /* not in the artifact */ }
  const api = document.querySelector('meta[name="rumbo-api"]')?.getAttribute('content');
  if (api && !import.meta.env.DEV) return almacenServidor(api);
  return almacenNavegador();
}

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta el elemento #raiz');
const app = crearApp({ almacen: await elegirAlmacen(), reloj: relojDelSistema, ids: idsAlAzar, preferencias: preferenciasDelNavegador() });
createRoot(raiz).render(
  <StrictMode>
    <Inicio app={app} />
  </StrictMode>,
);
