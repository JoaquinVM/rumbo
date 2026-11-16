# Proposal

## Why

Joaquín quiere entrar a Rumbo con Google y sumar a la otra persona que usaba el artifact, con sus propios datos. Hoy
Cloudflare Access solo pide un código por correo y deja pasar solo el correo de Joaquín.

## What Changes

- La aplicación «Rumbo» de Cloudflare Access suma **Google** como forma de entrar. El código por correo se queda, por si
  Google falla.
- La política de Access y `CORREOS_PERMITIDOS` (en `/opt/apps/rumbo/.env`) suman el correo de la otra persona. Nadie
  más entra.
- Ella baja su respaldo del artifact y lo carga en Ajustes > Cargar respaldo de `rumbo.jviscafe.com`.
- **El código no cambia:** el servidor ya guarda los datos por correo (DAT-03) y ya rechaza con 403 un correo que no
  está en la lista. Entrar con Google da el mismo correo, así que Joaquín sigue viendo sus datos.
- **Crisol** por permisos. No toca dinero, cantidades ni datos guardados.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `publicacion`: PUB-01 Dirección y entrada (se entra con Google o con el código; dos correos aprobados).

## Impact

- Cloudflare Zero Trust (`empty-truth-cd43`): método de inicio Google y política de la aplicación «Rumbo».
- Google Cloud: un cliente OAuth para Access.
- VPS: `/opt/apps/rumbo/.env` y recrear solo el contenedor `app` del proyecto `rumbo` (lo corre Joaquín).
- `docs/DESPLIEGUE.md` (cómo se entra y cómo sumar un correo) y `docs/DECISIONES.md`.
