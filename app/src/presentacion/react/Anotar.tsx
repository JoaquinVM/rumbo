// Layer 5 · Presentation: anotar and edit a gasto, an ingreso or a transferencia (MOV-01, MOV-02, MOV-03, MOV-05,
// CTA-06), the v1's abrirAnotar. The balance of each account shows with 2 decimals on its pill (FMT-02, decision 63).
import { useEffect, useRef, useState } from 'react';
import type { App, BorradorMovimiento, CuentaVista, TipoAnotar } from '@rumbo/contratos';
import { BotonDosToques, Hoja } from './comunes';
import { decimal, enMoneda, simbolo } from '../modelos/formato';
import { textoDeError } from '../modelos/textos';

const AVISOS = { gasto: 'Gasto anotado', ingreso: 'Ingreso anotado', transferencia: 'Transferencia anotada', guardado: 'Guardado' } as const;

function Cuentas({ cuentas, elegida, alElegir, excluir }: { cuentas: CuentaVista[]; elegida: string | null; alElegir: (id: string) => void; excluir?: string }) {
  return (
    <>
      {cuentas.filter((c) => c.id !== excluir).map((c) => (
        <button key={c.id} type="button" className="chip" aria-pressed={c.id === elegida} onClick={() => alElegir(c.id)}>
          {c.nombre} · {enMoneda(c.saldo, c.moneda, 2)}
        </button>
      ))}
    </>
  );
}

export function Anotar({ app, id, alCerrar, aviso }: { app: App; id?: string; alCerrar: () => void; aviso: (t: string) => void }) {
  const [f] = useState(() => app.formulario(id));
  const [b, setB] = useState<BorradorMovimiento | null>(f ? f.borrador : null);
  const monto = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (f && !f.editando) { const t = setTimeout(() => monto.current?.focus(), 60); return () => clearTimeout(t); }
    return undefined;
  }, [f]);
  if (!f || !b) return null;
  const cs = f.cuentas, ejemplo = app.estado().ejemplo;
  const cambiar = (x: Partial<BorradorMovimiento>): void => setB({ ...b, ...x });
  const c = cs.find((x) => x.id === b.cuentaId) ?? cs[0]!, mon = c.moneda;
  const destinos = cs.filter((x) => x.id !== b.cuentaId);
  const destinoId = destinos.some((x) => x.id === b.cuentaDestinoId) ? b.cuentaDestinoId : destinos[0]?.id ?? null;
  const d = cs.find((x) => x.id === destinoId), distinta = !!d && d.moneda !== mon;
  const listo: BorradorMovimiento = { ...b, cuentaDestinoId: b.tipo === 'transferencia' ? destinoId : b.cuentaDestinoId };

  const elegirTipo = (t: TipoAnotar): void => {
    if (t === b.tipo) return;
    cambiar({ tipo: t, categoriaId: t === 'transferencia' ? null : f.porUso[t][0]?.id ?? null });
  };

  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.anotar(listo);
    if (!r.ok) { aviso(textoDeError(r.codigo)); return; }
    alCerrar();
    const a = r.datos;
    aviso(a.aviso === 'antes-de-abrir' ? `Es de antes de abrir ${a.cuenta}: cuenta en el Desglose, pero no cambia su saldo` : AVISOS[a.aviso]);
  }

  const tope = b.tipo === 'gasto' ? app.avisoTope(listo) : null;
  const k = b.categoriaId ? [...f.porUso.gasto, ...f.porUso.ingreso].find((x) => x.id === b.categoriaId) : undefined;
  const tc = b.tipo === 'transferencia' && distinta ? app.tipoDeCambio(listo) : null;
  const notas = b.tipo !== 'transferencia' && b.categoriaId ? app.notasSugeridas(b.categoriaId) : [];
  const campoMonto = (
    <input id="m-monto" ref={monto} inputMode="decimal" placeholder="0" value={b.monto} onChange={(e) => cambiar({ monto: e.target.value })} />
  );

  return (
    <Hoja alCerrar={alCerrar}>
      <div className="sp">
        <h2 className="h2" style={{ fontSize: 20 }}>{f.editando ? 'Editar movimiento' : 'Anotar'}</h2>
        {ejemplo && <span className="ex">Ejemplo: no se guarda</span>}
      </div>
      <form autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={guardar} noValidate>
        <div className="seg full" role="group" aria-label="Tipo">
          {(['gasto', 'ingreso', 'transferencia'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={b.tipo === t} onClick={() => elegirTipo(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {b.tipo === 'transferencia' ? (
            <>
              <div className="f"><span className="lab">Desde</span><div className="chips"><Cuentas cuentas={cs} elegida={b.cuentaId} alElegir={(x) => cambiar({ cuentaId: x })} /></div></div>
              <div className="montoblk"><label htmlFor="m-monto">Sale de {c.nombre}</label><div className="r"><span>{simbolo(mon)}</span>{campoMonto}</div></div>
              <div className="f"><span className="lab">Hacia</span><div className="chips">
                {destinos.length ? <Cuentas cuentas={cs} elegida={destinoId} alElegir={(x) => cambiar({ cuentaDestinoId: x })} excluir={b.cuentaId} /> : <span className="xs m">Necesitas otra cuenta para transferir.</span>}
              </div></div>
              {distinta && d && (
                <div className="montoblk v">
                  <label htmlFor="m-dest">Entra a {d.nombre} · escribe lo que recibiste</label>
                  <div className="r"><span>{simbolo(d.moneda)}</span><input id="m-dest" inputMode="decimal" placeholder="0" value={b.montoDestino} onChange={(e) => cambiar({ montoDestino: e.target.value })} /></div>
                </div>
              )}
              <div className="card" style={{ gap: 4, padding: '12px 14px', fontSize: 14 }}>
                {tc != null && (
                  <>
                    <span>Este cambio fue a <b>Bs {decimal(tc, 2)} por dólar</b>.</span>
                    <label className="xs m" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={b.usarTc} onChange={(e) => cambiar({ usarTc: e.target.checked })} /> Usar Bs {decimal(tc, 2)} como mi tipo de cambio
                    </label>
                  </>
                )}
                <span className="xs m">No cuenta como gasto ni ingreso: tu dinero solo cambia de lugar.</span>
              </div>
              <div className="g2">
                <div className="f"><label className="lab" htmlFor="m-nota">Nota</label><input className="inp" id="m-nota" value={b.nota} maxLength={60} onChange={(e) => cambiar({ nota: e.target.value })} /></div>
                <div className="f"><label className="lab" htmlFor="m-fecha">Fecha</label><input className="inp" id="m-fecha" type="date" value={b.fecha} onChange={(e) => cambiar({ fecha: e.target.value })} /></div>
              </div>
            </>
          ) : (
            <>
              <div className="montoblk">
                <label htmlFor="m-monto">Monto</label>
                <div className="r"><span>{simbolo(mon)}</span>{campoMonto}</div>
                <span className="xs" style={{ opacity: 0.92 }}>{tope != null && k ? `${k.nombre}: después de esto llevas ${Math.round(tope * 100)} % de tu tope` : ''}</span>
              </div>
              <div className="f"><span className="lab">Cuenta{f.editando ? '' : ' · la última que usaste'}</span><div className="chips"><Cuentas cuentas={cs} elegida={b.cuentaId} alElegir={(x) => cambiar({ cuentaId: x })} /></div></div>
              <div className="f"><span className="lab">Categoría · primero las que más usas</span><div className="chips">
                {f.porUso[b.tipo].map((x) => (
                  <button key={x.id} type="button" className="chip" aria-pressed={x.id === b.categoriaId} onClick={() => cambiar({ categoriaId: x.id })}>
                    <span className="sq" style={{ background: x.id === b.categoriaId ? 'var(--azul-on)' : x.color }} />{x.nombre}
                  </button>
                ))}
              </div></div>
              <div className="g2">
                <div className="f"><label className="lab" htmlFor="m-nota">Nota</label><input className="inp" id="m-nota" value={b.nota} maxLength={60} placeholder="Opcional" onChange={(e) => cambiar({ nota: e.target.value })} /></div>
                <div className="f"><label className="lab" htmlFor="m-fecha">Fecha</label><input className="inp" id="m-fecha" type="date" value={b.fecha} onChange={(e) => cambiar({ fecha: e.target.value })} /></div>
              </div>
              {notas.length > 0 && (
                <div className="chips">
                  <span className="xs m" style={{ alignSelf: 'center' }}>Sugeridas:</span>
                  {notas.map((n) => <button key={n} type="button" className="chip" style={{ height: 34, fontSize: 13 }} onClick={() => cambiar({ nota: n })}>{n}</button>)}
                </div>
              )}
            </>
          )}
        </div>
        <div className="actions">
          {f.editando && <BotonDosToques className="btn del izq" texto="Borrar" armado="Toca otra vez para borrar" alConfirmar={() => { app.borrarMovimiento(b.id); alCerrar(); aviso('Movimiento borrado'); }} />}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}
