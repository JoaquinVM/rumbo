// Layer 5 · Presentation: the Desglose (DES-01 to DES-06), the v1's vDesglose. Tapping a category opens Movimientos of
// that month with that category and every account (DES-05, decision 64).
import type { CategoriaDesglose, VistaDesglose } from '@rumbo/contratos';
import { Icono } from './comunes';
import { compacto, decimal, dinero, mesLargo, nombreDelMes, numero } from '../modelos/formato';

export interface AccionesDesglose {
  mes: (n: number) => void;
  categoria: (id: string) => void;
}

const Flecha = () => <span className="m" aria-hidden="true">›</span>;

export function Desglose({ v, acc }: { v: VistaDesglose; acc: AccionesDesglose }) {
  const ing = v.entro || 1, max = Math.max(1, ...v.categorias.map((l) => l.total)), maxIng = Math.max(1, ...v.ingresos.map((l) => l.total));
  const det = (l: CategoriaDesglose): string =>
    `${v.entro && l.deCada100 != null ? `Bs ${decimal(l.deCada100)} de cada 100` : ''}${l.horas != null ? ` · ${l.horas} h` : ''}${l.enDiezAnios ? ` · en 10 años: ${compacto(l.enDiezAnios / 100)}` : ''}`;
  const fuera = [
    v.ajustes ? `${dinero(v.ajustes, 0, true)} por cuadres` : '',
    v.cambio ? `${dinero(v.cambio, 0, true)} por cambio de moneda` : '',
    v.cierres ? `${dinero(v.cierres, 0, true)} por deudas cerradas` : '',
  ].filter(Boolean).join(', ');
  return (
    <>
      <div className="monthnav">
        <button className="ib" onClick={() => acc.mes(-1)} aria-label="Mes anterior">‹</button>
        <h1>{mesLargo(v.mes)}</h1>
        <button className="ib" onClick={() => acc.mes(1)} aria-label="Mes siguiente">›</button>
      </div>
      <section className="blk b" aria-label="Resumen del mes">
        <div className="sp"><span className="k">A dónde va cada Bs 100</span><span className="xs" style={{ opacity: 0.88 }}>{v.porHora ? `Bs ${numero(v.porHora)} por hora de trabajo` : ''}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Entró</span><span style={{ font: '800 21px var(--display)' }}>{dinero(v.entro)}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Salió</span><span style={{ font: '800 21px var(--display)' }}>{dinero(v.salio)}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Quedó</span><span style={{ font: '800 21px var(--display)' }}>{dinero(v.quedo)}</span></div>
        </div>
        <div style={{ display: 'flex', height: 14, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,.2)' }} aria-hidden="true">
          {v.categorias.map((l) => <span key={l.categoria.id} style={{ width: `${(l.total / Math.max(ing, v.salio)) * 100}%`, background: l.categoria.color }} />)}
          {v.quedo > 0 && <span style={{ width: `${(v.quedo / ing) * 100}%`, background: '#fff' }} />}
        </div>
        {!!v.capital && <span className="xs" style={{ opacity: 0.92 }}>Además, {dinero(v.capital)} {v.capital >= 0 ? 'bajaron' : 'subieron'} tus deudas: el capital de una cuota no es gasto.</span>}
        {fuera && <span className="xs" style={{ opacity: 0.92 }}>Fuera de tus gastos, tu patrimonio cambió {fuera}.</span>}
      </section>
      {v.categorias.length ? v.categorias.map((l) => {
        const k = l.categoria, d = det(l);
        if (l.tope && l.nivel && l.nivel !== 'ok' && l.pctTope != null) {
          return (
            <button key={k.id} className={`blk ${l.nivel === 'rojo' ? 'r' : 'a'}`} onClick={() => acc.categoria(k.id)}>
              <div className="sp"><span style={{ fontWeight: 600 }}>{k.nombre}</span><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ font: '800 22px var(--display)' }}>{dinero(l.total)}</span><span aria-hidden="true">›</span></span></div>
              <div className="bar"><span style={{ width: `${Math.min(100, l.pctTope * 100)}%` }} /></div>
              <span className="xs" style={{ opacity: 0.92 }}>{l.nivel === 'rojo' ? `Te pasaste ${dinero(l.total - l.tope)} de tu tope de ${dinero(l.tope)}` : `${Math.round(l.pctTope * 100)} % de tu tope de ${dinero(l.tope)}`}{d ? ' · ' + d : ''}</span>
            </button>
          );
        }
        return (
          <button key={k.id} className="card" onClick={() => acc.categoria(k.id)} style={{ gap: 6, padding: '12px 14px' }}>
            <div className="sp" style={{ alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="dt" style={{ width: 30, height: 30, borderRadius: 9, background: k.color }}><Icono nombre={k.icono} /></span>{k.nombre}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="amt">{dinero(l.total)}</span><Flecha /></span>
            </div>
            <div className="bar"><span style={{ width: `${(l.total / max) * 100}%`, background: k.color }} /></div>
            <div className="xs m">{l.tope ? `${Math.round((l.total / l.tope) * 100)} % de tu tope de ${dinero(l.tope)} · ` : ''}{d}</div>
          </button>
        );
      }) : <div className="empty"><h3>Sin gastos en {nombreDelMes(v.mes)}</h3>Cuando anotes gastos verás a dónde va tu dinero.</div>}
      {v.quedo > 0 && v.entro > 0 && (
        <section className="blk v"><div className="sp"><span style={{ fontWeight: 600 }}>Te quedas tú</span><span style={{ font: '800 22px var(--display)' }}>{dinero(v.quedo)}</span></div><span className="xs" style={{ opacity: 0.92 }}>Bs {decimal((v.quedo / ing) * 100)} de cada 100</span></section>
      )}
      {v.ingresos.length > 0 && (
        <section aria-label="De dónde entró" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2" style={{ margin: '6px 0 0' }}>De dónde entró</h2>
          {v.ingresos.map((l) => {
            const k = l.categoria;
            return (
              <button key={k.id} className="card" onClick={() => acc.categoria(k.id)} style={{ gap: 6, padding: '12px 14px' }}>
                <div className="sp" style={{ alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="dt" style={{ width: 30, height: 30, borderRadius: 9, background: k.color }}><Icono nombre={k.icono} /></span>{k.nombre}</span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="amt" style={{ color: 'var(--in)' }}>{dinero(l.total)}</span><Flecha /></span>
                </div>
                <div className="bar"><span style={{ width: `${(l.total / maxIng) * 100}%`, background: k.color }} /></div>
                <div className="xs m">Bs {decimal(l.deCada100)} de cada 100</div>
              </button>
            );
          })}
        </section>
      )}
      <p className="xs m" style={{ margin: 0 }}>«En 10 años» usa tu promedio de los últimos 3 meses, sin inflación ni rendimiento.</p>
    </>
  );
}
