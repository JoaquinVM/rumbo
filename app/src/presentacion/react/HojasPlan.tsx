// Layer 5 · Presentation: the sheets of Plan and of the details, the v1's abrirCuenta, abrirCuadrar, abrirFijo,
// abrirDeuda, abrirPago, abrirMeta, abrirCategoria, abrirEmpezar and abrirSeparar, with their texts. The balance of each
// account shows with 2 decimals on its pill (FMT-02, decision 63).
import { useState } from 'react';
import type {
  App, BorradorCategoria, BorradorCuenta, BorradorDeuda, BorradorEmpezar, BorradorFijo, BorradorMeta, CuentaVista,
  ErrorGuardar, MonedaApp, TipoPago,
} from '@rumbo/contratos';
import { BotonDosToques, Hoja, Icono } from './comunes';
import { enMoneda, diaCorto, mesCorto, paraEditar, simbolo } from '../modelos/formato';
import { textoDeError } from '../modelos/textos';

type Aviso = (t: string) => void;
const formulario = { display: 'flex', flexDirection: 'column', gap: 14 } as const;

function Cuentas({ cuentas, elegida, alElegir, moneda }: { cuentas: CuentaVista[]; elegida: string | null; alElegir: (id: string) => void; moneda?: MonedaApp | null }) {
  return (
    <>
      {cuentas.filter((c) => !moneda || c.moneda === moneda).map((c) => (
        <button key={c.id} type="button" className="chip" aria-pressed={c.id === elegida} onClick={() => alElegir(c.id)}>
          {c.nombre} · {enMoneda(c.saldo, c.moneda, 2)}
        </button>
      ))}
    </>
  );
}

const Titulo = ({ children, ejemplo }: { children: React.ReactNode; ejemplo?: boolean }) => (
  <div className="sp"><h2 className="h2" style={{ fontSize: 20 }}>{children}</h2>{ejemplo && <span className="ex">Ejemplo: no se guarda</span>}</div>
);

// ---------- CTA-01, CTA-08 ----------
export function HojaCuenta({ app, id, alCerrar, aviso }: { app: App; id?: string; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioCuenta(id));
  const [b, setB] = useState<BorradorCuenta>(f.borrador);
  const cambiar = (x: Partial<BorradorCuenta>): void => setB((a) => ({ ...a, ...x }));
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarCuenta(b);
    if (!r.ok) { aviso(r.codigo === 'falta-nombre' ? 'Ponle un nombre' : textoDeError(r.codigo)); return; }
    alCerrar();
    aviso('Cuenta guardada');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{f.editando ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="f"><label className="lab" htmlFor="c-n">Nombre</label><input className="inp" id="c-n" value={b.nombre} maxLength={30} placeholder="Efectivo, Banco, Dólares…" onChange={(e) => cambiar({ nombre: e.target.value })} /></div>
        <div className="f">
          <span className="lab">Moneda{f.tieneMovimientos ? ' · no se cambia porque ya tiene movimientos' : ''}</span>
          <div className="seg" role="group" aria-label="Moneda">
            {(['BOB', 'USD'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={b.moneda === m} disabled={f.tieneMovimientos}
                onClick={() => cambiar({ moneda: m, ...(f.editando ? {} : { diaADia: m === 'BOB' }) })}>{m === 'BOB' ? 'Bolivianos' : 'Dólares'}</button>
            ))}
          </div>
        </div>
        {f.editando && f.saldo != null
          ? <div className="card" style={{ padding: '12px 14px' }}><div className="sp"><span>Saldo</span><span className="amt">{enMoneda(f.saldo, b.moneda, 2)}</span></div><span className="xs m">Para corregirlo, usa «Cuadrar» en Plan.</span></div>
          : <div className="f"><label className="lab" htmlFor="c-s">Saldo de hoy</label><input className="inp" id="c-s" inputMode="decimal" placeholder="0" value={b.saldo} onChange={(e) => cambiar({ saldo: e.target.value })} /></div>}
        <div className="g2">
          <div className="f"><label className="lab" htmlFor="c-r">Rendimiento anual %</label><input className="inp" id="c-r" inputMode="decimal" placeholder="0" value={b.rendimiento} onChange={(e) => cambiar({ rendimiento: e.target.value })} /></div>
          <label className="f" style={{ justifyContent: 'flex-end' }}>
            <span className="lab">Para el día a día</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', height: 48 }}><input type="checkbox" id="c-d" checked={b.diaADia} onChange={(e) => cambiar({ diaADia: e.target.checked })} /> De aquí sale lo que gasto</span>
          </label>
        </div>
        <div className="actions">
          {f.editando && (
            <button type="button" className="btn del izq" onClick={() => {
              const r = app.archivarCuenta(b.id);
              if (!r.ok) { aviso(r.codigo === 'saldo-no-es-cero' ? `Deja ${b.nombre} en 0 antes de archivarla: transfiere lo que tiene o usa «Cuadrar»` : textoDeError(r.codigo)); return; }
              alCerrar();
              aviso(r.datos.archivada ? 'Cuenta archivada: sus movimientos se conservan' : 'Cuenta desarchivada');
            }}>{f.archivada ? 'Desarchivar' : 'Archivar'}</button>
          )}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}

// ---------- CTA-03 ----------
export function HojaCuadrar({ app, id, alCerrar, aviso }: { app: App; id: string; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioCuenta(id));
  const s = f.saldo ?? 0, mon = f.borrador.moneda;
  const [real, setReal] = useState(() => (s ? (s < 0 ? '-' : '') + paraEditar(Math.abs(s)) : '0'));
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.cuadrar(id, real);
    if (!r.ok) { aviso(textoDeError(r.codigo)); return; }
    alCerrar();
    aviso(r.datos.diferencia ? `Ajuste de ${enMoneda(r.datos.diferencia, r.datos.moneda, 2)} registrado` : 'Ya estaba cuadrada');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>Cuadrar {f.borrador.nombre}</h2>
      <p className="note" style={{ margin: 0 }}>Rumbo calcula {enMoneda(s, mon, 2)}. Escribe lo que tienes de verdad; la diferencia queda como un ajuste visible en Movimientos y no cuenta como gasto ni ingreso.</p>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="montoblk"><label htmlFor="q-s">Saldo real</label><div className="r"><span>{simbolo(mon)}</span><input id="q-s" inputMode="decimal" value={real} onChange={(e) => setReal(e.target.value)} /></div></div>
        <div className="actions"><button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button><button className="btn" type="submit">Cuadrar</button></div>
      </form>
    </Hoja>
  );
}

// ---------- FIJ-01, FIJ-04 ----------
export function HojaFijo({ app, id, alCerrar, aviso }: { app: App; id?: string; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioFijo(id));
  const [b, setB] = useState<BorradorFijo | null>(f ? f.borrador : null);
  if (!f || !b) return null;
  const cambiar = (x: Partial<BorradorFijo>): void => setB((a) => (a ? { ...a, ...x } : a));
  const monedaDeuda = b.deudaId ? f.prestamos.find((p) => p.id === b.deudaId)?.moneda ?? null : null;
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarFijo(b!);
    if (!r.ok) { aviso(r.codigo === 'falta-nombre' || r.codigo === 'falta-monto' ? 'Falta el nombre o el monto' : textoDeError(r.codigo)); return; }
    alCerrar();
    aviso('Fijo guardado');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{f.editando ? 'Editar fijo' : 'Nuevo fijo'}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="seg" role="group" aria-label="Tipo" style={{ alignSelf: 'flex-start' }}>
          {(['gasto', 'ingreso'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={b.tipo === t} onClick={() => { if (t !== b.tipo) cambiar({ tipo: t, categoriaId: f.categorias[t][0]?.id ?? b.categoriaId }); }}>{t === 'gasto' ? 'Gasto' : 'Ingreso'}</button>
          ))}
        </div>
        <div className="f"><label className="lab" htmlFor="fj-n">Nombre</label><input className="inp" id="fj-n" value={b.nombre} maxLength={40} placeholder="Renta, sueldo, internet…" onChange={(e) => cambiar({ nombre: e.target.value })} /></div>
        <div className="g2">
          <div className="f"><label className="lab" htmlFor="fj-m">Monto al mes</label><input className="inp" id="fj-m" inputMode="decimal" value={b.monto} onChange={(e) => cambiar({ monto: e.target.value })} /></div>
          <div className="f"><label className="lab" htmlFor="fj-d">Día del mes (1 a 31)</label><input className="inp" id="fj-d" inputMode="numeric" value={b.dia} onChange={(e) => cambiar({ dia: e.target.value })} /></div>
        </div>
        <div className="f"><span className="lab">Cuenta</span><div className="chips"><Cuentas cuentas={f.cuentas} elegida={b.cuentaId} moneda={monedaDeuda} alElegir={(c) => cambiar({ cuentaId: c })} /></div></div>
        <div className="f"><span className="lab">Categoría</span><div className="chips">
          {f.categorias[b.tipo].map((k) => (
            <button key={k.id} type="button" className="chip" aria-pressed={k.id === b.categoriaId} onClick={() => cambiar({ categoriaId: k.id })}>
              <span className="sq" style={{ background: k.id === b.categoriaId ? 'var(--azul-on)' : k.color }} />{k.nombre}
            </button>
          ))}
        </div></div>
        {b.tipo === 'gasto' && f.prestamos.length > 0 && (
          <div className="f">
            <label className="lab" htmlFor="fj-deu">¿Es la cuota de un préstamo?</label>
            <select className="inp" id="fj-deu" value={b.deudaId ?? ''} onChange={(e) => cambiar({ deudaId: e.target.value || null })}>
              <option value="">No</option>
              {f.prestamos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
        )}
        <span className="xs m">Si el mes no tiene ese día, cae el último día del mes. Desde su día aparece en «Por confirmar».</span>
        <div className="actions">
          {f.editando && <BotonDosToques className="btn del izq" texto="Quitar" armado="Toca otra vez para quitar" alConfirmar={() => { app.quitarFijo(b.id); alCerrar(); aviso('Fijo quitado'); }} />}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}

// ---------- DEU-01, DEU-07, DEU-09, FIJ-04, FIJ-07 ----------
export function HojaDeuda({ app, id, alCerrar, alArchivar, aviso }: { app: App; id?: string; alCerrar: () => void; alArchivar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioDeuda(id));
  const [b, setB] = useState<BorradorDeuda>(f.borrador);
  const cambiar = (x: Partial<BorradorDeuda>): void => setB((a) => ({ ...a, ...x }));
  const enMon = f.cuentas.filter((c) => c.moneda === b.moneda);
  const fijoPorDefecto = (mon: MonedaApp): string | null => (f.cuentas.find((c) => c.moneda === mon)?.id ?? null);
  const te = b.tipo === 'teDeben', prestamo = b.tipo === 'prestamo', editando = f.editando;
  const chipsMov = (lab: string) => (
    <div className="f"><span className="lab">{lab}</span><div className="chips">
      <button type="button" className="chip" aria-pressed={!b.cuentaMov} onClick={() => cambiar({ cuentaMov: null })}>No</button>
      <Cuentas cuentas={enMon} elegida={b.cuentaMov} alElegir={(c) => cambiar({ cuentaMov: c })} />
    </div></div>
  );
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarDeuda(b);
    if (!r.ok) {
      const t = r.codigo === 'falta-nombre' || r.codigo === 'falta-saldo' ? 'Falta el nombre o el saldo'
        : r.codigo === 'falta-cuota' ? 'Falta la cuota'
          : r.codigo === 'falta-cuenta-fijo' ? `Para el fijo de la cuota necesitas una cuenta en ${simbolo(b.moneda)}` : textoDeError(r.codigo);
      aviso(t);
      return;
    }
    alCerrar();
    aviso('Deuda guardada');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{editando ? 'Editar deuda' : 'Nueva deuda'}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="seg full" role="group" aria-label="Tipo de deuda">
          {([['prestamo', 'Préstamo'], ['persona', 'Con una persona'], ['teDeben', 'Te deben']] as const).map(([t, n]) => (
            <button key={t} type="button" aria-pressed={b.tipo === t} disabled={editando} onClick={() => cambiar({ tipo: t, cuentaMov: null })}>{n}</button>
          ))}
        </div>
        <div className="f"><label className="lab" htmlFor="d-n">{te ? '¿Quién te debe?' : b.tipo === 'persona' ? '¿A quién le debes?' : 'Nombre'}</label><input className="inp" id="d-n" value={b.nombre} maxLength={40} onChange={(e) => cambiar({ nombre: e.target.value })} /></div>
        <div className="g2">
          <div className="f"><label className="lab" htmlFor="d-s">{editando ? 'Saldo al registrarla' : b.cuentaMov ? (te ? 'Cuánto prestas' : 'Cuánto recibes') : 'Saldo de hoy'}</label><input className="inp" id="d-s" inputMode="decimal" value={b.saldo} onChange={(e) => cambiar({ saldo: e.target.value })} /></div>
          <div className="f"><span className="lab">Moneda</span><div className="seg" role="group" aria-label="Moneda">
            {(['BOB', 'USD'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={b.moneda === m} disabled={editando} onClick={() => cambiar({ moneda: m, cuentaMov: null, cuentaFijo: fijoPorDefecto(m) })}>{simbolo(m)}</button>
            ))}
          </div></div>
        </div>
        {prestamo ? (
          <>
            <div className="g3">
              <div className="f"><label className="lab" htmlFor="d-i">Interés anual %</label><input className="inp" id="d-i" inputMode="decimal" value={b.interes} onChange={(e) => cambiar({ interes: e.target.value })} /></div>
              <div className="f"><label className="lab" htmlFor="d-dia">Día</label><input className="inp" id="d-dia" inputMode="numeric" value={b.dia} onChange={(e) => cambiar({ dia: e.target.value })} /></div>
              <div className="f"><label className="lab" htmlFor="d-c">Cuota al mes</label><input className="inp" id="d-c" inputMode="decimal" value={b.cuota} onChange={(e) => cambiar({ cuota: e.target.value })} /></div>
            </div>
            {!editando && (
              <>
                {chipsMov('¿Entra ahora a una cuenta? (opcional)')}
                <label className="sm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={b.crearFijo} onChange={(e) => cambiar({ crearFijo: e.target.checked })} /> Crear el fijo de la cuota, para confirmarla cada mes</label>
                {b.crearFijo && (enMon.length
                  ? <><div className="chips"><Cuentas cuentas={enMon} elegida={b.cuentaFijo} alElegir={(c) => cambiar({ cuentaFijo: c })} /></div><span className="xs m">La primera cuota que te pregunta es la de {mesCorto(app.primeraCuota(b.dia))}.</span></>
                  : <span className="xs m">Para el fijo necesitas una cuenta en {simbolo(b.moneda)}.</span>)}
              </>
            )}
          </>
        ) : (
          <>
            <div className="f"><label className="lab" htmlFor="d-f">{te ? 'Esperas el pago en (opcional)' : 'Piensas pagar en (opcional)'}</label><input className="inp" id="d-f" type="month" value={b.fechaEsperada} onChange={(e) => cambiar({ fechaEsperada: e.target.value })} /></div>
            {!editando && chipsMov(te ? '¿Sale ahora de una cuenta? (opcional)' : '¿Entra ahora a una cuenta? (opcional)')}
          </>
        )}
        <div className="actions">
          {editando && <BotonDosToques className="btn del izq" texto="Archivar" armado="Toca otra vez para archivar" alConfirmar={() => {
            const r = app.archivarDeuda(b.id);
            if (!r.ok) { aviso(textoDeError(r.codigo)); return; }
            alArchivar();
            aviso(r.datos.pendiente ? `Deuda cerrada con ${enMoneda(r.datos.pendiente, r.datos.moneda)} pendientes: lo verás en el Desglose` : 'Deuda archivada');
          }} />}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}

// ---------- DEU-02, DEU-03, DEU-06, DEU-07, DEU-10, FIJ-06 ----------
export function HojaPago({ app, deudaId, tipo, alCerrar, aviso }: { app: App; deudaId: string; tipo: TipoPago; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioPago(deudaId, tipo));
  const [monto, setMonto] = useState(f?.monto ?? '');
  const [cuentaId, setCuentaId] = useState(f?.cuentaId ?? '');
  const [fecha, setFecha] = useState(f?.fecha ?? '');
  const [esCuota, setEsCuota] = useState(true);
  if (!f) return null;
  const d = f.deuda, mon = d.moneda, entra = tipo === 'cobro' || tipo === 'recibido';
  const titulo = { pago: `Pagar ${d.nombre}`, cobro: `Cobrar a ${d.nombre}`, prestamo: `Prestar más a ${d.nombre}`, recibido: `Recibir más de ${d.nombre}` }[tipo];
  const m = app.leerMonto(monto), it = f.interes;
  const split = !it || !m ? '' : m >= it
    ? `Interés ${enMoneda(it, mon, 2)} (gasto) · capital ${enMoneda(m - it, mon, 2)} (baja la deuda)`
    : `Interés ${enMoneda(it, mon, 2)} (gasto) · faltan ${enMoneda(it - m, mon, 2)} de interés, que se suman a la deuda`;
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.pagar({ deudaId, tipo, cuentaId, monto, fecha, esCuota });
    if (!r.ok) {
      aviso(r.codigo === 'falta-monto' ? 'Escribe un monto' : r.codigo === 'mas-que-el-maximo' && f!.maximo != null ? `El máximo es ${enMoneda(f!.maximo, mon, 2)}` : textoDeError(r.codigo));
      return;
    }
    alCerrar();
    aviso('Guardado');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{titulo}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className={`montoblk ${entra ? 'v' : ''}`}>
          <label htmlFor="p-m">{entra ? 'Entra' : 'Sale'}</label>
          <div className="r"><span>{simbolo(mon)}</span><input id="p-m" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
          {it > 0 && <span className="xs" id="p-split" style={{ opacity: 0.92 }}>{split}</span>}
        </div>
        <div className="f"><span className="lab">{entra ? 'Entra a' : 'Sale de'}</span><div className="chips"><Cuentas cuentas={f.cuentas} elegida={cuentaId} alElegir={setCuentaId} /></div></div>
        <div className="f"><label className="lab" htmlFor="p-f">Fecha</label><input className="inp" id="p-f" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        {f.cuotaDe && <label className="sm" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={esCuota} onChange={(e) => setEsCuota(e.target.checked)} /> Es la cuota de {mesCorto(f.cuotaDe)}: ya no te la pregunto</label>}
        <div className="actions"><button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button><button className="btn" type="submit">Guardar</button></div>
      </form>
    </Hoja>
  );
}

// ---------- DEU-11 ----------
export function HojaSeparar({ app, gastoId, alCerrar, aviso }: { app: App; gastoId: string; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioSeparar(gastoId));
  const [monto, setMonto] = useState(() => (f ? paraEditar(f.gasto.monto) : ''));
  const [quien, setQuien] = useState<string>(f?.personas[0]?.id ?? '');
  const [nombre, setNombre] = useState('');
  if (!f) return null;
  const g = f.gasto, mon = g.moneda, ejemplo = app.estado().ejemplo;
  const m = app.leerMonto(monto), persona = f.personas.find((p) => p.id === quien);
  const n = persona ? persona.nombre : nombre.trim() || 'esa persona';
  const explica = !m ? '' : m > g.monto ? `El máximo es ${enMoneda(g.monto, mon, 2)}`
    : m === g.monto ? `Ya no es tu gasto: ${n} te debe ${enMoneda(m, mon, 2)} más. Tu cuenta no cambia.`
      : `Tu gasto queda en ${enMoneda(g.monto - m, mon, 2)} y ${n} te debe ${enMoneda(m, mon, 2)} más. Tu cuenta no cambia.`;
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.separarGasto(gastoId, monto, quien || { nombre });
    if (!r.ok) {
      const t: Partial<Record<ErrorGuardar, string>> = {
        'falta-monto': 'Escribe cuánto te deben', 'mas-que-el-maximo': `El máximo es ${enMoneda(g.monto, mon, 2)}`,
        'falta-nombre': 'Escribe quién te debe', 'falta-quien': 'Elige quién te debe',
      };
      aviso(t[r.codigo] ?? textoDeError(r.codigo));
      return;
    }
    alCerrar();
    aviso(r.datos.queda > 0 ? `Listo: ${r.datos.nombre} te debe ${enMoneda(r.datos.monto, r.datos.moneda, 2)} más` : `Listo: todo el gasto te lo debe ${r.datos.nombre}`);
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <Titulo ejemplo={ejemplo}>Me deben una parte</Titulo>
      <p className="note" style={{ margin: 0 }}>{g.nombre} · {diaCorto(g.fecha)} · {enMoneda(g.monto, mon, 2)}</p>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="montoblk">
          <label htmlFor="s-m">Cuánto te deben</label>
          <div className="r"><span>{simbolo(mon)}</span><input id="s-m" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>
          <span className="xs" style={{ opacity: 0.92 }}>{explica}</span>
        </div>
        <div className="f"><span className="lab">¿Quién te debe?</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="chips">
              {f.personas.map((p) => <button key={p.id} type="button" className="chip" aria-pressed={p.id === quien} onClick={() => setQuien(p.id)}>{p.nombre} · {enMoneda(p.saldo, p.moneda)}</button>)}
              <button type="button" className="chip" aria-pressed={!quien} onClick={() => setQuien('')}>Otra persona</button>
            </div>
            {!quien && <input className="inp" id="s-n" maxLength={40} placeholder="¿Quién te debe?" aria-label="¿Quién te debe?" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
            {f.ocultas && <span className="xs m">No aparecen las personas que anotaste después de este gasto.</span>}
          </div>
        </div>
        <div className="actions"><button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button><button className="btn" type="submit">Guardar</button></div>
      </form>
    </Hoja>
  );
}

// ---------- MET-01 ----------
export function HojaMeta({ app, id, alCerrar, alArchivar, aviso }: { app: App; id?: string; alCerrar: () => void; alArchivar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioMeta(id));
  const [b, setB] = useState<BorradorMeta>(f.borrador);
  const cambiar = (x: Partial<BorradorMeta>): void => setB((a) => ({ ...a, ...x }));
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarMeta(b);
    if (!r.ok) { aviso(r.codigo === 'falta-nombre' || r.codigo === 'falta-monto' ? 'Falta el nombre o el monto' : textoDeError(r.codigo)); return; }
    alCerrar();
    aviso('Meta guardada');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{f.editando ? 'Editar meta' : 'Nueva meta'}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <div className="f"><label className="lab" htmlFor="mt-n">Nombre</label><input className="inp" id="mt-n" value={b.nombre} maxLength={40} placeholder="Fondo de emergencia, viaje…" onChange={(e) => cambiar({ nombre: e.target.value })} /></div>
        <div className="g2">
          <div className="f"><label className="lab" htmlFor="mt-m">Monto (Bs)</label><input className="inp" id="mt-m" inputMode="decimal" value={b.monto} onChange={(e) => cambiar({ monto: e.target.value })} /></div>
          <div className="f"><label className="lab" htmlFor="mt-f">Para</label><input className="inp" id="mt-f" type="month" value={b.mes} min={f.desde} onChange={(e) => cambiar({ mes: e.target.value })} /></div>
        </div>
        <div className="actions">
          {f.editando && <BotonDosToques className="btn del izq" texto="Archivar" armado="Toca otra vez para archivar" alConfirmar={() => { app.archivarMeta(b.id); alArchivar(); aviso('Meta archivada; lo apartado vuelve a estar disponible'); }} />}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}

// ---------- LIM-01, LIM-03 ----------
export function HojaCategoria({ app, id, alCerrar, aviso }: { app: App; id?: string; alCerrar: () => void; aviso: Aviso }) {
  const [f] = useState(() => app.formularioCategoria(id));
  const [b, setB] = useState<BorradorCategoria>(f.borrador);
  const cambiar = (x: Partial<BorradorCategoria>): void => setB((a) => ({ ...a, ...x }));
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.guardarCategoria(b);
    if (!r.ok) { aviso(r.codigo === 'falta-nombre' ? 'Ponle un nombre' : textoDeError(r.codigo)); return; }
    alCerrar();
    aviso('Categoría guardada');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <h2 className="h2" style={{ fontSize: 20 }}>{f.editando ? 'Editar categoría' : 'Nueva categoría'}</h2>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        {!f.editando && (
          <div className="seg" role="group" aria-label="Tipo" style={{ alignSelf: 'flex-start' }}>
            {(['gasto', 'ingreso'] as const).map((t) => <button key={t} type="button" aria-pressed={b.tipo === t} onClick={() => cambiar({ tipo: t })}>{t === 'gasto' ? 'Gasto' : 'Ingreso'}</button>)}
          </div>
        )}
        <div className="f"><label className="lab" htmlFor="k-n">Nombre</label><input className="inp" id="k-n" value={b.nombre} maxLength={30} onChange={(e) => cambiar({ nombre: e.target.value })} /></div>
        <div className="f"><span className="lab">Color</span><div className="chips">
          {f.colores.map((col) => (
            <button key={col} type="button" aria-label={`Color ${col}`} aria-pressed={b.color === col} onClick={() => cambiar({ color: col })}
              style={{ width: 36, height: 36, borderRadius: 10, border: b.color === col ? '3px solid var(--ink)' : '1px solid var(--line)', background: col }} />
          ))}
        </div></div>
        <div className="f"><span className="lab">Ícono</span><div className="chips">
          {f.iconos.map((i) => (
            <button key={i} type="button" aria-label={`Ícono ${i}`} aria-pressed={b.icono === i} onClick={() => cambiar({ icono: i })}
              style={{ width: 44, height: 44, borderRadius: 12, border: 0, display: 'grid', placeItems: 'center', color: '#fff', background: b.icono === i ? b.color : 'var(--gris)', outline: b.icono === i ? '3px solid var(--ink)' : 'none' }}>
              <Icono nombre={i} />
            </button>
          ))}
        </div></div>
        {b.tipo === 'gasto' && <div className="f"><label className="lab" htmlFor="k-t">Tope mensual (vacío = sin tope)</label><input className="inp" id="k-t" inputMode="decimal" value={b.tope} onChange={(e) => cambiar({ tope: e.target.value })} /></div>}
        <div className="actions">
          {f.editando && (
            <button type="button" className="btn del izq" onClick={() => {
              const r = app.archivarCategoria(b.id);
              if (!r.ok) { aviso(textoDeError(r.codigo)); return; }
              alCerrar();
              aviso(r.datos.archivada ? 'Categoría archivada: sus movimientos se conservan' : 'Categoría desarchivada');
            }}>{f.archivada ? 'Desarchivar' : 'Archivar'}</button>
          )}
          <button type="button" className="btn sec" onClick={alCerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    </Hoja>
  );
}

// ---------- DAT-02 ----------
export function HojaEmpezar({ app, alCerrar, alEmpezar, aviso }: { app: App; alCerrar: () => void; alEmpezar: () => void; aviso: Aviso }) {
  const [b, setB] = useState<BorradorEmpezar>({
    cuentas: [{ nombre: 'Efectivo', moneda: 'BOB', saldo: '' }, { nombre: 'Banco', moneda: 'BOB', saldo: '' }],
    ingreso: '', diaIngreso: '25', cuentaIngreso: '2', irregular: '0',
    gastos: [{ nombre: 'Renta', dia: '5', monto: '' }, { nombre: '', dia: '', monto: '' }],
  });
  const cambiar = (x: Partial<BorradorEmpezar>): void => setB((a) => ({ ...a, ...x }));
  const cuenta = (i: number, x: Partial<BorradorEmpezar['cuentas'][number]>): void => setB((a) => ({ ...a, cuentas: a.cuentas.map((c, j) => (j === i ? { ...c, ...x } : c)) }));
  const gasto = (i: number, x: Partial<BorradorEmpezar['gastos'][number]>): void => setB((a) => ({ ...a, gastos: a.gastos.map((g, j) => (j === i ? { ...g, ...x } : g)) }));
  function guardar(e: React.FormEvent): void {
    e.preventDefault();
    const r = app.empezar(b);
    if (!r.ok) { aviso(r.codigo === 'falta-cuenta' ? 'Agrega al menos una cuenta' : textoDeError(r.codigo)); return; }
    alEmpezar();
    aviso('Listo. Anota tus gastos con el botón +');
  }
  return (
    <Hoja alCerrar={alCerrar}>
      <section className="blk b"><span className="k">Rumbo</span><h2 style={{ font: '800 26px/1.1 var(--display)' }}>Empecemos con lo tuyo</h2><span style={{ opacity: 0.92 }}>Tres pasos y ya ves tu rumbo. Todo se puede cambiar después en Plan.</span></section>
      <form autoComplete="off" style={formulario} onSubmit={guardar} noValidate>
        <section className="card">
          <h2 className="h2">1 · Tus cuentas, con el saldo de hoy</h2>
          {b.cuentas.map((c, i) => (
            <div key={i} className="g3">
              <div className="f"><label className="lab" htmlFor={`e-cn${i}`}>Nombre</label><input className="inp" id={`e-cn${i}`} value={c.nombre} onChange={(e) => cuenta(i, { nombre: e.target.value })} /></div>
              <div className="f"><label className="lab" htmlFor={`e-cm${i}`}>Moneda</label><select className="inp" id={`e-cm${i}`} value={c.moneda} onChange={(e) => cuenta(i, { moneda: e.target.value as MonedaApp })}><option value="BOB">Bs</option><option value="USD">US$</option></select></div>
              <div className="f"><label className="lab" htmlFor={`e-cs${i}`}>Saldo hoy</label><input className="inp" id={`e-cs${i}`} inputMode="decimal" value={c.saldo} onChange={(e) => cuenta(i, { saldo: e.target.value })} /></div>
            </div>
          ))}
          <button type="button" className="add" onClick={() => cambiar({ cuentas: [...b.cuentas, { nombre: '', moneda: 'BOB', saldo: '' }] })}>+ Otra cuenta (también en dólares)</button>
        </section>
        <section className="card">
          <h2 className="h2">2 · Tu ingreso fijo</h2>
          <div className="g3">
            <div className="f"><label className="lab" htmlFor="e-im">Monto al mes</label><input className="inp" id="e-im" inputMode="decimal" value={b.ingreso} onChange={(e) => cambiar({ ingreso: e.target.value })} /></div>
            <div className="f"><label className="lab" htmlFor="e-id">Día</label><input className="inp" id="e-id" inputMode="numeric" value={b.diaIngreso} onChange={(e) => cambiar({ diaIngreso: e.target.value })} /></div>
            <div className="f"><label className="lab" htmlFor="e-ic">Entra a la cuenta</label><input className="inp" id="e-ic" inputMode="numeric" aria-describedby="e-ich" value={b.cuentaIngreso} onChange={(e) => cambiar({ cuentaIngreso: e.target.value })} /></div>
          </div>
          <span className="xs m" id="e-ich">Número de la cuenta de arriba (1, 2…).</span>
          <div className="f"><label className="lab" htmlFor="e-irr">¿Cuánto más esperas al mes de ingresos irregulares (negocio, ventas)? Puede ser 0.</label><input className="inp" id="e-irr" inputMode="decimal" value={b.irregular} onChange={(e) => cambiar({ irregular: e.target.value })} /></div>
        </section>
        <section className="card">
          <h2 className="h2">3 · Tus gastos fijos</h2>
          {b.gastos.map((g, i) => (
            <div key={i} className="g3">
              <div className="f"><label className="lab" htmlFor={`e-gn${i}`}>Qué</label><input className="inp" id={`e-gn${i}`} value={g.nombre} onChange={(e) => gasto(i, { nombre: e.target.value })} /></div>
              <div className="f"><label className="lab" htmlFor={`e-gd${i}`}>Día</label><input className="inp" id={`e-gd${i}`} inputMode="numeric" value={g.dia} onChange={(e) => gasto(i, { dia: e.target.value })} /></div>
              <div className="f"><label className="lab" htmlFor={`e-gm${i}`}>Monto</label><input className="inp" id={`e-gm${i}`} inputMode="decimal" value={g.monto} onChange={(e) => gasto(i, { monto: e.target.value })} /></div>
            </div>
          ))}
          <button type="button" className="add" onClick={() => cambiar({ gastos: [...b.gastos, { nombre: '', dia: '', monto: '' }] })}>+ Otro gasto fijo</button>
          <span className="xs m">Salen de tu cuenta de banco (la 2). Cambias categoría y cuenta después en Plan.</span>
        </section>
        <section className="card" style={{ background: 'var(--sunk)' }}><h2 className="h2">Deudas (opcional)</h2><span className="sm m">Préstamos, deudas con alguien o plata que te deben: las agregas después en Plan.</span></section>
        <div className="actions"><button type="button" className="btn sec" onClick={alCerrar}>Seguir viendo el ejemplo</button><button className="btn" type="submit">Ver mi rumbo</button></div>
      </form>
    </Hoja>
  );
}
