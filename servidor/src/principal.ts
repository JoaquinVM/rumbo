// Starts Rumbo 2's server, configured by environment like the v1 (deploy/.env.example). In the image:
//   node --conditions=rumbo-compilado servidor/dist/principal.js
// PAGINA is the folder of the built page (app/dist by default).
import { crearVerificador } from './access.js';
import { crearBase } from './base.js';
import { crearServidor, leerPagina } from './servidor.js';

const falta = ['ACCESS_TEAM', 'ACCESS_AUD', 'CORREOS_PERMITIDOS', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE']
  .filter((n) => !process.env[n]);
if (falta.length) {
  console.error('Faltan variables:', falta.join(', '));
  process.exit(1);
}

const base = await crearBase();
const verificar = crearVerificador({ equipo: process.env.ACCESS_TEAM, aud: process.env.ACCESS_AUD });
const archivos = leerPagina(process.env.PAGINA ?? new URL('../../app/dist/', import.meta.url));
const servidor = crearServidor({ base, verificar, correos: (process.env.CORREOS_PERMITIDOS ?? '').split(','), archivos });
const puerto = Number(process.env.PORT || 8080);
servidor.listen(puerto, () => console.log(`Rumbo 2 escucha en el puerto ${puerto}`));
const parar = (): void => { servidor.close(() => { base.cerrar().finally(() => process.exit(0)); }); };
process.on('SIGTERM', parar);
process.on('SIGINT', parar);
