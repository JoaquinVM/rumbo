// Layer 2 · Application: the use cases of the first screens (anotar, editar, borrar, transferir, confirmar y saltar un
// fijo, devolver al gasto) and the queries the screens read. It keeps the person's state in memory, like the v1: every
// change is applied here first and then handed to the store, which saves it in order (DAT-07). The example is never
// saved (DAT-01). Every document is checked with the shared contracts before it is queued (DAT-09).
import {
  validarDocumento, type Anotado, type App, type BorradorMovimiento, type CodigoError, type Datos, type DetalleMovimiento, type ErrorAnotar,
  type ErrorFijo, type EstadoApp, type FormularioMovimiento, type ResultadoApp,
} from '@rumbo/contratos';
import {
  activos, ajustesBase, avisoTope, categoriasPorUso, confirmarFijo, conTipoDeCambio, cuentaDe, cuentasAbiertasDespues,
  devolverAlGasto, deudaDe, ejemplo, leer, monedaDe, monedaMov, mostrarNumero, notasSugeridas, saldoCuenta, saltarFijo,
  tipoDeCambioDe, tipoDeCambioParaGuardar, COLECCIONES, type Centavos, type Estado, type Movimiento,
} from '@rumbo/dominio';
import type { Almacen, Coleccion, Ids, Preferencias, Reloj } from './puertos';
import { categoriaDe, vistaCategoria, vistaMovimientos, vistaRumbo } from './vistas';

type Escritura = { col: Coleccion; doc: { id: string } } | { col: Coleccion; borrar: string };

const no = <C extends string>(codigo: C): { ok: false; codigo: C } => ({ ok: false, codigo });
const si = <T>(datos: T): { ok: true; datos: T } => ({ ok: true, datos });

// A written amount (FMT-03), as cents above zero.
function montoEscrito(texto: string): ResultadoApp<Centavos, 'falta-monto' | 'mas-de-2-decimales'> {
  const l = leer(texto);
  if (!l.ok) return no(l.codigo === 'mas-de-2-decimales' ? 'mas-de-2-decimales' : 'falta-monto');
  return l.centavos > 0 ? si(l.centavos) : no('falta-monto');
}

// How an amount is shown to be edited: «1.500» or «12,50», like the v1.
const textoMonto = (c: number | undefined): string => (c ? mostrarNumero(c, c % 100 ? 2 : 0) : '');

export function crearApp({ almacen, reloj, ids, preferencias }: {
  almacen: Almacen; reloj: Reloj; ids: Ids; preferencias: Preferencias;
}): App {
  let S: Estado = { aj: ajustesBase(), cuentas: [], categorias: [], movs: [], fijos: [], ocurrencias: [], deudas: [], metas: [], apartados: [] };
  let esEjemplo = true, cargado = false, delEjemplo: Estado | null = null;
  const oyentes = new Set<() => void>();
  const avisar = (): void => { for (const f of [...oyentes]) f(); };

  function alCargar(d: Datos | null): void {
    const aj = d?.main?.aj;
    if (d && aj && aj.empezado) {
      const S2 = { aj: { ...ajustesBase(), ...aj } } as Estado;
      for (const c of COLECCIONES) (S2 as unknown as Record<string, unknown>)[c] = d.cols[c] ?? [];
      S = S2;
      esEjemplo = false;
    } else {
      S = delEjemplo ??= ejemplo(reloj.hoy());
      esEjemplo = true;
    }
    cargado = true;
    avisar();
  }
  const todo = (): Datos => ({
    main: { aj: S.aj } as Datos['main'], cols: Object.fromEntries(COLECCIONES.map((c) => [c, S[c]])) as unknown as Datos['cols'],
  });
  almacen.suscribir(avisar);
  almacen.iniciar({ alCargar, todo });

  // All the writes of a use case are checked first; if one fails, nothing changes.
  function aplicar(cambios: Escritura[]): ResultadoApp<null, CodigoError> {
    for (const e of cambios) {
      if ('doc' in e) {
        const v = validarDocumento(e.col, e.doc);
        if (!v.ok) return no(v.codigo);
      }
    }
    for (const e of cambios) {
      const lista = S[e.col] as { id: string }[];
      if ('doc' in e) {
        const i = lista.findIndex((x) => x.id === e.doc.id);
        if (i >= 0) lista[i] = e.doc;
        else lista.push(e.doc);
        if (!esEjemplo) almacen.escribir(e.col, e.doc);
      } else {
        (S as unknown as Record<string, unknown>)[e.col] = lista.filter((x) => x.id !== e.borrar);
        if (!esEjemplo) almacen.borrar(e.col, e.borrar);
      }
    }
    avisar();
    return si(null);
  }

  const hoy = (): string => reloj.hoy();

  return {
    estado: (): EstadoApp => ({
      cargado, ejemplo: esEjemplo, origen: almacen.origen, hoy: hoy(), color: S.aj.color ?? 'azul', guardado: almacen.estado(),
    }),
    suscribir: (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },

    rumbo: (o) => vistaRumbo(S, hoy(), o),
    movimientos: (o) => vistaMovimientos(S, hoy(), o),

    // MOV-01 and MOV-02: the last account used (or a day-to-day one), the most used categories first.
    formulario(id?: string): FormularioMovimiento | null {
      const cs = activos(S.cuentas);
      if (!cs.length) return null;
      const h = hoy(), mov = id ? S.movs.find((m) => m.id === id) : undefined;
      const ultima = preferencias.ultimaCuenta();
      const def = (cs.find((c) => c.id === ultima) ?? cs.find((c) => c.diaADia) ?? cs[0])!.id;
      const porUso = { gasto: categoriasPorUso(S, 'gasto', h).map(vistaCategoria), ingreso: categoriasPorUso(S, 'ingreso', h).map(vistaCategoria) };
      const tipo = mov && (mov.tipo === 'ingreso' || mov.tipo === 'transferencia') ? mov.tipo : 'gasto';
      const borrador: BorradorMovimiento = mov ? {
        id: mov.id, tipo, cuentaId: mov.cuentaId ?? def, cuentaDestinoId: mov.cuentaDestinoId ?? null, categoriaId: mov.categoriaId ?? null,
        monto: textoMonto(mov.monto), montoDestino: textoMonto(mov.montoDestino), nota: mov.nota ?? '', fecha: mov.fecha, usarTc: false,
      } : {
        id: ids.nuevo(), tipo: 'gasto', cuentaId: def, cuentaDestinoId: null, categoriaId: null, monto: '', montoDestino: '', nota: '', fecha: h, usarTc: false,
      };
      if (!borrador.categoriaId && borrador.tipo !== 'transferencia') borrador.categoriaId = porUso[borrador.tipo][0]?.id ?? null;
      return {
        editando: !!mov, borrador, porUso,
        cuentas: cs.map((c) => ({ id: c.id, nombre: c.nombre, moneda: c.moneda, saldo: saldoCuenta(S, c) })),
      };
    },

    notasSugeridas: (cat) => notasSugeridas(S, cat),

    // MOV-05
    avisoTope(b) {
      if (b.tipo !== 'gasto' || !b.categoriaId) return null;
      const k = categoriaDe(S, b.categoriaId), l = leer(b.monto);
      if (!((k.tope ?? 0) > 0) || !l.ok || !l.centavos) return null;
      return avisoTope(S, { id: b.id, categoriaId: k.id, cuentaId: b.cuentaId, monto: l.centavos, fecha: b.fecha || hoy() });
    },

    // CTA-06
    tipoDeCambio(b) {
      const c = cuentaDe(S, b.cuentaId), d = cuentaDe(S, b.cuentaDestinoId ?? undefined);
      if (b.tipo !== 'transferencia' || !c || !d || c.moneda === d.moneda) return null;
      const a = leer(b.monto), z = leer(b.montoDestino);
      if (!a.ok || !z.ok || !a.centavos || !z.centavos) return null;
      return c.moneda === 'BOB' ? tipoDeCambioDe(a.centavos, z.centavos) : tipoDeCambioDe(z.centavos, a.centavos);
    },

    // MOV-01, MOV-03, MOV-06, CTA-06, CTA-07
    anotar(b): ResultadoApp<Anotado, ErrorAnotar> {
      const h = hoy(), previo = S.movs.find((m) => m.id === b.id);
      const monto = montoEscrito(b.monto);
      if (!monto.ok) return monto;
      if (!cuentaDe(S, b.cuentaId)) return no('falta-cuenta');
      const m: Movimiento = { id: b.id, tipo: b.tipo, cuentaId: b.cuentaId, monto: monto.datos, nota: b.nota.trim(), fecha: b.fecha || h };
      if (previo?.fijoId) { m.fijoId = previo.fijoId; if (previo.mes) m.mes = previo.mes; }
      if (previo && previo.tc != null) m.tc = previo.tc;
      const cambios: Escritura[] = [];
      let ajustes = false;
      if (b.tipo === 'transferencia') {
        if (!b.cuentaDestinoId || b.cuentaDestinoId === b.cuentaId || !cuentaDe(S, b.cuentaDestinoId)) return no('misma-cuenta');
        m.cuentaDestinoId = b.cuentaDestinoId;
        const desde = monedaDe(S, b.cuentaId), hacia = monedaDe(S, b.cuentaDestinoId);
        if (desde !== hacia) {
          const z = leer(b.montoDestino);
          if (!z.ok) return no(z.codigo === 'mas-de-2-decimales' ? 'mas-de-2-decimales' : 'falta-monto-destino');
          if (!z.centavos) return no('falta-monto-destino');
          m.montoDestino = z.centavos;
          if (b.usarTc) {
            const tc = desde === 'BOB' ? tipoDeCambioParaGuardar(m.monto, z.centavos) : tipoDeCambioParaGuardar(z.centavos, m.monto);
            if (tc) ajustes = true;
          }
        }
      } else {
        if (!b.categoriaId) return no('falta-categoria');
        m.categoriaId = b.categoriaId;
      }
      const final = conTipoDeCambio(S, m);
      cambios.push({ col: 'movs', doc: final });
      const r = aplicar(cambios);
      if (!r.ok) return r;
      if (ajustes && final.montoDestino) {
        const desde = monedaDe(S, final.cuentaId);
        S.aj = { ...S.aj, tc: (desde === 'BOB' ? tipoDeCambioParaGuardar(final.monto, final.montoDestino) : tipoDeCambioParaGuardar(final.montoDestino, final.monto)) as number, tcFecha: h };
        if (!esEjemplo) almacen.guardarAjustes(() => S.aj);
        avisar();
      }
      preferencias.recordarCuenta(b.cuentaId);
      const previa = cuentasAbiertasDespues(S, final)[0];
      if (previa) return si({ aviso: 'antes-de-abrir', cuenta: previa.nombre });
      return si({ aviso: previo ? 'guardado' : b.tipo });
    },

    // MOV-04 and DEU-08: deleting a movement also frees the month of the fixed item it settled.
    borrarMovimiento(id) {
      aplicar([{ col: 'movs', borrar: id }, ...S.ocurrencias.filter((o) => o.movId === id).map((o) => ({ col: 'ocurrencias' as const, borrar: o.id }))]);
    },

    detalle(id): DetalleMovimiento | null {
      const m = S.movs.find((x) => x.id === id);
      if (!m) return null;
      const c = cuentaDe(S, m.cuentaId), d = deudaDe(S, m.deudaId);
      const dg = m.tipo === 'prestamo' && m.deGastoId ? (S.movs.find((x) => x.id === m.deGastoId && x.id !== m.id) ?? m) : null;
      return {
        id: m.id, tipo: m.tipo, donde: c ? c.nombre : d ? d.nombre : '', fecha: m.fecha, monto: m.monto, moneda: monedaMov(S, m),
        interes: m.interes ?? null, capital: m.capital ?? null,
        deGasto: dg ? { nombre: dg.nota || categoriaDe(S, dg.categoriaId).nombre, fecha: dg.fecha } : null,
      };
    },

    // DEU-12: the loan goes back to the expense it came from; the account does not move.
    devolverAlGasto(id) {
      const p = S.movs.find((x) => x.id === id), r = p ? devolverAlGasto(S, p) : null;
      if (!r) return no('no-sale-de-un-gasto');
      return aplicar([...r.borrar.map((b) => ({ col: 'movs' as const, borrar: b })), ...r.escribir.map((doc) => ({ col: 'movs' as const, doc }))]);
    },

    // FIJ-02 and FIJ-04: the movement first, then the month it settles.
    confirmarFijo(clave, texto): ResultadoApp<{ nombre: string }, ErrorFijo> {
      const i = clave.lastIndexOf('_'), fijoId = clave.slice(0, i), mes = clave.slice(i + 1);
      const f = S.fijos.find((x) => x.id === fijoId);
      const monto = montoEscrito(texto);
      if (!monto.ok) return monto;
      const r = f ? confirmarFijo(S, fijoId, mes, monto.datos) : null;
      if (!r || !f) return no('ya-estaba');
      const a = aplicar([{ col: 'movs', doc: conTipoDeCambio(S, r.mov) }, { col: 'ocurrencias', doc: r.ocurrencia }]);
      return a.ok ? si({ nombre: f.nombre }) : a;
    },

    // FIJ-02 and DEU-08
    saltarFijo(clave) {
      const i = clave.lastIndexOf('_'), fijoId = clave.slice(0, i), mes = clave.slice(i + 1);
      if (!S.fijos.some((x) => x.id === fijoId) || S.ocurrencias.some((o) => o.id === clave)) return no('ya-estaba');
      const r = saltarFijo(S, fijoId, mes);
      return aplicar([...(r.mov ? [{ col: 'movs' as const, doc: r.mov }] : []), { col: 'ocurrencias', doc: r.ocurrencia }]);
    },
  };
}
