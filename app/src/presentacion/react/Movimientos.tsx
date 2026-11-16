// Layer 5 · Presentation: Movimientos (MOV-04, MOV-07), the v1's vMovimientos with the «Categoría» pill of the
// prototype Joaquín approved (decision 64): by month, by day, with a filter by account and one by category.
import { Fragment } from 'react';
import type { FilaMovimiento, VistaMovimientos } from '@rumbo/contratos';
import { Cuadrito } from './comunes';
import { decimal, diaConNombre, dinero, enMoneda, mesLargo, nombreDelMes } from '../modelos/formato';

export interface AccionesMovimientos {
  mes: (n: number) => void;
  cuenta: (id: string) => void;
  elegirCategoria: () => void;
  quitarCategoria: () => void;
  ver: (id: string) => void;
}

// One movement as a row, the v1's rowMov.
export function Fila({ m, alTocar }: { m: FilaMovimiento; alTocar: () => void }) {
  const mon = m.cuenta ? m.cuenta.moneda : 'BOB', cuenta = m.cuenta?.nombre ?? '';
  const fijo = m.fijo ? <span className="tag">Fijo</span> : null;
  let cuadro, titulo, sub, monto;
  if (m.tipo === 'transferencia') {
    const d = m.destino;
    const tc = m.montoDestino != null && d && d.moneda !== mon ? ` · a Bs ${decimal(mon === 'BOB' ? m.monto / m.montoDestino : m.montoDestino / m.monto, 2)}` : '';
    cuadro = <Cuadrito icono="flechas" color="var(--pizarra)" />;
    titulo = m.nota || 'Transferencia';
    sub = `${m.cuenta?.nombre ?? '?'} → ${d?.nombre ?? '?'}${tc}`;
    monto = (
      <span className="amt" style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
        <span>−{enMoneda(m.monto, mon, 2)}</span>
        <span className="xs in">+{enMoneda(m.montoDestino ?? m.monto, d ? d.moneda : mon, 2)}</span>
      </span>
    );
  } else if (m.tipo === 'ajuste') {
    cuadro = <Cuadrito icono="balanza" color="var(--gris)" />;
    titulo = <>{m.nota || 'Cuadre de cuenta'}<span className="tag g">Ajuste</span></>;
    sub = cuenta;
    monto = <span className="amt">{m.sentido < 0 ? '−' : '+'}{enMoneda(m.monto, mon, 2)}</span>;
  } else if (m.tipo === 'interes' || m.tipo === 'cierre') {
    const d = m.deuda, mon2 = d ? d.moneda : 'BOB', interes = m.tipo === 'interes';
    cuadro = <Cuadrito icono={interes ? 'porcentaje' : 'balanza'} color={interes ? '#B5482E' : 'var(--gris)'} />;
    titulo = interes ? `Interés sin pagar · ${d ? d.nombre : ''}` : `Cierre · ${d ? d.nombre : ''}`;
    sub = interes ? 'Se suma a la deuda · gasto en Intereses' : d && d.tipo === 'teDeben' ? 'Ya no lo cobras: baja tu patrimonio' : 'Ya no lo debes: sube tu patrimonio';
    monto = <span className="amt">{enMoneda(m.monto, mon2, 2)}</span>;
  } else if (m.tipo === 'pago' || m.tipo === 'cobro' || m.tipo === 'prestamo' || m.tipo === 'recibido') {
    const d = m.deuda, entra = m.tipo === 'cobro' || m.tipo === 'recibido';
    cuadro = <Cuadrito icono={m.tipo === 'pago' ? 'porcentaje' : 'personaIn'} color={m.tipo === 'pago' ? '#B5482E' : '#1E7A55'} />;
    titulo = <>{m.tipo === 'pago' ? `Pago · ${d ? d.nombre : 'deuda'}` : m.tipo === 'cobro' ? `Cobro · ${d ? d.nombre : ''}` : m.tipo === 'recibido' ? `Te prestó · ${d ? d.nombre : ''}` : `Préstamo dado · ${d ? d.nombre : ''}`}{fijo}</>;
    sub = `${cuenta}${m.interes ? ` · interés ${enMoneda(m.interes, mon, 2)}, capital ${enMoneda(m.capital ?? 0, mon, 2)}` : ''}`;
    monto = <span className={`amt ${entra ? 'in' : ''}`}>{entra ? '+' : '−'}{enMoneda(m.monto, mon, 2)}</span>;
  } else {
    const k = m.categoria, ingreso = m.tipo === 'ingreso';
    cuadro = <Cuadrito icono={k.icono} color={k.color} />;
    titulo = <>{m.nota || k.nombre}{fijo}</>;
    sub = `${k.nombre} · ${cuenta}`;
    monto = <span className={`amt ${ingreso ? 'in' : ''}`}>{ingreso ? '+' : '−'}{enMoneda(m.monto, mon, 2)}</span>;
  }
  return (
    <button className="row" onClick={alTocar}>
      {cuadro}
      <span className="grow"><span className="t">{titulo}</span><span className="xs m">{sub}</span></span>
      {monto}
    </button>
  );
}

export function Movimientos({ v, filtro, acc }: { v: VistaMovimientos; filtro: string; acc: AccionesMovimientos }) {
  const k = v.categoria, signo = k && k.tipo === 'ingreso' ? '+' : '−', nombreMes = nombreDelMes(v.mes);
  return (
    <>
      <div className="monthnav">
        <button className="ib" onClick={() => acc.mes(-1)} aria-label="Mes anterior">‹</button>
        <h1>{mesLargo(v.mes)}</h1>
        <button className="ib" onClick={() => acc.mes(1)} aria-label="Mes siguiente">›</button>
      </div>
      <section className="blk b">
        <div className="sp"><span className="k">Este mes</span><span className="xs" style={{ opacity: 0.88 }}>{v.cantidad} movimientos</span></div>
        <div className="g2">
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Gastado</span><span style={{ font: '800 26px var(--display)' }}>{dinero(v.salio)}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}><span className="xs" style={{ opacity: 0.88 }}>Entró</span><span style={{ font: '800 26px var(--display)' }}>{dinero(v.entro)}</span></div>
        </div>
      </section>
      <div className="chips" role="group" aria-label="Filtrar por cuenta">
        <button className="chip" aria-pressed={filtro === 'todas'} onClick={() => acc.cuenta('todas')}>Todas</button>
        {v.cuentas.map((c) => <button key={c.id} className="chip" aria-pressed={filtro === c.id} onClick={() => acc.cuenta(c.id)}>{c.nombre}</button>)}
      </div>
      <div className="chips" role="group" aria-label="Filtrar por categoría">
        {k
          ? <button className="chip" aria-pressed="true" aria-label={`Quitar el filtro ${k.nombre}`} onClick={acc.quitarCategoria}><span className="sq" style={{ background: 'var(--azul-on)' }} />{k.nombre} ✕</button>
          : <button className="chip" aria-pressed="false" onClick={acc.elegirCategoria}>Categoría: Todas ▾</button>}
      </div>
      {k && (
        <>
          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
            <Cuadrito icono={k.icono} color={k.color} />
            <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>{k.nombre}</span>
              <span className="xs m">{k.cantidad} {k.cantidad === 1 ? 'movimiento' : 'movimientos'} en {nombreMes}{v.cuentaElegida ? ` · solo ${v.cuentaElegida}` : ''}</span>
            </span>
            <span style={{ font: '800 22px var(--display)' }}>{signo}{dinero(k.total, 2)}</span>
          </div>
          {k.id === 'intereses' && <span className="xs m">De cada cuota del préstamo se suma solo el interés.</span>}
        </>
      )}
      <span className="xs m">Las transferencias y los ajustes no cuentan como gasto ni ingreso.</span>
      {v.dias.length ? v.dias.map((d) => (
        <Fragment key={d.fecha}>
          <div className="dh"><span>{d.fecha === v.hoy ? 'Hoy' : diaConNombre(d.fecha)}</span><span className="num">{d.total ? (k ? signo : '−') + dinero(d.total, 2) : ''}</span></div>
          <div className="rows">{d.filas.map((m) => <Fila key={m.id} m={m} alTocar={() => acc.ver(m.id)} />)}</div>
        </Fragment>
      )) : k
        ? <div className="empty"><h3>Nada de {k.nombre} en {nombreMes}</h3>Cambia de mes o quita el filtro.</div>
        : <div className="empty"><h3>Nada anotado en {nombreMes}</h3>Toca + para anotar tu primer gasto.</div>}
    </>
  );
}
