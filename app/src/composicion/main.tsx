// Layer 6 · Composition: the only place that wires everything together. Nobody imports it.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Inicio } from '../presentacion/react/Inicio';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta el elemento #raiz');
createRoot(raiz).render(
  <StrictMode>
    <Inicio />
  </StrictMode>,
);
