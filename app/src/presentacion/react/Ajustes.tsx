// Layer 5 · Presentation: Ajustes (AJU-01 to AJU-05, CTA-04, DAT-04, DAT-06), the v1's vAjustes: the exchange rate, the
// projection's assumptions, the main color, the backup (version 2, loads version 1) and deleting everything.
import { useState } from 'react';
import type { App, BorradorAjustes, ErrorRespaldo, ResumenRespaldo } from '@rumbo/contratos';
import { decimal, diaCorto, dinero, paraEditar, porcentaje } from '../modelos/formato';
import { PALETA, colorElegido } from '../modelos/tema';
import { textoDeError } from '../modelos/textos';

const COLECCION: Record<string, string> = {
  aj: 'tus ajustes', cuentas: 'la cuenta', categorias: 'la categoría', movs: 'el movimiento', fijos: 'el fijo', deudas: 'la deuda', metas: 'la meta', apartados: 'lo apartado',
};

// DAT-04: why a file could not be loaded.
export function textoRespaldo(e: ErrorRespaldo): string {
  if (!('coleccion' in e)) return e.codigo === 'cargando' ? 'Un momento: Rumbo todavía está abriendo.' : 'El archivo no es un respaldo de Rumbo.';
  const cual = `${COLECCION[e.coleccion] ?? 'un documento'}${e.nombre ? ` «${e.nombre}»` : ''}${e.fecha ? ` del ${diaCorto(e.fecha)}` : ''}`;
  return e.codigo === 'mas-de-2-decimales'
    ? `No se cargó nada: en este respaldo, ${cual} tiene un monto con más de 2 decimales.`
    : `No se cargó nada: en este respaldo, ${cual} tiene un monto que no es un número.`;
}

// The browser's own download, outside the artifact (rumbo.jviscafe.com).
function descargar(nombre: string, contenido: string, aviso: (t: string) => void): void {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  } catch { aviso('No se pudo descargar el respaldo.'); }
}

export function Ajustes({ app, alVolver, aviso }: { app: App; alVolver: () => void; aviso: (t: string) => void }) {
  const v = app.ajustes(), ejemplo = app.estado().ejemplo;
  const [b, setB] = useState<BorradorAjustes>(() => ({
    tc: decimal(v.tc, 2), irregular: v.irregular ? paraEditar(v.irregular) : '0', inflacion: porcentaje(v.inflacion), horas: v.horas ? String(v.horas) : '',
  }));
  const [respaldo, setRespaldo] = useState<{ ok: true; datos: ResumenRespaldo } | { ok: false; error: ErrorRespaldo } | null>(null);
  const [borrar, setBorrar] = useState(false);
  const cambiar = (x: Partial<BorradorAjustes>): void => setB((a) => ({ ...a, ...x }));
  const uc = v.ultimoCambio, td = v.tcDias;

  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarAjustes(b);
    if (!r.ok) { aviso(textoDeError(r.codigo)); return; }
    aviso(ejemplo ? 'Ajustado en el ejemplo' : 'Guardado');
  }
  function leerArchivo(e: React.ChangeEvent<HTMLInputElement>): void {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => setRespaldo(app.leerRespaldo(String(fr.result)));
    fr.readAsText(f);
  }

  return (
    <>
      <div className="top"><button className="ib" onClick={alVolver} aria-label="Volver">‹</button></div>
      <h1 className="h1">Ajustes</h1>
      {td != null && td > 7 && v.tcFecha && (
        <section className="blk a">
          <span className="k">Tipo de cambio · hace {td} días</span>
          <span className="sm" style={{ opacity: 0.95 }}>Lo pusiste el {diaCorto(v.tcFecha)}.{uc ? ` Tu último cambio real fue a Bs ${decimal(uc.tc, 2)} el ${diaCorto(uc.fecha)}.` : ''}</span>
        </section>
      )}
      <form className="card" autoComplete="off" onSubmit={guardar} noValidate>
        <h2 className="h2">Dólares</h2>
        <div className="f">
          <label className="lab" htmlFor="a-tc">Tipo de cambio que usas (Bs por US$)</label>
          <input className="inp" id="a-tc" inputMode="decimal" value={b.tc} onChange={(e) => cambiar({ tc: e.target.value })} />
          <span className="xs m">{v.tcFecha ? `Puesto el ${diaCorto(v.tcFecha)}.` : 'Todavía no lo pusiste.'}{uc ? ` Último cambio real: Bs ${decimal(uc.tc, 2)} (${diaCorto(uc.fecha)}).` : ''}</span>
        </div>
        <h2 className="h2" style={{ marginTop: 6 }}>Tu proyección</h2>
        <div className="f">
          <label className="lab" htmlFor="a-irr">Ingreso irregular que esperas al mes</label>
          <input className="inp" id="a-irr" inputMode="decimal" value={b.irregular} onChange={(e) => cambiar({ irregular: e.target.value })} />
          <span className="xs m">Tu promedio real de los últimos 3 meses: {dinero(v.promedioIrregular)}. Usa un número del que estés seguro: la proyección lo suma cada mes.</span>
        </div>
        <div className="g2">
          <div className="f"><label className="lab" htmlFor="a-inf">Inflación anual %</label><input className="inp" id="a-inf" inputMode="decimal" value={b.inflacion} onChange={(e) => cambiar({ inflacion: e.target.value })} /></div>
          <div className="f"><label className="lab" htmlFor="a-h">Horas de trabajo al mes</label><input className="inp" id="a-h" inputMode="numeric" value={b.horas} placeholder="vacío oculta las horas" onChange={(e) => cambiar({ horas: e.target.value })} /></div>
        </div>
        <span className="xs m">El rendimiento se pone en cada cuenta, en Plan.</span>
        <div className="actions"><button className="btn" type="submit">Guardar</button></div>
      </form>
      <section className="card" aria-label="Apariencia">
        <h2 className="h2">Apariencia</h2>
        <div className="sm m">El color de tu dinero y de lo de hoy. Se ve igual en todos tus equipos.</div>
        <div className="chips" role="group" aria-label="Color principal">
          {Object.entries(PALETA).map(([id, p]) => (
            <button key={id} type="button" className="colorop" aria-pressed={colorElegido(v.color) === id} onClick={() => app.elegirColor(id)}>
              <span style={{ background: p.claro[0] }} />{p.nombre}
            </button>
          ))}
        </div>
      </section>
      <section className="card" aria-label="Respaldo">
        <h2 className="h2">Respaldo</h2>
        <div className="sm m">Un archivo con todas tus cuentas, movimientos, fijos, deudas y metas. Guárdalo donde quieras.</div>
        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn" disabled={ejemplo} onClick={() => { const r = app.respaldo(); if (r) descargar(r.nombre, r.contenido, aviso); }}>Descargar respaldo</button>
          <label className="btn sec" htmlFor="cargarArchivo" style={{ cursor: 'pointer' }}>Cargar respaldo</label>
          <input type="file" id="cargarArchivo" accept=".json,application/json" hidden onChange={leerArchivo} />
        </div>
        {ejemplo && <span className="xs m">Estás viendo el ejemplo: empieza con tus datos para respaldar.</span>}
      </section>
      {respaldo && (respaldo.ok ? (
        <section className="blk a" aria-label="Cargar respaldo">
          <span style={{ fontWeight: 600, fontSize: 16 }}>¿Reemplazar tus datos con este respaldo?</span>
          <span className="sm" style={{ opacity: 0.92 }}>Trae {respaldo.datos.cuentas} cuentas, {respaldo.datos.movs} movimientos, {respaldo.datos.fijos} fijos, {respaldo.datos.deudas} deudas y {respaldo.datos.metas} metas{respaldo.datos.fecha ? ` (del ${diaCorto(respaldo.datos.fecha)})` : ''}. Lo que tienes ahora se borra.</span>
          <div className="actions">
            <button className="btn sec" onClick={() => setRespaldo(null)}>Cancelar</button>
            <button className="btn" onClick={() => {
              const r = app.cargarRespaldo();
              setRespaldo(null);
              if (r.ok) { alVolver(); aviso('Respaldo cargado'); } else aviso(textoDeError(r.codigo));
            }}>Reemplazar mis datos</button>
          </div>
        </section>
      ) : <div className="alert r"><span>{textoRespaldo(respaldo.error)}</span></div>)}
      {!ejemplo && (
        <section className="card">
          <h2 className="h2">Borrar todo</h2>
          <div className="sm m">Borra todos tus datos y vuelve al ejemplo. Descarga un respaldo antes si lo quieres guardar.</div>
          <div>
            <button className="btn del" style={{ padding: 0 }} onClick={() => {
              if (!borrar) { setBorrar(true); return; }
              setBorrar(false);
              app.borrarTodo();
              alVolver();
              aviso('Tus datos se borraron');
            }}>{borrar ? 'Toca otra vez para borrar todo' : 'Borrar todo'}</button>
          </div>
        </section>
      )}
    </>
  );
}
