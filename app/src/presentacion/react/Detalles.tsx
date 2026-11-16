// Layer 5 · Presentation: the detail of a debt (PAN-07, the v1's vDeuda) and of a goal (PAN-08, the v1's vMeta).
import { useState } from 'react';
import type { TipoPago, VistaDeuda, VistaMeta } from '@rumbo/contratos';
import { Fila } from './Movimientos';
import { decimal, dinero, enMoneda, mesCorto, numero, porcentaje } from '../modelos/formato';

export interface AccionesDeuda {
  volver: () => void;
  editar: () => void;
  pago: (tipo: TipoPago) => void;
  adelanto: (bs: number) => void;
  ver: (movId: string) => void;
}

export function DetalleDeuda({ v, adelanto, acc }: { v: VistaDeuda; adelanto: number; acc: AccionesDeuda }) {
  const te = v.tipo === 'teDeben', P = v.prestamo;
  const volver = <div className="top"><button className="ib" onClick={acc.volver} aria-label="Volver">‹</button></div>;
  if (!P) {
    return (
      <>
        {volver}
        <div><div className="ey">{te ? 'Te deben' : 'Deuda con una persona'}</div><h1 className="h1" style={{ marginTop: 4 }}>{v.nombre}</h1></div>
        <section className={`blk ${te ? 'v' : 'l'}`}>
          <span className="k">{te ? 'Te debe' : 'Por pagar'}</span><span className="big">{enMoneda(v.saldo, v.moneda)}</span>
          <span className="xs" style={{ opacity: 0.9 }}>Sin interés{v.fechaEsperada ? ` · ${te ? 'esperas el pago' : 'pagar'} en ${mesCorto(v.fechaEsperada)}` : ''}</span>
        </section>
        {v.movimientos.length > 0 && <div className="rows">{v.movimientos.map((m) => <Fila key={m.id} m={m} alTocar={() => acc.ver(m.id)} />)}</div>}
        <div className="actions">
          <button className="btn sec" onClick={acc.editar}>Editar</button>
          {te
            ? <><button className="btn sec" onClick={() => acc.pago('prestamo')}>Prestar más</button><button className="btn" onClick={() => acc.pago('cobro')}>Registrar un cobro</button></>
            : <><button className="btn sec" onClick={() => acc.pago('recibido')}>Recibir más</button><button className="btn" onClick={() => acc.pago('pago')}>Registrar un pago</button></>}
        </div>
      </>
    );
  }
  const A = P.adelanto;
  return (
    <>
      {volver}
      <div><div className="ey">Préstamo</div><h1 className="h1" style={{ marginTop: 4 }}>{v.nombre}</h1></div>
      <section className="blk l" aria-label="Por pagar">
        <span className="k">Por pagar</span><span className="big">{enMoneda(v.saldo, v.moneda)}</span>
        <div className="bar" style={{ height: 10 }}><span style={{ width: `${P.inicial ? Math.round((P.pagado / P.inicial) * 100) : 0}%`, background: '#7FD3A0' }} /></div>
        <span className="xs" style={{ opacity: 0.88 }}>Pagaste {enMoneda(P.pagado, v.moneda)} de {enMoneda(P.inicial, v.moneda)} desde que lo registraste.</span>
      </section>
      <section className="tiles">
        <div className="tile a1"><span className="xs">Terminas</span><span className="v">{P.crece ? '—' : P.fin ? mesCorto(P.fin) : 'pagado'}</span><span className="xs">{P.crece ? 'la cuota no cubre el interés' : `faltan ${P.cuotas} cuotas`}</span></div>
        <div className="tile m1"><span className="xs">Interés por pagar</span><span className="v">{enMoneda(P.interesPorPagar, v.moneda)}</span><span className="xs">si sigues igual</span></div>
        <div className="tile"><span className="xs m">Interés anual</span><span className="v">{porcentaje(P.tasa)} %</span><span className="xs m">{decimal(P.tasa / 12, 2)} % al mes</span></div>
        <div className="tile"><span className="xs m">Cuota</span><span className="v">{enMoneda(P.cuota, v.moneda)}</span><span className="xs m">día {P.dia || '—'}</span></div>
      </section>
      {P.crece && <div className="alert r"><span>La cuota no cubre el interés del mes: esta deuda crece.</span></div>}
      <section className="card" aria-label="Próximas cuotas">
        <h2 className="h2">Próximas cuotas</h2>
        <div className="tablewrap">
          <table className="t">
            <thead><tr><th>Mes</th><th>Interés</th><th>Capital</th><th>Queda</th></tr></thead>
            <tbody>{P.proximas.map((f) => <tr key={f.mes}><td>{mesCorto(f.mes)}</td><td>{numero(f.interes, 2)}</td><td>{numero(f.capital, 2)}</td><td>{numero(f.saldo, 2)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="xs m">El interés cuenta como gasto (Intereses). El capital no: es dinero que deja de deberse.</div>
      </section>
      <section className="card">
        <h2 className="h2">¿Y si adelantas?</h2>
        <div className="wi">
          <div className="ln"><label htmlFor="adel">Pago extra al mes</label><output className="m sm" id="adelOut">{dinero(adelanto * 100, 0, true)}</output></div>
          <input type="range" id="adel" min={0} max={2000} step={100} value={adelanto} onChange={(e) => acc.adelanto(Number(e.target.value))} />
        </div>
        <div>
          {A && (
            <div className="blk v" style={{ padding: 14, borderRadius: 14, gap: 4, fontSize: 14 }}>
              <span>Terminarías en <b>{mesCorto(A.fin)}</b>, {A.mesesAntes} meses antes, y pagarías <b>{dinero(A.interesAhorrado)} menos</b> de interés.</span>
              <span style={{ opacity: 0.9 }}>Tu libre al día bajaría a {dinero(A.libreAlDia)}.</span>
            </div>
          )}
        </div>
      </section>
      <div className="actions">
        <button className="btn sec" onClick={acc.editar}>Editar</button>
        <button className="btn sec" onClick={() => acc.pago('recibido')}>Recibir más</button>
        <button className="btn" onClick={() => acc.pago('pago')}>Registrar un pago</button>
      </div>
    </>
  );
}

export interface AccionesMeta {
  volver: () => void;
  editar: () => void;
  apartar: (cuentaId: string, monto: string, signo: 1 | -1) => boolean; // true: done
}

export function DetalleMeta({ v, acc }: { v: VistaMeta; acc: AccionesMeta }) {
  const [elegida, setElegida] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const sel = elegida && v.cuentas.some((c) => c.id === elegida) ? elegida : v.cuentas[0]?.id ?? '';
  const apartar = (signo: 1 | -1): void => { if (acc.apartar(sel, monto, signo)) setMonto(''); };
  return (
    <>
      <div className="top"><button className="ib" onClick={acc.volver} aria-label="Volver">‹</button></div>
      <div><div className="ey">Meta · para {mesCorto(v.mes)}</div><h1 className="h1" style={{ marginTop: 4 }}>{v.nombre}</h1></div>
      <section className="blk v" aria-label="Llevas">
        <div className="sp"><span className="k">Llevas</span><span className="xs" style={{ background: '#fff', color: '#0B5C40', borderRadius: 99, padding: '2px 9px', fontWeight: 700 }}>{v.vasBien ? 'Vas bien' : 'No alcanza'}</span></div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><span className="big">{dinero(v.ap)}</span><span style={{ opacity: 0.9 }}>de {dinero(v.monto)}</span></div>
        <div className="bar" style={{ height: 10 }}><span style={{ width: `${Math.round(v.pct * 100)}%` }} /></div>
        <span className="xs" style={{ opacity: 0.9 }}>A tu ritmo ahorras {dinero(v.neto)} al mes; tus metas piden {dinero(v.pide)}.{v.vasBien ? '' : ` Faltan ${dinero(v.faltaMes)} al mes.`}</span>
      </section>
      <section className="card">
        <div className="sp"><span>Aporte sugerido</span><span className="amt">{dinero(v.aporte)} al mes</span></div>
        <div className="xs m" style={{ marginTop: -6 }}>Te faltan {dinero(Math.max(0, v.monto - v.ap))} en {v.meses} {v.meses === 1 ? 'mes' : 'meses'}.</div>
        <div className="sp"><span>Este mes apartaste</span><span className="amt">{dinero(v.esteMes)}</span></div>
        <div className="sp" style={{ background: 'var(--ambar-s)', color: 'var(--ambar-t)', borderRadius: 10, padding: '8px 10px', fontWeight: 600 }}><span>Falta este mes</span><span className="amt">{dinero(v.falta)}</span></div>
        <div className="xs m" style={{ marginTop: -6 }}>Se resta de tu libre del día hasta que lo apartes.</div>
      </section>
      <section className="card" aria-label="Apartar">
        <h2 className="h2">Apartar</h2>
        <div className="xs m" style={{ marginTop: -6 }}>El dinero no se mueve: queda reservado en su cuenta y deja de contar como disponible.</div>
        <div className="f"><label className="lab" htmlFor="ap-monto">Monto</label><input className="inp" id="ap-monto" inputMode="decimal" placeholder={numero(Math.round(v.falta / 100) * 100)} value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
        <div className="chips">
          {v.cuentas.map((c) => <button key={c.id} className="chip" aria-pressed={c.id === sel} onClick={() => setElegida(c.id)}>{c.nombre} · {enMoneda(c.libre, c.moneda, 2)} libres</button>)}
        </div>
        <div className="actions"><button className="btn sec" onClick={() => apartar(-1)}>Desapartar</button><button className="btn" onClick={() => apartar(1)}>Apartar</button></div>
      </section>
      <section className="card">
        <h2 className="h2">Dónde está</h2>
        {v.dondeEsta.length
          ? v.dondeEsta.map((d) => <div key={d.cuentaId} className="sp"><span>{d.cuenta}</span><span className="amt">{enMoneda(d.monto, d.moneda, 2)}{d.enBs != null ? ` · ≈ ${dinero(d.enBs)}` : ''}</span></div>)
          : <span className="xs m">Todavía no apartaste nada.</span>}
      </section>
      <div className="actions"><button className="btn sec" onClick={acc.editar}>Editar</button></div>
    </>
  );
}
