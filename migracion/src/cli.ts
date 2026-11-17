// DAT-08 · The migration's command (docs/DESPLIEGUE.md, «Corte a Rumbo 2»). It reads the database from the PG*
// variables (PGPASSWORD may come as DB_PASSWORD, as in /opt/apps/rumbo/.env).
//   node migracion/dist/cli.js                 solo revisar: nothing is written
//   node migracion/dist/cli.js --aplicar       converts, writes Rumbo 2's tables and verifies, all or nothing
//   node migracion/dist/cli.js --volver        Rumbo 2's data back to the v1 tables (take a backup first)
// --detalle shows what does not match between the engines (it carries amounts: only on the person's own screen).
// --de-nuevo lets --aplicar run when a migration is already noted. --hoy AAAA-MM-DD fixes the date of the check.
// Exit: 0 it fits or it was done, 1 it does not fit, 2 error.
import pg from 'pg';
import { cargarMotor } from '../../pruebas/v1/motor.mjs';
import { MigracionNoCuadra, TABLAS_V2, YaMigrada, aplicar, revisar, textoInforme, volver } from './migracion';

process.env.TZ ||= 'America/La_Paz'; // the v1 works with local dates, where Rumbo is used
const args = process.argv.slice(2);
const conocidas = new Set(['--aplicar', '--volver', '--detalle', '--de-nuevo', '--hoy']);
const malas = args.filter((a, i) => a.startsWith('--') && !conocidas.has(a) && args[i - 1] !== '--hoy');
if (malas.length || (args.includes('--aplicar') && args.includes('--volver'))) {
  console.error(`Uso: migracion [--aplicar | --volver] [--detalle] [--de-nuevo] [--hoy AAAA-MM-DD]${malas.length ? ` (no conozco ${malas.join(', ')})` : ''}`);
  process.exit(2);
}
const i = args.indexOf('--hoy');
const pad = (n: number): string => String(n).padStart(2, '0');
const d = new Date();
const hoy = i >= 0 ? args[i + 1] ?? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
if (!/^\d{4}-\d{2}-\d{2}$/.test(hoy)) { console.error('--hoy va como AAAA-MM-DD'); process.exit(2); }

const cliente = new pg.Client({ password: process.env.PGPASSWORD ?? process.env.DB_PASSWORD });
let salida = 2;
try {
  await cliente.connect();
  if (args.includes('--aplicar') || args.includes('--volver')) await cliente.query(TABLAS_V2); // solo revisar creates nothing
  const v1 = cargarMotor({ hoy: `${hoy}T12:00:00` });
  if (args.includes('--volver')) {
    const r = await volver(cliente);
    for (const p of r) console.log(`Persona ${p.persona}: ${Object.entries(p.documentos).map(([k, n]) => `${n} ${k}`).join(', ')} vueltos a la v1`);
    console.log(r.length ? 'Listo: la v1 tiene lo de Rumbo 2, en decimales. Publica el último tag de la v1.' : 'Rumbo 2 no tiene datos: la v1 queda como estaba.');
    salida = 0;
  } else if (args.includes('--aplicar')) {
    const r = await aplicar(cliente, v1, hoy, { deNuevo: args.includes('--de-nuevo') });
    console.log(textoInforme(r, args.includes('--detalle')));
    console.log('Migración aplicada y verificada: anotada en v2_migracion. La v1 no cambió.');
    salida = 0;
  } else {
    console.log('Solo revisar: no se escribe nada.');
    const r = await revisar(cliente, v1, hoy);
    console.log(textoInforme(r, args.includes('--detalle')));
    salida = r.cuadra ? 0 : 1;
  }
} catch (e) {
  if (e instanceof MigracionNoCuadra) {
    console.log(textoInforme(e.informe, args.includes('--detalle')));
    console.log('No se escribió nada: la transacción se deshizo.');
    salida = 1;
  } else {
    console.error(e instanceof YaMigrada ? e.message : `Error: ${(e as Error).message}`);
    salida = 2;
  }
} finally {
  await cliente.end().catch(() => {});
}
process.exit(salida);
