// The words for each code the app answers with (design.md, Capas: the screen picks the text).
import type { ErrorAnotar, ErrorFijo } from '@rumbo/contratos';

const COMUNES: Record<string, string> = {
  'falta-monto': 'Escribe un monto',
  'mas-de-2-decimales': 'Usa hasta 2 decimales',
  'misma-cuenta': 'La cuenta de origen y la de destino deben ser distintas',
  'falta-monto-destino': 'Escribe cuánto recibiste',
  'falta-categoria': 'Elige una categoría',
  'falta-cuenta': 'Elige una cuenta',
  'ya-estaba': 'Ese fijo ya estaba resuelto',
};

// Anything else the shared contracts refused (DAT-09): nothing was saved and nothing is lost on the screen.
export const textoDeError = (codigo: ErrorAnotar | ErrorFijo | string): string =>
  COMUNES[codigo] ?? 'No se pudo guardar: revisa lo que escribiste.';
