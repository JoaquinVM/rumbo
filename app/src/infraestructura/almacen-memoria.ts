// Layer 4 · Infrastructure: data in memory, for the tests and to try the screens. Writes are kept in order.
import type { Datos, EstadoGuardado } from '@rumbo/contratos';
import type { Almacen } from '../aplicacion/puertos';

export interface AlmacenMemoria extends Almacen {
  escrituras: string[]; // «PUT movs/abc», «DELETE ocurrencias/x», «PUT ajustes»
}

export function almacenMemoria(datos: Datos | null = null): AlmacenMemoria {
  const escrituras: string[] = [];
  const quieto: EstadoGuardado = { pendientes: 0, sesionVencida: false, perdido: null, sinRespuesta: false, noAbrio: false };
  return {
    origen: 'memoria',
    escrituras,
    iniciar: (o) => o.alCargar(datos),
    escribir: (c, doc) => { escrituras.push(`PUT ${c}/${doc.id}`); },
    borrar: (c, id) => { escrituras.push(`DELETE ${c}/${id}`); },
    guardarAjustes: () => { escrituras.push('PUT ajustes'); },
    estado: () => quieto,
    suscribir: () => () => {},
  };
}
