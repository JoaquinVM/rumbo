// Layer 4 · Infrastructure: Rumbo's server behind Cloudflare Access (DAT-03, DAT-07), the v1's storeServidor on
// /api/v2. Writes go out one at a time and in order; what does not arrive is retried, doubling the wait up to 30 s, and
// «Hay cambios sin guardar» shows until everything arrived. If Access asks to sign in again, the queue waits, nothing
// is dropped, and it goes on when the person comes back to the tab. It never falls back to the example on an error.
import type { Datos, EstadoGuardado } from '@rumbo/contratos';
import type { Ajustes } from '@rumbo/dominio';
import type { Almacen, Coleccion } from '../aplicacion/puertos';

export type Evento = 'online' | 'focus' | 'visible';

// What the store uses from the browser, so the tests can drive it.
export interface Entorno {
  red: (url: string, init: RequestInit) => Promise<Response>;
  esperar: (f: () => void, ms: number) => unknown;
  cancelar: (t: unknown) => void;
  escuchar: (evento: Evento, f: () => void) => void;
  alSalir: (hayPendientes: () => boolean) => void;
  // The first read of the data, if the page already asked for it while the code was loading (index.html)
  precarga?: () => Promise<Response> | null;
}

export function entornoDelNavegador(): Entorno {
  return {
    red: (url, init) => fetch(url, init),
    esperar: (f, ms) => setTimeout(f, ms),
    cancelar: (t) => clearTimeout(t as ReturnType<typeof setTimeout>),
    escuchar: (evento, f) => {
      if (evento === 'visible') document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') f(); });
      else addEventListener(evento, f);
    },
    alSalir: (hay) => addEventListener('beforeunload', (e) => { if (hay()) { e.preventDefault(); e.returnValue = ''; } }),
    precarga: () => {
      const g = globalThis as { __rumboDatos?: Promise<Response> };
      const p = g.__rumboDatos ?? null;
      delete g.__rumboDatos;
      return p;
    },
  };
}

type Clase = 'ok' | 'sesion' | 'red' | 'malo';
interface Pedido { metodo: 'PUT' | 'DELETE'; ruta: string; cuerpo?: () => unknown; ajustes?: boolean }

// What to do with an answer: done, session expired (Access redirects or refuses), retry (network or server) or useless.
const clase = (r: Response): Clase =>
  r.type === 'opaqueredirect' || r.status === 401 || r.status === 403 ? 'sesion'
    : r.ok ? 'ok' : r.status >= 500 || r.status === 429 ? 'red' : 'malo';

export function almacenServidor(api = '/api/v2', e: Entorno = entornoDelNavegador()): Almacen {
  const cola: Pedido[] = [];
  let enviando = false, pronto = false, espera = 1000, reintento: unknown = null, vencida = false, perdido: string | null = null;
  let cambios = 0, cargado = false, sinRespuesta = false, alCargar: (d: Datos | null) => void = () => {};
  const oyentes = new Set<() => void>();
  const avisar = (): void => { for (const f of [...oyentes]) f(); };

  // With a bad signal a request can hang: it is cut at 20 s (60 s if it brings everything) and retried.
  async function pedir(metodo: string, ruta: string, cuerpo?: unknown): Promise<Response> {
    const corte = new AbortController(), t = e.esperar(() => corte.abort(), ruta === '/datos' ? 60000 : 20000);
    try {
      return await e.red(api + ruta, {
        method: metodo, cache: 'no-store', credentials: 'same-origin', redirect: 'manual', signal: corte.signal,
        headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } finally {
      e.cancelar(t);
    }
  }

  // A request that was already sent, cut like the others if it hangs.
  function conCorte(p: Promise<Response>, ms: number): Promise<Response> {
    return new Promise((ok, mal) => {
      const t = e.esperar(() => mal(new Error('sin respuesta')), ms);
      p.then((r) => { e.cancelar(t); ok(r); }, (x: unknown) => { e.cancelar(t); mal(x); });
    });
  }

  async function enviar(): Promise<void> {
    if (enviando || vencida) return;
    enviando = true;
    e.cancelar(reintento);
    try {
      while (cola.length) {
        const p = cola[0]!;
        let c: Clase;
        try { c = clase(await pedir(p.metodo, p.ruta, p.cuerpo ? p.cuerpo() : undefined)); } catch { c = 'red'; }
        if (c === 'sesion') { vencida = true; break; }
        if (c === 'red') {
          reintento = e.esperar(() => { void enviar(); }, pronto ? 0 : espera);
          pronto = false;
          espera = Math.min(espera * 2, 30000);
          break;
        }
        if (c === 'malo') perdido = p.ruta;
        cola.shift();
        espera = 1000;
        pronto = false;
      }
    } finally {
      enviando = false;
      avisar();
    }
  }

  const encolar = (p: Pedido): void => { cambios++; cola.push(p); avisar(); void enviar(); };

  // The signal came back or the person came back to the tab: if a request is under way and fails, retry at once.
  const reanudar = (): void => {
    if (vencida) vencida = false;
    espera = 1000;
    if (enviando) pronto = true;
    else void enviar();
  };

  // Reads everything; without network or session it waits and tries again. If something was written while it was
  // reading, what it read is dropped.
  async function cargar(primera: boolean): Promise<void> {
    const antes = cambios;
    let r: Response | null = null, c: Clase;
    const pre = primera ? e.precarga?.() ?? null : null;
    try { r = await (pre ? conCorte(pre, 60000) : pedir('GET', '/datos')); c = clase(r); } catch { c = 'red'; }
    if (c !== 'ok' || !r) {
      if (c === 'sesion') { vencida = true; avisar(); }
      if (primera) e.esperar(() => { void cargar(true); }, 3000);
      return;
    }
    const d = (await r.json()) as Datos;
    if (cola.length || cambios !== antes) return;
    cargado = true;
    vencida = false;
    sinRespuesta = false;
    alCargar(d.main && d.main.aj ? d : null);
  }

  const ruta = (c: Coleccion, id: string): string => `/docs/${c}/${encodeURIComponent(id)}`;

  return {
    origen: 'servidor',
    iniciar(o) {
      alCargar = o.alCargar;
      e.escuchar('online', reanudar);
      e.escuchar('focus', reanudar);
      e.escuchar('visible', () => { reanudar(); if (cargado && !cola.length) void cargar(false); });
      e.alSalir(() => cola.length > 0);
      e.esperar(() => { if (!cargado) { sinRespuesta = true; avisar(); } }, 10000);
      void cargar(true);
    },
    escribir: (c, doc) => { const b = JSON.parse(JSON.stringify(doc)) as unknown; encolar({ metodo: 'PUT', ruta: ruta(c, doc.id), cuerpo: () => b }); },
    borrar: (c, id) => encolar({ metodo: 'DELETE', ruta: ruta(c, id) }),
    // The settings are one document: the latest goes, and if one is already waiting another is not added
    guardarAjustes(aj: () => Ajustes) {
      const u = cola[cola.length - 1];
      if (u && u.ajustes && !(enviando && cola.length === 1)) return;
      encolar({ metodo: 'PUT', ruta: '/ajustes', ajustes: true, cuerpo: () => ({ aj: JSON.parse(JSON.stringify(aj())) as unknown }) });
    },
    // The v1's reemplazar and clear: in the queue, after what was already written, all or nothing on the server.
    reemplazar(d) { const b = JSON.parse(JSON.stringify(d)) as unknown; encolar({ metodo: 'PUT', ruta: '/datos', cuerpo: () => b }); },
    borrarTodo: () => encolar({ metodo: 'DELETE', ruta: '/datos' }),
    estado: (): EstadoGuardado => ({ pendientes: cola.length, sesionVencida: vencida, perdido, sinRespuesta, noAbrio: false }),
    suscribir: (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
  };
}
