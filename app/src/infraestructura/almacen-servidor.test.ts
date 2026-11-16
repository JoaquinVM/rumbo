// DAT-07: the save queue of Rumbo's server. Order, retries, an expired Access session and what is read while writing.
import type { Datos } from '@rumbo/contratos';
import { describe, expect, it } from 'vitest';
import { almacenServidor, type Entorno, type Evento } from './almacen-servidor';

interface Llamada { metodo: string; ruta: string; cuerpo: unknown; responder: (r: Response | Error) => void }

// A browser that the test drives: requests wait until the test answers them, timers run when the test says.
function entorno() {
  const llamadas: Llamada[] = [];
  let reloj = 0;
  const timers: { t: number; f: () => void; vivo: boolean }[] = [];
  const oyentes: Partial<Record<Evento, (() => void)[]>> = {};
  let alSalir: () => boolean = () => false;
  const e: Entorno = {
    red: (url, init) => new Promise<Response>((ok, mal) => {
      llamadas.push({
        metodo: init.method ?? 'GET', ruta: url.replace('/api/v2', ''), cuerpo: init.body ? JSON.parse(init.body as string) : undefined,
        responder: (r) => (r instanceof Error ? mal(r) : ok(r)),
      });
    }),
    esperar: (f, ms) => { const x = { t: reloj + ms, f, vivo: true }; timers.push(x); return x; },
    cancelar: (x) => { if (x) (x as { vivo: boolean }).vivo = false; },
    escuchar: (ev, f) => { (oyentes[ev] ??= []).push(f); },
    alSalir: (f) => { alSalir = f; },
  };
  const tic = async (): Promise<void> => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
  return {
    e, llamadas,
    pendientes: () => llamadas.filter((l) => !(l as { hecha?: boolean }).hecha),
    async responder(i: number, r: Response | Error) {
      const l = llamadas[i]!;
      (l as { hecha?: boolean }).hecha = true;
      l.responder(r);
      await tic();
    },
    async pasar(ms: number) {
      reloj += ms;
      for (const x of timers.filter((y) => y.vivo && y.t <= reloj)) { x.vivo = false; x.f(); }
      await tic();
    },
    async emitir(ev: Evento) { for (const f of oyentes[ev] ?? []) f(); await tic(); },
    saliendoAvisa: () => alSalir(),
  };
}

const vacio: Datos = { main: null, cols: { cuentas: [], categorias: [], movs: [], fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [] } };
const json = (d: unknown, status = 200): Response => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
const nada = (status = 204): Response => new Response(null, { status });

async function iniciado() {
  const x = entorno(), a = almacenServidor('/api/v2', x.e), cargas: (Datos | null)[] = [];
  a.iniciar({ alCargar: (d) => cargas.push(d), todo: () => vacio });
  await x.responder(0, json(vacio));
  return { ...x, a, cargas };
}

describe('DAT-07 cola de guardado del servidor', () => {
  it('guarda en el orden en que se anotó, de a una', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'g1' });
    x.a.escribir('movs', { id: 'g2' });
    x.a.borrar('movs', 'g1');
    expect(x.pendientes().map((l) => l.ruta)).toEqual(['/docs/movs/g1']); // the second waits for the first
    expect(x.a.estado().pendientes).toBe(3);
    await x.responder(1, nada());
    await x.responder(2, nada());
    await x.responder(3, nada());
    expect(x.llamadas.slice(1).map((l) => `${l.metodo} ${l.ruta}`)).toEqual(['PUT /docs/movs/g1', 'PUT /docs/movs/g2', 'DELETE /docs/movs/g1']);
    expect(x.llamadas[1]!.cuerpo).toEqual({ id: 'g1' });
    expect(x.a.estado().pendientes).toBe(0);
  });

  it('sin señal un momento: reintenta sin perder el orden y avisa hasta que todo llega', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'g' });
    x.a.borrar('movs', 'g');
    await x.responder(1, new Error('sin red'));
    expect(x.a.estado()).toMatchObject({ pendientes: 2, sesionVencida: false });
    expect(x.saliendoAvisa()).toBe(true); // warns before closing the page
    await x.pasar(999);
    expect(x.llamadas).toHaveLength(2);
    await x.pasar(1);
    expect(x.llamadas[2]!.ruta).toBe('/docs/movs/g'); // the same write again, after 1 s
    await x.responder(2, nada(503));
    await x.pasar(1999);
    expect(x.llamadas).toHaveLength(3);
    await x.pasar(1); // then after 2 s
    await x.responder(3, nada());
    await x.responder(4, nada());
    expect(x.llamadas.slice(3).map((l) => `${l.metodo} ${l.ruta}`)).toEqual(['PUT /docs/movs/g', 'DELETE /docs/movs/g']);
    expect(x.a.estado().pendientes).toBe(0);
    expect(x.saliendoAvisa()).toBe(false);
  });

  it('al volver la señal reintenta enseguida', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'g' });
    await x.responder(1, new Error('sin red'));
    await x.emitir('online');
    expect(x.llamadas).toHaveLength(3);
    await x.responder(2, nada());
    expect(x.a.estado().pendientes).toBe(0);
  });

  it('sesión vencida (401): no descarta nada, espera y guarda al volver a la pestaña', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'ingreso' });
    await x.responder(1, json({ error: 'sin-sesion' }, 401));
    expect(x.a.estado()).toMatchObject({ pendientes: 1, sesionVencida: true });
    await x.pasar(60000);
    expect(x.llamadas).toHaveLength(2); // no retries while the session is expired
    x.a.escribir('movs', { id: 'otro' });
    expect(x.llamadas).toHaveLength(2);
    await x.emitir('focus');
    await x.responder(2, nada());
    await x.responder(3, nada());
    expect(x.llamadas.slice(2).map((l) => l.ruta)).toEqual(['/docs/movs/ingreso', '/docs/movs/otro']);
    expect(x.a.estado()).toMatchObject({ pendientes: 0, sesionVencida: false });
  });

  it('Access redirige (sesión vencida) también cuenta como sesión vencida', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'g' });
    const r = nada(200);
    Object.defineProperty(r, 'type', { value: 'opaqueredirect' });
    await x.responder(1, r);
    expect(x.a.estado().sesionVencida).toBe(true);
  });

  it('un documento que el servidor rechaza (400) se avisa y no frena a los demás', async () => {
    const x = await iniciado();
    x.a.escribir('movs', { id: 'malo' });
    x.a.escribir('movs', { id: 'bueno' });
    await x.responder(1, json({ error: 'monto-no-entero' }, 400));
    await x.responder(2, nada());
    expect(x.a.estado()).toMatchObject({ pendientes: 0, perdido: '/docs/movs/malo' });
  });

  it('los Ajustes son un solo documento: si ya hay uno esperando no se agrega otro, y va lo último', async () => {
    const x = await iniciado();
    let tc = 12.5;
    x.a.escribir('movs', { id: 'g' });
    x.a.guardarAjustes(() => ({ tc } as never));
    x.a.guardarAjustes(() => ({ tc } as never));
    tc = 13;
    expect(x.a.estado().pendientes).toBe(2);
    await x.responder(1, nada());
    expect(x.llamadas[2]).toMatchObject({ ruta: '/ajustes', cuerpo: { aj: { tc: 13 } } });
  });

  it('lo que se lee mientras se anota algo se descarta, para no pisar lo nuevo', async () => {
    const x = await iniciado();
    await x.emitir('visible'); // coming back to the tab reads again
    expect(x.llamadas[1]!.ruta).toBe('/datos');
    x.a.escribir('movs', { id: 'nuevo' });
    await x.responder(1, json({ main: { aj: { empezado: true } }, cols: vacio.cols }));
    expect(x.cargas).toHaveLength(1); // only the first load
    await x.responder(2, nada());
  });

  it('la primera carga sin red reintenta cada 3 s y avisa si a los 10 s no responde', async () => {
    const x = entorno(), a = almacenServidor('/api/v2', x.e), cargas: (Datos | null)[] = [];
    a.iniciar({ alCargar: (d) => cargas.push(d), todo: () => vacio });
    await x.responder(0, new Error('sin red'));
    await x.pasar(3000);
    await x.responder(1, json({ error: 'sin-sesion' }, 401));
    expect(a.estado().sesionVencida).toBe(true);
    await x.pasar(3000);
    await x.responder(2, new Error('sin red'));
    await x.pasar(4000);
    expect(a.estado().sinRespuesta).toBe(true);
    await x.responder(3, json({ main: { aj: { empezado: true, tc: 12.5 } }, cols: vacio.cols }));
    expect(cargas).toHaveLength(1);
    expect(a.estado()).toMatchObject({ sinRespuesta: false, sesionVencida: false });
  });

  it('sin datos guardados todavía, carga «nada» (el ejemplo)', async () => {
    const x = await iniciado();
    expect(x.cargas).toEqual([null]);
  });

  it('usa la lectura que la página pidió mientras cargaba el código, y no pide otra', async () => {
    const x = entorno();
    let pedida: (r: Response) => void = () => {};
    x.e.precarga = () => new Promise<Response>((ok) => { pedida = ok; });
    const a = almacenServidor('/api/v2', x.e), cargas: (Datos | null)[] = [];
    a.iniciar({ alCargar: (d) => cargas.push(d), todo: () => vacio });
    pedida(json({ main: { aj: { empezado: true } }, cols: vacio.cols }));
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(x.llamadas).toHaveLength(0);
    expect(cargas).toHaveLength(1);
  });
});
