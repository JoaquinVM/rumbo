// Layer 5 · Presentation: the Rumbo screen (PAN-02), the v1's vRumbo. In order: headline and chart, Hoy, Por confirmar,
// warnings, goals, indicators and «¿Y si…?». Same texts and numbers as the v1.
import { useState } from 'react';
import type { VistaRumbo } from '@rumbo/contratos';
import { grafica } from '../modelos/grafica';
import { decimal, diaDelMes, dinero, mesCorto, numero, paraEditar, porcentaje, usd } from '../modelos/formato';

export interface AjustesRumbo {
  anios: number;
  nominal: boolean;
  recortes: Record<string, number>;
  extra: number; // in whole Bs, as the slider
  adelanto: number; // in whole Bs
}

export interface AccionesRumbo {
  cambiar: (a: Partial<AjustesRumbo>) => void;
  confirmar: (clave: string, monto: string) => void;
  saltar: (clave: string) => void;
  ajustes: () => void;
  meta: (id: string | null) => void;
}

const anioTexto = (n: number): string => (n === 1 ? 'un año' : `${n} años`);

function Grafica({ v, alt }: { v: VistaRumbo; alt: boolean }) {
  const g = grafica([
    { datos: v.serie, color: v.netoNegativo ? 'var(--rojo)' : 'var(--azul-l)', relleno: true },
    ...(alt && v.serieAjustes ? [{ datos: v.serieAjustes, color: 'var(--verde)', punteada: true, ancho: 2.5 }] : []),
  ], v.meses, v.hoy, v.marcas);
  return (
    <svg viewBox={`0 0 ${g.ancho} ${g.alto}`} role="img" aria-label="Proyección de tu patrimonio">
      {g.guias.map((l, i) => (
        <g key={i}>
          <line x1={g.izquierda} x2={g.derecha} y1={l.y} y2={l.y} stroke="var(--line)" strokeWidth={l.cero ? 1.5 : 1} strokeDasharray={l.cero ? undefined : '2 4'} />
          <text className="lbl" x={g.izquierda - 8} y={l.y + 4} textAnchor="end">{l.texto}</text>
        </g>
      ))}
      {g.etiquetas.map((e, i) => <text key={i} className="lbl" x={e.x} y={g.alto - 8} textAnchor={e.ancla}>{e.texto}</text>)}
      {g.marcas.map((m, i) => m.tipo === 'linea' ? (
        <g key={i}>
          <line x1={m.x} x2={m.x} y1={g.arriba + 10} y2={g.base} stroke="var(--ink)" strokeDasharray="3 3" opacity=".45" />
          <text className="lbl" x={m.xTexto} y={g.arriba + 18} fill="var(--ink)">{m.texto}</text>
        </g>
      ) : (
        <rect key={i} x={m.x - 4.5} y={g.base - 13} width={9} height={9} rx={2} fill="var(--verde)"><title>{m.texto}</title></rect>
      ))}
      {g.series.map((s, i) => (
        <g key={i}>
          {s.relleno && <polygon points={s.relleno} fill={s.color} opacity=".14" />}
          <polyline points={s.puntos} fill="none" stroke={s.color} strokeWidth={s.ancho} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.punteada ? '6 5' : undefined} />
          <circle cx={s.fin.x} cy={s.fin.y} r={5} fill={s.color} stroke="var(--bg)" strokeWidth={2} />
        </g>
      ))}
    </svg>
  );
}

export function Rumbo({ v, a, acc }: { v: VistaRumbo; a: AjustesRumbo; acc: AccionesRumbo }) {
  const [montos, setMontos] = useState<Record<string, string>>({});
  const t = v.titular, H = v.hoyBloque, I = v.indicadores, hz = anioTexto(a.anios);
  const hayAjustes = !!v.ySi.resultado;
  const color = v.netoNegativo ? 'var(--rojo)' : 'var(--azul-l)';
  const p = v.titular.patrimonio;
  const sub = t.seAcabaEn ? `Cada mes sale ${dinero(t.salePorMes)} más de lo que entra.`
    : `${a.nominal ? 'En montos nominales' : `En plata de hoy, con ${porcentaje(t.inflacion)} % de inflación`}. ${a.nominal ? '' : `Son ${dinero(t.nominalFinal)} nominales, `}unos ${usd(t.enDolares)}. Hoy tienes ${dinero(p.total)}: tus cuentas suman ${dinero(p.cuentas)}${p.deudas || p.teDeben ? ` y tus deudas, ${dinero(p.deudas - p.teDeben)} netas` : ''}.`;
  const proxTxt = H.prox ? `hasta tu ${H.prox.nombre.toLowerCase()} del ${diaDelMes(H.prox.fecha)}` : 'hasta fin de mes';
  const r = v.ySi.resultado, ad = r?.adelanto;
  const adelTxt = ad && v.ySi.prestamo ? ` Terminas ${v.ySi.prestamo.nombre.toLowerCase()} en ${mesCorto(ad.fin)}, ${ad.mesesAntes} meses antes, y ahorras ${dinero(ad.interesAhorrado)} de interés.` : '';

  return (
    <>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ey">Tu rumbo</div>
        <h1 style={{ fontSize: 'clamp(27px,7.4vw,34px)', lineHeight: 1.08, fontWeight: 700 }}>
          {t.seAcabaEn
            ? <>A este ritmo, tus ahorros se acaban en <span style={{ color: 'var(--rojo)', fontWeight: 800 }}>{mesCorto(t.seAcabaEn)}</span>.</>
            : <>A este ritmo, en {hz} tendrás <span style={{ color: 'var(--azul-l)', fontWeight: 800, whiteSpace: 'nowrap' }}>{dinero(t.final)}</span>.</>}
        </h1>
        <p className="m" style={{ margin: 0 }}>{sub}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <div className="seg" role="group" aria-label="Horizonte">
            {[1, 5, 10, 20].map((n) => (
              <button key={n} aria-pressed={a.anios === n} onClick={() => acc.cambiar({ anios: n })}>{n} {n === 1 ? 'año' : 'años'}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Montos">
            <button aria-pressed={!a.nominal} onClick={() => acc.cambiar({ nominal: false })}>Plata de hoy</button>
            <button aria-pressed={a.nominal} onClick={() => acc.cambiar({ nominal: true })}>Nominal</button>
          </div>
        </div>
        <div className="chart"><Grafica v={v} alt={hayAjustes} /></div>
        <div className="legend">
          <span><i style={{ background: color }} />Si sigues igual</span>
          {hayAjustes && <span><i style={{ background: 'var(--verde)' }} />Con tus ajustes</span>}
          {v.hayMetas && <span><i style={{ background: 'var(--verde)', width: 9, height: 9, borderRadius: 2 }} />Metas</span>}
          {v.tcFijo != null && <span>Tipo de cambio fijo en Bs {decimal(v.tcFijo, 2)}</span>}
        </div>
      </section>

      <section className="blk b" aria-label="Hoy">
        <div className="sp"><span className="k">Hoy</span><span className="xs" style={{ opacity: 0.88 }}>{proxTxt}</span></div>
        {H.libre >= 0
          ? <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><span className="big">{dinero(H.alDia)}</span><span style={{ opacity: 0.92 }}>al día, por {H.dias} {H.dias === 1 ? 'día' : 'días'}</span></div>
          : <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><span className="big">{dinero(H.libre)}</span><span style={{ opacity: 0.92 }}>te pasaste {dinero(-H.libre)} de lo disponible</span></div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 10 }}>
          <div className="ln"><span>En tus cuentas del día a día</span><span className="amt">{dinero(H.disp)}</span></div>
          <div className="ln" style={{ opacity: 0.82 }}><span>− Fijos por pagar antes</span><span className="amt">{dinero(H.compBs)}</span></div>
          <div className="ln" style={{ opacity: 0.82 }}><span>− Falta apartar para metas este mes</span><span className="amt">{dinero(H.metas)}</span></div>
          <div className="ln hl"><span>Libre</span><span className="amt">{dinero(H.libre)}</span></div>
        </div>
      </section>

      {v.porConfirmar.length > 0 && (
        <section className="blk a" aria-label="Por confirmar">
          <div className="sp"><span className="k">Por confirmar · {v.porConfirmar.length}</span></div>
          {v.porConfirmar.map((pc) => {
            const k = pc.clave, valor = montos[k] ?? paraEditar(pc.monto);
            return (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 10 }}>
                <div className="sp">
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{pc.nombre} · {pc.cuenta}</span>
                  <span className="xs" style={{ opacity: 0.88 }}>{pc.fecha === v.hoy ? 'vence hoy' : `venció el ${diaDelMes(pc.fecha)}`}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="xs" htmlFor={`pc-${k}`} style={{ opacity: 0.9 }}>Monto</label>
                  <input className="inp" id={`pc-${k}`} inputMode="decimal" value={valor} style={{ width: 130, height: 42 }}
                    onChange={(e) => setMontos((m) => ({ ...m, [k]: e.target.value }))} />
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    <button className="btn sec" onClick={() => acc.saltar(k)}>No este mes</button>
                    <button className="btn sm" onClick={() => acc.confirmar(k, valor)}>Confirmar</button>
                  </span>
                </div>
              </div>
            );
          })}
          {v.proximos.length > 0 && (
            <div className="xs" style={{ opacity: 0.88, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 8 }}>
              Próximos: {v.proximos.map((x) => `${x.nombre} el ${diaDelMes(x.fecha)}`).join(' · ')}
            </div>
          )}
        </section>
      )}

      {(v.avisoTipoDeCambio || v.avisosTopes.length > 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {v.avisoTipoDeCambio && (
            <div className="alert">
              <span>{v.avisoTipoDeCambio.dias == null ? 'Pon el tipo de cambio que usas.' : `Tu tipo de cambio es de hace ${v.avisoTipoDeCambio.dias} días (Bs ${decimal(v.avisoTipoDeCambio.tc, 2)}).`}</span>
              <button className="btn sm" onClick={acc.ajustes}>Actualizar</button>
            </div>
          )}
          {v.avisosTopes.map((x) => x.nivel === 'rojo'
            ? <div key={x.nombre} className="alert r"><span>{x.nombre}: te pasaste {dinero(x.gastado - x.tope)} de tu tope de {dinero(x.tope)}.</span></div>
            : <div key={x.nombre} className="alert"><span>{x.nombre}: llevas {dinero(x.gastado)} de tu tope de {dinero(x.tope)} ({Math.round(x.pct * 100)} %).</span></div>)}
        </section>
      )}

      {v.metas.lista.length > 0 ? (
        <section className="blk v" aria-label="Metas">
          <div className="sp"><span className="k">Metas</span><span className="xs" style={{ opacity: 0.88 }}>aparta {dinero(v.metas.pide)} al mes</span></div>
          {v.metas.lista.map((x) => (
            <button key={x.id} onClick={() => acc.meta(x.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="ln"><span style={{ fontWeight: 600 }}>{x.nombre}</span><span className="amt">{dinero(x.ap)} / {numero(x.monto)}</span></div>
              <div className="bar"><span style={{ width: `${Math.round(x.pct * 100)}%` }} /></div>
              <div className="xs" style={{ opacity: 0.88 }}>{mesCorto(x.mes)} · {v.metas.vasBien ? 'vas bien' : 'no alcanza'} · aparta {dinero(x.aporte)} al mes</div>
            </button>
          ))}
          {!v.metas.vasBien && <div className="ln hl"><span>No alcanza: faltan</span><span className="amt">{dinero(v.metas.faltaMes)} al mes</span></div>}
        </section>
      ) : (
        <button className="add" onClick={() => acc.meta(null)}>+ Crea una meta: «Fondo de emergencia para diciembre»</button>
      )}

      <section className="tiles" aria-label="Indicadores">
        <div className="tile v1"><span className="xs">Tasa de ahorro</span><span className="v">{Math.round(I.tasa * 100)} %</span><span className="xs">de lo que ganas</span></div>
        <div className="tile a1"><span className="xs">Colchón</span><span className="v">{I.colchon >= 99 ? '99+' : decimal(I.colchon, 1)} meses</span><span className="xs">sin ingresos</span></div>
        <div className="tile"><span className="xs m">Neto al mes</span><span className="v" style={I.neto < 0 ? { color: 'var(--rojo)' } : undefined}>{dinero(I.neto, 0, true)}</span><span className="xs m">entra {numero(I.ingreso)} · sale {numero(I.gasto)}</span></div>
        <div className="tile m1"><span className="xs">Deudas</span><span className="v">{dinero(I.deudaTotal)}</span><span className="xs">{I.hayPrestamos ? (I.libreDePrestamos ? `sin préstamos en ${mesCorto(I.libreDePrestamos)}` : 'un préstamo no baja') : 'sin préstamos'}</span></div>
      </section>

      <section className="card" aria-label="¿Y si…?">
        <h2 className="h2">¿Y si…?</h2>
        <div className="xs m" style={{ marginTop: -6 }}>Mueve una palanca y mira la línea verde.</div>
        {!v.ySi.categorias.length && <p className="note" style={{ margin: 0 }}>Anota algunos gastos y aquí aparecen tus categorías más grandes.</p>}
        {v.ySi.categorias.map((k) => {
          const pct = a.recortes[k.id] || 0;
          return (
            <div key={k.id} className="wi">
              <div className="ln"><label htmlFor={`wi-${k.id}`}>Gastar menos en {k.nombre.toLowerCase()}</label><output className="m sm">{pct ? `−${pct} % · ${dinero((k.promedio * pct) / 100)}/mes` : `${dinero(k.promedio)}/mes`}</output></div>
              <input type="range" id={`wi-${k.id}`} min={0} max={60} step={5} value={pct} onChange={(e) => acc.cambiar({ recortes: { ...a.recortes, [k.id]: Number(e.target.value) } })} />
            </div>
          );
        })}
        <div className="wi">
          <div className="ln"><label htmlFor="wi-extra">Ingreso extra al mes</label><output className="m sm">{dinero(a.extra * 100, 0, true)}</output></div>
          <input type="range" id="wi-extra" min={0} max={v.ySi.maxExtra} step={250} value={a.extra} onChange={(e) => acc.cambiar({ extra: Number(e.target.value) })} />
        </div>
        {v.ySi.prestamo && (
          <div className="wi">
            <div className="ln"><label htmlFor="wi-adel">Adelantar {v.ySi.prestamo.nombre.toLowerCase()}</label><output className="m sm">{dinero(a.adelanto * 100, 0, true)}/mes</output></div>
            <input type="range" id="wi-adel" min={0} max={2000} step={100} value={a.adelanto} onChange={(e) => acc.cambiar({ adelanto: Number(e.target.value) })} />
          </div>
        )}
        <div>
          {r && (
            <div className="blk v" style={{ padding: 14, borderRadius: 14, gap: 4, fontSize: 14 }}>
              <span>En {hz} tendrías <b style={{ font: '800 22px var(--display)' }}>{dinero(r.final)}</b>, {dinero(r.diferencia, 0, true)} frente a seguir igual.{adelTxt}</span>
              <button className="btn sec" onClick={() => acc.cambiar({ recortes: {}, extra: 0, adelanto: 0 })} style={{ alignSelf: 'flex-start', height: 36, padding: 0 }}>Quitar ajustes</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
