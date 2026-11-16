// Layer 2 · Application: what the use cases need from outside, as ports. The infrastructure implements them.
import type { CodigoError, Datos, EstadoGuardado, OrigenDatos } from '@rumbo/contratos';
import type { Ajustes, Dia } from '@rumbo/dominio';

export type Coleccion = 'cuentas' | 'categorias' | 'movs' | 'fijos' | 'ocurrencias' | 'deudas' | 'metas' | 'apartados';

// Where the data lives (DAT-03): Rumbo's server (with the DAT-07 queue), the artifact's base, this browser or memory.
// Writes go out in the order they are made; the store says how saving goes through `estado` and `suscribir`.
export interface Almacen {
  readonly origen: OrigenDatos;
  // Starts loading. `alCargar` gets the person's data (null: nothing saved yet) every time fresh data arrives;
  // `todo` gives the current state, for the stores that save everything at once.
  iniciar(o: { alCargar: (d: Datos | null) => void; todo: () => Datos }): void;
  escribir(col: Coleccion, doc: { id: string }): void;
  borrar(col: Coleccion, id: string): void;
  guardarAjustes(aj: () => Ajustes): void;
  estado(): EstadoGuardado;
  suscribir(alCambiar: () => void): () => void;
}

export interface Reloj {
  hoy(): Dia; // the local date
}

export interface Ids {
  nuevo(): string;
}

// What this device remembers for convenience (MOV-02: the last account used).
export interface Preferencias {
  ultimaCuenta(): string | null;
  recordarCuenta(id: string): void;
}

// DAT-09: the shared contracts' check of a document. The composition loads it after the first screen is drawn (it
// carries Zod); until it arrives nothing is written.
export type Validador = (col: Coleccion, doc: unknown) => { ok: true } | { ok: false; codigo: CodigoError };
