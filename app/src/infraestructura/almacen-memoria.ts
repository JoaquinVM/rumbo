// Layer 4 · Infrastructure: data in memory, for the tests and to try the screens. Writes are kept in order.
import type { Datos, EstadoGuardado } from '@rumbo/contratos';
import type { Almacen } from '../aplicacion/puertos';

export interface AlmacenMemoria extends Almacen {
  escrituras: string[]; // «PUT movs/abc», «DELETE ocurrencias/x», «PUT ajustes»
  documentos: Record<string, unknown>; // the last document written to each «col/id»
}

export function almacenMemoria(datos: Datos | null = null): AlmacenMemoria {
  const escrituras: string[] = [], documentos: Record<string, unknown> = {};
  const quieto: EstadoGuardado = { pendientes: 0, sesionVencida: false, perdido: null, sinRespuesta: false, noAbrio: false };
  return {
    origen: 'memoria',
    escrituras,
    documentos,
    iniciar: (o) => o.alCargar(datos),
    escribir: (c, doc) => { escrituras.push(`PUT ${c}/${doc.id}`); documentos[`${c}/${doc.id}`] = JSON.parse(JSON.stringify(doc)); },
    borrar: (c, id) => { escrituras.push(`DELETE ${c}/${id}`); },
    guardarAjustes: () => { escrituras.push('PUT ajustes'); },
    estado: () => quieto,
    suscribir: () => () => {},
  };
}
