// The Zod schema of every document Rumbo keeps (DAT-09, docs/DOMINIO.md), the same rules for the page and the server.
// Each amount of money is a whole number of cents, the `Centavos` of the domain (the 12 fields of DAT-08). Rates stay
// decimal. Every schema lets unknown fields through, so nothing a later version adds is lost (DAT-05).
// Each check fails with an error code, never a text: the page picks the words.
import { z } from 'zod';
import type { Centavos } from '@rumbo/dominio';

export const CODIGOS_DOCUMENTO = [
  'documento-invalido', // not an object
  'falta-campo', // a field its type asks for is missing
  'falta-categoria', // a gasto or ingreso without category
  'monto-no-entero', // money that is not a whole number of cents
  'tipo-desconocido',
  'moneda-desconocida',
  'fecha-invalida', // not AAAA-MM-DD
  'mes-invalido', // not AAAA-MM
  'id-invalido',
  'campo-invalido', // any other field with the wrong kind of value
] as const;
export type CodigoDocumento = (typeof CODIGOS_DOCUMENTO)[number];

// The id of a document, as it goes in the URL of the API.
export const ID = /^[A-Za-z0-9_.:-]{1,100}$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const MES = /^\d{4}-\d{2}$/;

// The error of a field: missing when it is not there, `codigo` when it has the wrong value.
const err = (codigo: CodigoDocumento, falta: CodigoDocumento = 'falta-campo') =>
  ({ error: (iss: { input?: unknown }) => (iss.input === undefined ? falta : codigo) });

export const centavos = z.custom<Centavos>((v) => typeof v === 'number' && Number.isSafeInteger(v), err('monto-no-entero'));
const id = z.string(err('id-invalido')).regex(ID, { error: 'id-invalido' });
const ref = (falta: CodigoDocumento = 'falta-campo') => z.string(err('campo-invalido', falta)).min(1, { error: falta });
const texto = z.string(err('campo-invalido'));
const numero = z.number(err('campo-invalido'));
const si = z.boolean(err('campo-invalido'));
const dia = z.string(err('fecha-invalida')).regex(DIA, { error: 'fecha-invalida' });
const mes = z.string(err('mes-invalido')).regex(MES, { error: 'mes-invalido' });
const moneda = z.enum(['BOB', 'USD'], err('moneda-desconocida'));
const diaDelMes = z.number(err('campo-invalido')).int({ error: 'campo-invalido' })
  .min(1, { error: 'campo-invalido' }).max(31, { error: 'campo-invalido' });
const tipoCategoria = z.enum(['gasto', 'ingreso'], err('tipo-desconocido'));
const objeto = <T extends z.core.$ZodLooseShape>(forma: T) => z.looseObject(forma, err('documento-invalido'));

export const Ajustes = objeto({
  tc: numero,
  tcFecha: dia.nullable(),
  inflacion: numero,
  irregular: centavos,
  horas: numero,
  empezado: si,
  color: texto.optional(),
});
// The main document of a person: {aj: Ajustes}.
export const Principal = objeto({ aj: Ajustes });

export const Cuenta = objeto({
  id,
  nombre: texto,
  moneda,
  saldoInicial: centavos,
  rendimiento: numero.optional(),
  diaADia: si.optional(),
  archivada: si.optional(),
  desde: dia.optional(),
});

export const Categoria = objeto({
  id,
  nombre: texto,
  tipo: tipoCategoria,
  tope: centavos.optional(),
  color: texto.optional(),
  icono: texto.optional(),
  base: si.optional(),
  archivada: si.optional(),
});

// A movement (docs/DOMINIO.md, 4): what every type has, plus the fields its type asks for.
const movimiento = {
  id,
  fecha: dia,
  monto: centavos,
  cuentaId: ref().optional(),
  cuentaDestinoId: ref().optional(),
  montoDestino: centavos.optional(),
  categoriaId: ref().optional(),
  nota: texto.optional(),
  deudaId: ref().optional(),
  interes: centavos.optional(),
  capital: centavos.optional(),
  sentido: numero.optional(),
  tc: numero.nullable().optional(),
  fijoId: ref().optional(),
  mes: mes.optional(),
  deGastoId: ref().optional(),
};
const tipoMov = <T extends string, F extends z.core.$ZodLooseShape>(tipo: T, pide: F) =>
  objeto({ ...movimiento, tipo: z.literal(tipo), ...pide });
const conCategoria = { cuentaId: ref(), categoriaId: ref('falta-categoria') };
const conDeuda = { cuentaId: ref(), deudaId: ref() };
export const Movimiento = z.discriminatedUnion('tipo', [
  tipoMov('gasto', conCategoria),
  tipoMov('ingreso', conCategoria),
  tipoMov('transferencia', { cuentaId: ref(), cuentaDestinoId: ref() }),
  tipoMov('ajuste', { cuentaId: ref() }),
  tipoMov('pago', conDeuda),
  tipoMov('cobro', conDeuda),
  tipoMov('prestamo', conDeuda),
  tipoMov('recibido', conDeuda),
  tipoMov('interes', { deudaId: ref() }), // unpaid interest has no account
  tipoMov('cierre', { deudaId: ref() }),
], { error: 'tipo-desconocido' });

export const Fijo = objeto({
  id,
  nombre: texto,
  tipo: tipoCategoria,
  monto: centavos,
  cuentaId: ref(),
  categoriaId: ref('falta-categoria'),
  dia: diaDelMes,
  deudaId: ref().nullable().optional(),
  desde: mes.optional(),
  activo: si.optional(),
});

export const Ocurrencia = objeto({
  id,
  fijoId: ref(),
  mes,
  estado: z.enum(['confirmado', 'saltado'], err('campo-invalido')),
  movId: ref().nullable(),
});

// A debt: a loan asks for its rate, its installment and its day; with a person or «te deben», they are optional.
const deuda = {
  id,
  nombre: texto,
  moneda,
  saldoInicial: centavos,
  interes: numero.optional(), // a yearly rate, not money: it stays decimal (DAT-08)
  cuota: centavos.optional(),
  dia: diaDelMes.optional(),
  fechaEsperada: mes.nullable().optional(),
  desde: dia.optional(),
  archivada: si.optional(),
};
export const Deuda = z.discriminatedUnion('tipo', [
  objeto({ ...deuda, tipo: z.literal('prestamo'), interes: numero, cuota: centavos, dia: diaDelMes }),
  objeto({ ...deuda, tipo: z.literal('persona') }),
  objeto({ ...deuda, tipo: z.literal('teDeben') }),
], { error: 'tipo-desconocido' });

export const Meta = objeto({
  id,
  nombre: texto,
  monto: centavos,
  mes,
  archivada: si.optional(),
});

export const Apartado = objeto({
  id,
  metaId: ref(),
  cuentaId: ref(),
  monto: centavos, // positive to set aside, negative to take back
  fecha: dia,
});

export const COLECCIONES = ['cuentas', 'categorias', 'movs', 'fijos', 'ocurrencias', 'deudas', 'metas', 'apartados'] as const;
export type Coleccion = (typeof COLECCIONES)[number];
export const ESQUEMAS = {
  cuentas: Cuenta,
  categorias: Categoria,
  movs: Movimiento,
  fijos: Fijo,
  ocurrencias: Ocurrencia,
  deudas: Deuda,
  metas: Meta,
  apartados: Apartado,
} as const satisfies Record<Coleccion, z.ZodType>;

export type Ajustes = z.infer<typeof Ajustes>;
export type Principal = z.infer<typeof Principal>;
export type Cuenta = z.infer<typeof Cuenta>;
export type Categoria = z.infer<typeof Categoria>;
export type Movimiento = z.infer<typeof Movimiento>;
export type Fijo = z.infer<typeof Fijo>;
export type Ocurrencia = z.infer<typeof Ocurrencia>;
export type Deuda = z.infer<typeof Deuda>;
export type Meta = z.infer<typeof Meta>;
export type Apartado = z.infer<typeof Apartado>;
export type Documento<C extends Coleccion = Coleccion> = z.infer<(typeof ESQUEMAS)[C]>;
