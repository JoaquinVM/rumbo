// Layer 5 · Presentation: the frame of every screen (PAN-01), the v1's page: header, notices, the screen, the + button
// and the four tabs. Job 081 brings Rumbo, anotar and Movimientos; Desglose, Plan and Ajustes come next.
import { useCallback, useEffect, useState } from 'react';
import type { App } from '@rumbo/contratos';
import { Anotar } from './Anotar';
import { Pronto, useAviso } from './comunes';
import { ElegirCategoria, VerMovimiento } from './Hojas';
import { Movimientos } from './Movimientos';
import { Rumbo, type AjustesRumbo } from './Rumbo';
import { sumarMeses } from '../modelos/formato';
import { cssDelTema } from '../modelos/tema';
import { textoDeError } from '../modelos/textos';

type Vista = 'rumbo' | 'movimientos' | 'desglose' | 'plan';
type Hoja = { tipo: 'anotar'; id?: string } | { tipo: 'ver'; id: string } | { tipo: 'categoria' };
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
  const [detalle, setDetalle] = useState<string | null>(null); // a screen that is not built yet
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [aviso, avisar] = useAviso();
  const [rumbo, setRumbo] = useState<AjustesRumbo>({ anios: 5, nominal: false, recortes: {}, extra: 0, adelanto: 0 });
  const [mes, setMes] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('todas');
  const [categoria, setCategoria] = useState<string | null>(null);
  const cerrar = useCallback(() => setHoja(null), []);

  useEffect(() => {
    const cambio = (): void => { setVista(vistaDeLaDireccion()); setDetalle(null); scrollTo(0, 0); };
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
  const verDetalle = (titulo: string): void => { setDetalle(titulo); scrollTo(0, 0); };

  let pantalla: React.ReactNode;
  if (!est.cargado) pantalla = <div className="empty"><h3>Cargando tu rumbo…</h3>Abriendo tus datos guardados.</div>;
  else if (detalle) pantalla = <Pronto titulo={detalle} alVolver={() => setDetalle(null)} />;
  else if (vista === 'rumbo') {
    pantalla = (
      <Rumbo v={app.rumbo({ ...rumbo, extra: rumbo.extra * 100, adelanto: rumbo.adelanto * 100 })} a={rumbo} acc={{
        cambiar: (x) => setRumbo((r) => ({ ...r, ...x })),
        confirmar: (k, monto) => {
          const r = app.confirmarFijo(k, monto);
          avisar(r.ok ? `${r.datos.nombre} confirmado` : r.codigo === 'falta-monto' ? 'Escribe el monto' : textoDeError(r.codigo));
        },
        saltar: (k) => { if (app.saltarFijo(k).ok) avisar('Saltado este mes'); },
        ajustes: () => verDetalle('Ajustes'),
        meta: () => verDetalle('El detalle de tus metas'),
      }} />
    );
  } else if (vista === 'movimientos') {
    pantalla = (
      <Movimientos v={app.movimientos({ mes: mesActual, cuenta: filtro, categoria })} filtro={filtro} acc={{
        mes: (n) => setMes(sumarMeses(mesActual, n)),
        cuenta: setFiltro,
        elegirCategoria: () => setHoja({ tipo: 'categoria' }),
        quitarCategoria: () => setCategoria(null),
        ver: (id) => {
          const fila = app.movimientos({ mes: mesActual, cuenta: filtro, categoria }).dias.flatMap((d) => d.filas).find((m) => m.id === id);
          if (fila && EDITABLES.has(fila.tipo)) abrirAnotar(id);
          else setHoja({ tipo: 'ver', id });
        },
      }} />
    );
  } else pantalla = <Pronto titulo={vista === 'desglose' ? 'El Desglose' : 'Tu Plan'} />;

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
            <button className="ib" onClick={() => verDetalle('Ajustes')} aria-label="Ajustes">
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
                <button className="btn sm" onClick={() => avisar('Empezar con tus datos llega en la próxima etapa de Rumbo 2.')}>Empezar con mis datos</button>
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
        <main style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{pantalla}</main>
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
      {hoja?.tipo === 'anotar' && <Anotar app={app} {...(hoja.id ? { id: hoja.id } : {})} alCerrar={cerrar} aviso={avisar} />}
      {hoja?.tipo === 'ver' && <VerMovimiento app={app} id={hoja.id} alCerrar={cerrar} aviso={avisar} />}
      {hoja?.tipo === 'categoria' && (
        <ElegirCategoria categorias={app.movimientos({ mes: mesActual, cuenta: filtro, categoria }).elegibles}
          alElegir={(id) => { setCategoria(id); setHoja(null); }} alCerrar={cerrar} />
      )}
      {aviso}
    </>
  );
}
