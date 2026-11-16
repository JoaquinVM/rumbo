// Only for the tests (nobody else imports it). What the tests of the app use: a person with Efectivo Bs 650, Banco Bs 3.550 and Dólares US$ 1.200 at 12,50, the
// electricity due on the 8th, and the app on a memory store on 10 November 2026.
import { validarDocumento, type Datos } from '@rumbo/contratos';
import { categoriasBase } from '@rumbo/dominio';
import { almacenMemoria, type AlmacenMemoria } from '../infraestructura/almacen-memoria';
import { crearApp } from '../aplicacion/app';

export const HOY = '2026-11-10';

export function datosDePrueba(): Datos {
  return {
    main: { aj: { tc: 12.5, tcFecha: '2026-11-08', inflacion: 8, irregular: 0, horas: 160, empezado: true } } as Datos['main'],
    cols: {
      categorias: categoriasBase(),
      cuentas: [
        { id: 'ef', nombre: 'Efectivo', moneda: 'BOB', saldoInicial: 65000, rendimiento: 0, diaADia: true, archivada: false, desde: '2026-11-01' },
        { id: 'bn', nombre: 'Banco', moneda: 'BOB', saldoInicial: 355000, rendimiento: 0, diaADia: true, archivada: false },
        { id: 'us', nombre: 'Dólares', moneda: 'USD', saldoInicial: 120000, rendimiento: 0, diaADia: false, archivada: false },
      ],
      fijos: [
        { id: 'luz', nombre: 'Luz', tipo: 'gasto', monto: 18000, cuentaId: 'bn', categoriaId: 'casa', dia: 8, desde: '2026-11', activo: true },
        { id: 'sueldo', nombre: 'Sueldo', tipo: 'ingreso', monto: 800000, cuentaId: 'bn', categoriaId: 'sueldo', dia: 25, desde: '2026-11', activo: true },
      ],
      movs: [{ id: 'almuerzo', tipo: 'gasto', cuentaId: 'ef', categoriaId: 'comida', monto: 3500, fecha: '2026-11-09', nota: 'Almuerzo' }],
      ocurrencias: [], deudas: [], metas: [], apartados: [],
    } as unknown as Datos['cols'],
  };
}

export function appDePrueba(datos: Datos | null = datosDePrueba()) {
  const almacen: AlmacenMemoria = almacenMemoria(datos);
  let n = 0, ultima: string | null = null;
  const app = crearApp({
    almacen, reloj: { hoy: () => HOY }, ids: { nuevo: () => `nuevo${++n}` },
    preferencias: { ultimaCuenta: () => ultima, recordarCuenta: (id) => { ultima = id; } }, validar: () => validarDocumento,
  });
  return { app, almacen };
}
