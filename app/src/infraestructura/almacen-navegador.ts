// Layer 4 · Infrastructure: only this browser (DAT-03), when Rumbo is neither on its server nor in the artifact. It
// saves everything at once in localStorage. The v1 used the key `rumbo-v2` with decimal amounts; Rumbo 2 uses its own
// key in cents, and the first time it converts the v1's data with the migration's function (DAT-08). If that data
// has an amount it cannot convert, it is left as it was.
import type { Datos, EstadoGuardado } from '@rumbo/contratos';
import { COLECCIONES, v1ACentavos } from '@rumbo/dominio';
import type { Almacen } from '../aplicacion/puertos';

export const CLAVE = 'rumbo-2-centavos';
export const CLAVE_V1 = 'rumbo-v2';

type Guardado = Record<string, unknown> & { aj?: Record<string, unknown> };

function leerClave(ls: Storage, clave: string): Guardado | null {
  try { return JSON.parse(ls.getItem(clave) ?? 'null') as Guardado | null; } catch { return null; }
}

export function almacenNavegador(ls: Storage = localStorage): Almacen {
  let todo: () => Datos = () => ({ main: null, cols: {} as Datos['cols'] });
  const quieto: EstadoGuardado = { pendientes: 0, sesionVencida: false, perdido: null, sinRespuesta: false, noAbrio: false };
  const guardar = (): void => {
    const d = todo();
    try { ls.setItem(CLAVE, JSON.stringify({ aj: d.main?.aj, ...d.cols })); } catch { /* full or blocked */ }
  };

  function inicial(): Datos | null {
    let g = leerClave(ls, CLAVE);
    if (!g) {
      const v1 = leerClave(ls, CLAVE_V1);
      const conv = v1 ? v1ACentavos(v1 as never) : null;
      if (conv && conv.ok) {
        g = conv.datos as unknown as Guardado;
        try { ls.setItem(CLAVE, JSON.stringify(g)); } catch { /* full or blocked */ }
      }
    }
    if (!g || !g.aj) return null;
    const cols = Object.fromEntries(COLECCIONES.map((c) => [c, Array.isArray(g[c]) ? g[c] : []]));
    return { main: { aj: g.aj } as Datos['main'], cols: cols as Datos['cols'] };
  }

  return {
    origen: 'navegador',
    iniciar(o) { todo = o.todo; o.alCargar(inicial()); },
    escribir: guardar,
    borrar: guardar,
    guardarAjustes: guardar,
    reemplazar: (d) => {
      try { ls.setItem(CLAVE, JSON.stringify({ aj: d.main?.aj, ...d.cols })); } catch { /* full or blocked */ }
    },
    // An empty document, not a missing one: otherwise the next load would convert the v1's data again
    borrarTodo: () => { try { ls.setItem(CLAVE, '{}'); } catch { /* blocked */ } },
    estado: () => quieto,
    suscribir: () => () => {},
  };
}
