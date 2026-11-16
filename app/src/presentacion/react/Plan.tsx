// Layer 5 · Presentation: Plan (PAN-03, PAN-07, PAN-08, PAN-09), the v1's vPlan, and the categories and limits (the
// v1's vCategorias). The balance of each account shows with 2 decimals; the totals without (FMT-02, decision 63).
import type { CategoriaEditable, VistaPlan } from '@rumbo/contratos';
import { Cuadrito } from './comunes';
import { colorCuenta, iconoCuenta } from '../modelos/cuentas';
import { dinero, enMoneda, mesCorto, numero, porcentaje } from '../modelos/formato';

export interface AccionesPlan {
  cuenta: (id?: string) => void;
  cuadrar: (id: string) => void;
  fijo: (id?: string) => void;
  verDeuda: (id: string) => void;
  nuevaDeuda: () => void;
  verMeta: (id: string) => void;
  nuevaMeta: () => void;
  categorias: () => void;
}

export function Plan({ v, acc }: { v: VistaPlan; acc: AccionesPlan }) {
  const p = v.patrimonio;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}><div><div className="ey">Tu plan</div><h1 className="h1" style={{ marginTop: 4 }}>Plan</h1></div></div>
      <section className="blk b" aria-label="Patrimonio">
        <span className="k">Patrimonio</span><span className="big">{dinero(p.total)}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Cuentas</span><b className="num">{dinero(p.cuentas)}</b></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Te deben</span><b className="num">{dinero(p.teDeben)}</b></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Deudas</span><b className="num">{dinero(p.deudas)}</b></div>
        </div>
      </section>

      <div className="sh"><h2 className="h2">Cuentas</h2><span className="xs m">{dinero(p.cuentas)}</span></div>
      <div className="rows">
        {v.cuentas.map((c) => (
          <div key={c.id} className="row">
            <Cuadrito icono={iconoCuenta(c)} color={colorCuenta(c)} />
            <button className="grow" onClick={() => acc.cuenta(c.id)} style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span className="t">{c.nombre}{c.diaADia && <span className="tag">Día a día</span>}</span>
              <span className="xs m">{c.rendimiento ? `${porcentaje(c.rendimiento)} % anual` : 'No rinde'}{c.apartado ? ` · ${enMoneda(c.apartado, c.moneda)} apartado` : ''}</span>
            </button>
            <span className="amt" style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span>{enMoneda(c.saldo, c.moneda, 2)}</span>
              {c.enBs != null && <span className="xs m" style={{ fontWeight: 400 }}>≈ {dinero(c.enBs)}</span>}
            </span>
            <button className="btn sm" onClick={() => acc.cuadrar(c.id)}>Cuadrar</button>
          </div>
        ))}
        <button className="add" onClick={() => acc.cuenta()}>+ Agregar cuenta</button>
      </div>

      <div className="sh"><h2 className="h2">Fijos</h2><span className="xs m">entra {dinero(v.fijosEntra)} · sale {dinero(v.fijosSale)}</span></div>
      <div className="rows">
        {v.fijos.map((f) => (
          <button key={f.id} className={`row ${f.pendiente ? 'pend' : ''}`} onClick={() => acc.fijo(f.id)}>
            <Cuadrito icono={f.icono} color={f.pendiente ? 'var(--ambar)' : f.categoria.color} />
            <span className="grow"><span className="t">{f.nombre}</span><span className={`xs ${f.pendiente ? '' : 'm'}`}>{f.categoria.nombre} · {f.cuenta} · día {f.dia}{f.pendiente ? ' · por confirmar' : ''}</span></span>
            <span className={`amt ${f.tipo === 'ingreso' ? 'in' : ''}`}>{f.tipo === 'ingreso' ? '+' : ''}{enMoneda(f.monto, f.moneda)}</span>
          </button>
        ))}
        <button className="add" onClick={() => acc.fijo()}>+ Agregar fijo</button>
      </div>

      <div className="sh"><h2 className="h2">Deudas</h2><span className="xs m">debes {dinero(p.deudas)} · te deben {dinero(p.teDeben)}</span></div>
      <div className="rows">
        {v.deudas.map((d) => {
          const sub = d.tipo === 'prestamo'
            ? `${porcentaje(d.interes)} % · cuota ${enMoneda(d.cuota, d.moneda)} · ${d.crece ? 'la cuota no cubre el interés' : d.fin ? `terminas ${mesCorto(d.fin)}` : 'pagado'}`
            : d.tipo === 'persona' ? `Sin interés${d.fechaEsperada ? ` · pagar en ${mesCorto(d.fechaEsperada)}` : ''}`
              : `Te debe${d.fechaEsperada ? ` · esperas el pago en ${mesCorto(d.fechaEsperada)}` : ''}`;
          const [ico, col] = d.tipo === 'prestamo' ? ['porcentaje', '#B5482E'] : d.tipo === 'persona' ? ['persona', '#C08A1F'] : ['personaIn', '#1E7A55'];
          return (
            <button key={d.id} className="row" onClick={() => acc.verDeuda(d.id)}>
              <Cuadrito icono={ico} color={col} />
              <span className="grow"><span className="t">{d.nombre}</span><span className="xs m">{sub}</span></span>
              <span className={`amt ${d.tipo === 'teDeben' ? 'in' : ''}`}>{d.tipo === 'teDeben' ? '+' : ''}{enMoneda(d.saldo, d.moneda)}</span>
            </button>
          );
        })}
        <button className="add" onClick={acc.nuevaDeuda}>+ Agregar deuda o préstamo dado</button>
      </div>

      <div className="sh"><h2 className="h2">Metas</h2><span className="xs m">{dinero(v.apartadoMetas)} apartado</span></div>
      <div className="rows">
        {v.metas.length > 0 && (
          <section className="blk v" aria-label="Metas">
            {v.metas.map((x) => (
              <button key={x.id} onClick={() => acc.verMeta(x.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="ln"><span style={{ fontWeight: 600 }}>{x.nombre}</span><span className="amt">{dinero(x.ap)} / {numero(x.monto)}</span></div>
                <div className="bar"><span style={{ width: `${Math.round(x.pct * 100)}%` }} /></div>
                <span className="xs" style={{ opacity: 0.88 }}>{mesCorto(x.mes)} · aparta {dinero(x.aporte)} al mes</span>
              </button>
            ))}
          </section>
        )}
        <button className="add" onClick={acc.nuevaMeta}>+ Agregar meta</button>
      </div>

      <div className="sh"><h2 className="h2">Categorías y topes</h2></div>
      <button className="row" onClick={acc.categorias}>
        <span className="grow">
          <span className="t">{v.categorias.cantidad} categorías · {v.categorias.topes.length} con tope</span>
          <span className="xs m">{v.categorias.topes.length ? v.categorias.topes.map((k) => `${k.nombre} ${dinero(k.tope)}`).join(' · ') : 'Pon un tope mensual a las que quieras cuidar'}</span>
        </span>
        <span className="m" aria-hidden="true">›</span>
      </button>
    </>
  );
}

export function Categorias({ v, alVolver, editar }: { v: CategoriaEditable[]; alVolver: () => void; editar: (id?: string) => void }) {
  const fila = (k: CategoriaEditable) => (
    <button key={k.id} className="row" onClick={() => editar(k.id)}>
      <Cuadrito icono={k.icono} color={k.color} />
      <span className="grow"><span className="t">{k.nombre}</span><span className="xs m">{k.tipo === 'gasto' ? (k.tope > 0 ? `Tope ${dinero(k.tope)} al mes` : 'Sin tope') : 'Ingreso'}{k.archivada ? ' · archivada' : ''}</span></span>
      <span className="m" aria-hidden="true">›</span>
    </button>
  );
  return (
    <>
      <div className="top"><button className="ib" onClick={alVolver} aria-label="Volver">‹</button></div>
      <h1 className="h1">Categorías y topes</h1>
      <p className="note" style={{ margin: 0 }}>El tope cuenta los gastos del mes de calendario, incluidos los fijos confirmados. Lo que sobra no pasa al mes siguiente.</p>
      <div className="sh"><h2 className="h2">De gasto</h2></div><div className="rows">{v.filter((k) => k.tipo === 'gasto').map(fila)}</div>
      <div className="sh"><h2 className="h2">De ingreso</h2></div><div className="rows">{v.filter((k) => k.tipo === 'ingreso').map(fila)}</div>
      <button className="add" onClick={() => editar()}>+ Agregar categoría</button>
    </>
  );
}
