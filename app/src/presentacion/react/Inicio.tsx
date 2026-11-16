// Layer 5 · Presentation: the frame of every screen (PAN-01), the v1's page: header, notices, the screen, the + button
// and the four tabs; the details (a debt, a goal, the categories, Ajustes) and the sheets.
import { Suspense, useCallback, useEffect, useState } from 'react';
import type { App, TipoPago } from '@rumbo/contratos';
import { Anotar } from './Anotar';
import { useAviso } from './comunes';
import { cargarDiferidas, Diferido } from './diferidas';
import { ElegirCategoria, VerMovimiento } from './Hojas';
import { Movimientos } from './Movimientos';
import { Rumbo, type AjustesRumbo } from './Rumbo';
import { enMoneda, sumarMeses } from '../modelos/formato';
import { cssDelTema } from '../modelos/tema';
import { textoDeError } from '../modelos/textos';

type Vista = 'rumbo' | 'movimientos' | 'desglose' | 'plan';
type Hoja =
  | { tipo: 'anotar'; id?: string } | { tipo: 'ver'; id: string } | { tipo: 'categoria' } | { tipo: 'separar'; id: string }
  | { tipo: 'cuenta'; id?: string } | { tipo: 'cuadrar'; id: string } | { tipo: 'fijo'; id?: string } | { tipo: 'deuda'; id?: string }
  | { tipo: 'pago'; id: string; pago: TipoPago } | { tipo: 'meta'; id?: string } | { tipo: 'editarCategoria'; id?: string } | { tipo: 'empezar' };
type Detalle = { tipo: 'deuda'; id: string } | { tipo: 'meta'; id: string } | { tipo: 'categorias' } | { tipo: 'ajustes' };
const VISTAS: Vista[] = ['rumbo', 'movimientos', 'desglose', 'plan'];
const vistaDeLaDireccion = (): Vista => {
  const v = location.hash.slice(1) as Vista;
  return VISTAS.includes(v) ? v : 'rumbo';
};
const EDITABLES = new Set(['gasto', 'ingreso', 'transferencia']);

const Pestana = ({ v, actual, children }: { v: Vista; actual: boolean; children: React.ReactNode }) =>
  <a href={`#${v}`} aria-current={actual ? 'page' : 'false'}>{children}</a>;

export function Inicio({ app }: { app: App }) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const dejar = app.suscribir(() => setVersion((n) => n + 1));
    setVersion((n) => n + 1); // what changed before subscribing (the data may arrive before this effect runs)
    return dejar;
  }, [app]);
  const est = app.estado();
  const [vista, setVista] = useState<Vista>(vistaDeLaDireccion);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [adelanto, setAdelanto] = useState(0); // PRO-08 in the detail of a loan, in whole Bs
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [aviso, avisar] = useAviso();
  const [rumbo, setRumbo] = useState<AjustesRumbo>({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 });
  const [mes, setMes] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('todas');
  const [categoria, setCategoria] = useState<string | null>(null);
  const cerrar = useCallback(() => setHoja(null), []);
  // «Cargando…» shows only if the data take more than a second: when they come sooner, nothing is drawn and then
  // pushed down by the notices above the screen (a layout shift that Lighthouse counts, PUB-06).
  const [lento, setLento] = useState(false);
  useEffect(() => {
    if (est.cargado) return undefined;
    const t = setTimeout(() => setLento(true), 1000);
    return () => clearTimeout(t);
  }, [est.cargado]);

  // The other screens load on the first tap (or now, if Rumbo opens on one of them): not before the first one (PUB-06)
  useEffect(() => {
    if (vistaDeLaDireccion() === 'desglose' || vistaDeLaDireccion() === 'plan') { void cargarDiferidas().catch(() => {}); return undefined; }
    const pedir = (): void => { void cargarDiferidas().catch(() => {}); };
    addEventListener('pointerdown', pedir, { once: true, capture: true });
    addEventListener('keydown', pedir, { once: true, capture: true });
    return () => { removeEventListener('pointerdown', pedir, { capture: true }); removeEventListener('keydown', pedir, { capture: true }); };
  }, []);

  useEffect(() => {
    // Only a real change of address closes a detail: a late event of the first load (WebKit) changes nothing
    let antes = location.hash;
    const cambio = (): void => {
      if (location.hash === antes) return;
      antes = location.hash;
      setVista(vistaDeLaDireccion()); setDetalle(null); scrollTo(0, 0);
    };
    addEventListener('hashchange', cambio);
    return () => removeEventListener('hashchange', cambio);
  }, []);

  // AJU-05: the main color the person chose
  useEffect(() => {
    let st = document.getElementById('tema');
    if (!st) { st = document.createElement('style'); st.id = 'tema'; document.head.appendChild(st); }
    st.textContent = cssDelTema(est.color);
  }, [est.color]);

  const mesActual = mes ?? est.hoy.slice(0, 7);
  const g = est.guardado;
  const abrirAnotar = (id?: string): void => {
    if (!app.formulario(id)) { avisar('Primero crea una cuenta en Plan.'); return; }
    setHoja({ tipo: 'anotar', ...(id ? { id } : {}) });
  };
  const verDetalle = (d: Detalle): void => { setDetalle(d); setAdelanto(0); scrollTo(0, 0); };
  const volver = (): void => setDetalle(null);
  const ver = (id: string): void => {
    const m = app.detalle(id);
    if (m && EDITABLES.has(m.tipo)) abrirAnotar(id);
    else setHoja({ tipo: 'ver', id });
  };
  const nuevoFijo = (id?: string): void => {
    if (!app.formularioFijo(id)) { avisar('Primero crea una cuenta.'); return; }
    setHoja({ tipo: 'fijo', ...(id ? { id } : {}) });
  };
  const pago = (id: string, tipo: TipoPago): void => {
    if (!app.formularioPago(id, tipo)) {
      const d = app.deuda(id, 0);
      avisar(`Necesitas una cuenta en ${d?.moneda === 'USD' ? 'US$' : 'Bs'} para esta deuda`);
      return;
    }
    setHoja({ tipo: 'pago', id, pago: tipo });
  };

  let pantalla: React.ReactNode;
  const deuda = detalle?.tipo === 'deuda' ? app.deuda(detalle.id, adelanto * 100) : null;
  const meta = detalle?.tipo === 'meta' ? app.meta(detalle.id) : null;
  if (!est.cargado) pantalla = lento ? <div className="empty"><h3>Cargando tu rumbo…</h3>Abriendo tus datos guardados.</div> : null;
  else if (deuda) {
    pantalla = <Diferido con={({ DetalleDeuda }) => <DetalleDeuda v={deuda} adelanto={adelanto} acc={{
      volver, editar: () => setHoja({ tipo: 'deuda', id: deuda.id }), pago: (t) => pago(deuda.id, t), adelanto: setAdelanto, ver,
    }} />} />;
  } else if (meta) {
    pantalla = <Diferido con={({ DetalleMeta }) => <DetalleMeta v={meta} acc={{
      volver, editar: () => setHoja({ tipo: 'meta', id: meta.id }),
      apartar: (cuentaId, monto, signo) => {
        const r = app.apartar(meta.id, cuentaId, monto, signo);
        if (r.ok) { avisar(signo > 0 ? 'Apartado' : 'Desapartado'); return true; }
        const c = meta.cuentas.find((x) => x.id === cuentaId);
        if (r.codigo === 'mas-que-el-libre' && c) avisar(`En ${c.nombre} puedes apartar hasta ${enMoneda(Math.max(0, c.libre), c.moneda, 2)}`);
        else if (r.codigo === 'mas-que-lo-apartado' && c) avisar(`En ${c.nombre} esta meta tiene ${enMoneda(meta.dondeEsta.find((d) => d.cuentaId === c.id)?.monto ?? 0, c.moneda, 2)} apartados`);
        else if (r.codigo === 'falta-cuenta') avisar('Necesitas una cuenta.');
        else avisar(textoDeError(r.codigo));
        return false;
      },
    }} />} />;
  } else if (detalle?.tipo === 'categorias') pantalla = <Diferido con={({ Categorias }) => <Categorias v={app.categorias()} alVolver={volver} editar={(id) => setHoja({ tipo: 'editarCategoria', ...(id ? { id } : {}) })} />} />;
  else if (detalle?.tipo === 'ajustes') pantalla = <Diferido con={({ Ajustes }) => <Ajustes app={app} alVolver={volver} aviso={avisar} />} />;
  else if (vista === 'rumbo') {
    pantalla = (
      <Rumbo v={app.rumbo({ ...rumbo, extra: rumbo.extra * 100, adelanto: rumbo.adelanto * 100 })} a={rumbo} acc={{
        cambiar: (x) => setRumbo((r) => ({ ...r, ...x })),
        confirmar: (k, monto) => {
          const r = app.confirmarFijo(k, monto);
          avisar(r.ok ? `${r.datos.nombre} confirmado` : r.codigo === 'falta-monto' ? 'Escribe el monto' : textoDeError(r.codigo));
        },
        saltar: (k) => { if (app.saltarFijo(k).ok) avisar('Saltado este mes'); },
        ajustes: () => verDetalle({ tipo: 'ajustes' }),
        meta: (id) => (id ? verDetalle({ tipo: 'meta', id }) : setHoja({ tipo: 'meta' })),
      }} />
    );
  } else if (vista === 'movimientos') {
    pantalla = (
      <Movimientos v={app.movimientos({ mes: mesActual, cuenta: filtro, categoria })} filtro={filtro} acc={{
        mes: (n) => setMes(sumarMeses(mesActual, n)),
        cuenta: setFiltro,
        elegirCategoria: () => setHoja({ tipo: 'categoria' }),
        quitarCategoria: () => setCategoria(null),
        ver,
      }} />
    );
  } else if (vista === 'desglose') {
    pantalla = (
      <Diferido con={({ Desglose }) => <Desglose v={app.desglose(mesActual)} acc={{
        mes: (n) => setMes(sumarMeses(mesActual, n)),
        // DES-05: Movimientos of the same month with that category, in every account
        categoria: (id) => { setCategoria(id); setFiltro('todas'); location.hash = '#movimientos'; },
      }} />} />
    );
  } else {
    pantalla = (
      <Diferido con={({ Plan }) => <Plan v={app.plan()} acc={{
        cuenta: (id) => setHoja({ tipo: 'cuenta', ...(id ? { id } : {}) }),
        cuadrar: (id) => setHoja({ tipo: 'cuadrar', id }),
        fijo: nuevoFijo,
        verDeuda: (id) => verDetalle({ tipo: 'deuda', id }),
        nuevaDeuda: () => setHoja({ tipo: 'deuda' }),
        verMeta: (id) => verDetalle({ tipo: 'meta', id }),
        nuevaMeta: () => setHoja({ tipo: 'meta' }),
        categorias: () => verDetalle({ tipo: 'categorias' }),
      }} />} />
    );
  }

  return (
    <>
      <div className="app">
        <header className="top">
          <div className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="var(--azul-l)" /></svg>
            Rumbo
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {est.cargado && est.ejemplo && <span className="ex">Datos de ejemplo</span>}
            <button className="ib" onClick={() => verDetalle({ tipo: 'ajustes' })} aria-label="Ajustes">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
            </button>
          </div>
        </header>
        <div>
          {!est.cargado && g.sinRespuesta && <div className="note">Tus datos aún no responden. Revisa tu conexión; esta página sigue intentando.</div>}
          {est.cargado && est.ejemplo && (
            <>
              <div className="banner">
                <span><b>Esto es un ejemplo.</b> Nada se guarda hasta que empieces con tus datos.</span>
                <button className="btn sm" onClick={() => setHoja({ tipo: 'empezar' })}>Empezar con mis datos</button>
              </div>
              {g.noAbrio && <div className="note">No pude abrir tus datos guardados en esta visita.</div>}
            </>
          )}
          {est.cargado && !est.ejemplo && est.origen === 'navegador' && <div className="note">Tus datos se guardan solo en este navegador.</div>}
        </div>
        <div aria-live="polite">
          {g.sesionVencida
            ? <div className="note"><b>Tu sesión venció.</b> Hay cambios sin guardar. <a href="/" target="_blank" rel="noopener">Vuelve a entrar en otra pestaña</a> y regresa aquí: se guardarán solos.</div>
            : g.pendientes
              ? <div className="note"><b>Hay cambios sin guardar.</b> Revisa tu conexión; Rumbo sigue intentando.</div>
              : g.perdido ? <div className="note"><b>Un cambio no se pudo guardar</b> ({g.perdido}). Anótalo de nuevo.</div> : null}
        </div>
        <main style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><Suspense fallback={null}>{pantalla}</Suspense></main>
      </div>
      <button className="fab" onClick={() => abrirAnotar()} aria-label="Anotar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <nav className="tabs" aria-label="Secciones">
        <div className="in2">
          <Pestana v="rumbo" actual={vista === 'rumbo' && !detalle}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l5-5 4 3 8-8" /><path d="M15 7h5v5" /></svg>Rumbo</Pestana>
          <Pestana v="movimientos" actual={vista === 'movimientos' && !detalle}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9" /></svg>Movimientos</Pestana>
          <Pestana v="desglose" actual={vista === 'desglose' && !detalle}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 4v8l6 5" /></svg>Desglose</Pestana>
          <Pestana v="plan" actual={vista === 'plan' && !detalle}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>Plan</Pestana>
        </div>
      </nav>
      <Suspense fallback={null}>
      {hoja?.tipo === 'anotar' && <Anotar app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} aviso={avisar} separar={(id) => setHoja({ tipo: 'separar', id })} />}
      {hoja?.tipo === 'separar' && <Diferido con={({ HojaSeparar }) => <HojaSeparar app={app} gastoId={hoja.id} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'cuenta' && <Diferido con={({ HojaCuenta }) => <HojaCuenta app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'cuadrar' && <Diferido con={({ HojaCuadrar }) => <HojaCuadrar app={app} id={hoja.id} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'fijo' && <Diferido con={({ HojaFijo }) => <HojaFijo app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'deuda' && <Diferido con={({ HojaDeuda }) => <HojaDeuda app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} alArchivar={() => { cerrar(); volver(); }} aviso={avisar} />} />}
      {hoja?.tipo === 'pago' && <Diferido con={({ HojaPago }) => <HojaPago app={app} deudaId={hoja.id} tipo={hoja.pago} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'meta' && <Diferido con={({ HojaMeta }) => <HojaMeta app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} alArchivar={() => { cerrar(); volver(); }} aviso={avisar} />} />}
      {hoja?.tipo === 'editarCategoria' && <Diferido con={({ HojaCategoria }) => <HojaCategoria app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} aviso={avisar} />} />}
      {hoja?.tipo === 'empezar' && <Diferido con={({ HojaEmpezar }) => <HojaEmpezar app={app} alCerrar={cerrar} aviso={avisar} alEmpezar={() => {
        cerrar(); setDetalle(null); setRumbo({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 });
        if (location.hash !== '#rumbo') location.hash = '#rumbo';
      }} />} />}
      </Suspense>
      {hoja?.tipo === 'ver' && <VerMovimiento app={app} id={hoja.id} alCerrar={cerrar} aviso={avisar} />}
      {hoja?.tipo === 'categoria' && (
        <ElegirCategoria categorias={app.movimientos({ mes: mesActual, cuenta: filtro, categoria }).elegibles}
          alElegir={(id) => { setCategoria(id); setHoja(null); }} alCerrar={cerrar} />
      )}
      {aviso}
    </>
  );
}
