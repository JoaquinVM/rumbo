// Layer 4 · Infrastructure: the artifact's base (window.claude), as the v1 used it. Rumbo 2 keeps its data in cents
// under its own document (`rumbo2`), so it never reads the v1's decimals as cents. The artifact is no longer used for
// Rumbo (decision 52); this store stays so the page works there too.
import type { Datos, EstadoGuardado } from '@rumbo/contratos';
import { COLECCIONES } from '@rumbo/dominio';
import type { Almacen } from '../aplicacion/puertos';

interface Instantanea { exists: boolean; data(): unknown }
interface Consulta { docs: { id: string; data(): unknown }[] }
interface RefDoc {
  set(d: unknown): Promise<unknown>;
  delete(): Promise<unknown>;
  onSnapshot(ok: (s: Instantanea) => void, mal: () => void): unknown;
  collection(n: string): RefColeccion;
}
interface RefColeccion {
  doc(id: string): { set(d: unknown): Promise<unknown>; delete(): Promise<unknown> };
  onSnapshot(ok: (q: Consulta) => void, mal: () => void): unknown;
}
export interface BaseArtifact { doc(ruta: string): RefDoc }

export function almacenArtifact(db: BaseArtifact, usuario: string, alFallar: () => void = () => {}): Almacen {
  const principal = db.doc(`data/users/${usuario}/rumbo2`);
  const refs = Object.fromEntries(COLECCIONES.map((c) => [c, principal.collection(c)])) as Record<string, RefColeccion>;
  let noAbrio = false;
  const oyentes = new Set<() => void>();
  const avisar = (): void => { for (const f of [...oyentes]) f(); };
  const fallo = (): void => { alFallar(); };
  const limpio = (o: unknown): unknown => JSON.parse(JSON.stringify(o));
  let cadena: Promise<unknown> = Promise.resolve(), pendienteAj = false;
  const remoto: Record<string, unknown> = {};
  const enCadena = (f: () => Promise<void>): void => { cadena = cadena.then(f, f); };
  const idsDe = (c: string): string[] => ((remoto[c] as { id: string }[] | undefined) ?? []).map((d) => d.id);

  return {
    origen: 'artifact',
    iniciar(o) {
      const vistos = new Set<string>();
      let cargado = false;
      const juntar = (): void => {
        if (vistos.size < COLECCIONES.length + 1) return;
        cargado = true;
        const main = remoto.main as Datos['main'] | undefined;
        o.alCargar(main && main.aj ? { main, cols: Object.fromEntries(COLECCIONES.map((c) => [c, remoto[c] ?? []])) as Datos['cols'] } : null);
      };
      const mal = (): void => { if (!cargado) { cargado = true; noAbrio = true; o.alCargar(null); avisar(); } };
      principal.onSnapshot((s) => { remoto.main = s.exists ? s.data() : null; vistos.add('main'); juntar(); }, mal);
      for (const c of COLECCIONES) {
        refs[c]!.onSnapshot((q) => { remoto[c] = q.docs.map((d) => ({ ...(d.data() as object), id: d.id })); vistos.add(c); juntar(); }, mal);
      }
    },
    escribir: (c, doc) => { refs[c]!.doc(doc.id).set(limpio(doc)).catch(fallo); },
    borrar: (c, id) => { refs[c]!.doc(id).delete().catch(fallo); },
    guardarAjustes(aj) {
      if (pendienteAj) return;
      pendienteAj = true;
      cadena = cadena.then(async () => { pendienteAj = false; try { await principal.set({ aj: limpio(aj()) }); } catch { fallo(); } });
    },
    // The v1's reemplazar: without going through «empty», it deletes only what is left over, writes the new and the main last
    reemplazar(d) {
      enCadena(async () => {
        for (const c of COLECCIONES) {
          const quedan = new Set(d.cols[c].map((x) => x.id));
          for (const id of idsDe(c)) if (!quedan.has(id)) await refs[c]!.doc(id).delete().catch(() => undefined);
        }
        for (const c of COLECCIONES) for (const x of d.cols[c]) await refs[c]!.doc(x.id).set(limpio(x)).catch(fallo);
        await principal.set({ aj: limpio(d.main?.aj) }).catch(fallo);
      });
    },
    borrarTodo() {
      enCadena(async () => {
        await principal.delete().catch(() => undefined);
        for (const c of COLECCIONES) for (const id of idsDe(c)) await refs[c]!.doc(id).delete().catch(() => undefined);
      });
    },
    estado: (): EstadoGuardado => ({ pendientes: 0, sesionVencida: false, perdido: null, sinRespuesta: false, noAbrio }),
    suscribir: (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
  };
}
