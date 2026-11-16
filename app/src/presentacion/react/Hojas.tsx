// Layer 5 · Presentation: the other sheets of Movimientos. A movement that is not a gasto, ingreso or transferencia
// (MOV-04, DEU-12), and picking a category (MOV-07).
import type { App, CategoriaVista } from '@rumbo/contratos';
import { BotonDosToques, Cuadrito, Hoja } from './comunes';
import { diaCorto, enMoneda } from '../modelos/formato';

const TITULOS: Record<string, string> = {
  ajuste: 'Ajuste de saldo', pago: 'Pago de deuda', cobro: 'Cobro', prestamo: 'Préstamo dado', recibido: 'Dinero que te prestaron',
  interes: 'Interés sin pagar', cierre: 'Cierre de deuda',
};

export function VerMovimiento({ app, id, alCerrar, aviso }: { app: App; id: string; alCerrar: () => void; aviso: (t: string) => void }) {
  const m = app.detalle(id);
  if (!m) return null;
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{TITULOS[m.tipo] ?? 'Movimiento'}</h2>
      <div className="card">
        <div className="sp"><span>{m.donde} · {diaCorto(m.fecha)}</span><span className="amt">{enMoneda(m.monto, m.moneda, 2)}</span></div>
        {!!m.interes && <span className="xs m">Interés {enMoneda(m.interes, m.moneda, 2)} · capital {enMoneda(m.capital ?? 0, m.moneda, 2)}</span>}
        {m.tipo === 'interes' && <span className="xs m">Si lo borras, la cuota vuelve a «por confirmar».</span>}
        {m.deGasto && <span className="xs m">Salió del gasto «{m.deGasto.nombre}» del {diaCorto(m.deGasto.fecha)}.</span>}
      </div>
      <div className="actions">
        {m.deGasto
          ? <BotonDosToques className="btn del izq" texto="Devolver al gasto" armado="Toca otra vez para devolverlo" alConfirmar={() => {
            if (app.devolverAlGasto(m.id).ok) { alCerrar(); aviso('Volvió al gasto'); }
          }} />
          : <BotonDosToques className="btn del izq" texto="Borrar" armado="Toca otra vez para borrar" alConfirmar={() => { app.borrarMovimiento(m.id); alCerrar(); aviso('Movimiento borrado'); }} />}
        <button className="btn" onClick={alCerrar}>Listo</button>
      </div>
    </Hoja>
  );
}

export function ElegirCategoria({ categorias, alElegir, alCerrar }: { categorias: CategoriaVista[]; alElegir: (id: string) => void; alCerrar: () => void }) {
  const fila = (k: CategoriaVista) => (
    <button key={k.id} type="button" className="row" onClick={() => alElegir(k.id)}>
      <Cuadrito icono={k.icono} color={k.color} />
      <span className="grow"><span className="t">{k.nombre}</span></span>
    </button>
  );
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>Ver una categoría</h2>
      <span className="lab">Gastos</span>
      <div className="rows">{categorias.filter((k) => k.tipo === 'gasto').map(fila)}</div>
      <span className="lab">Ingresos</span>
      <div className="rows">{categorias.filter((k) => k.tipo === 'ingreso').map(fila)}</div>
      <div className="actions"><button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button></div>
    </Hoja>
  );
}
