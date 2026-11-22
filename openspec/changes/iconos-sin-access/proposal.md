# Proposal

## Why

Al agregar Rumbo a la pantalla de inicio del iPhone no aparece la brújula. La página declara bien el ícono
(`/iconos/icono-180.png`), pero el iPhone lo pide sin la sesión de Cloudflare Access, y Access le contesta con la
pantalla de entrada en lugar de la imagen.

## What Changes

- Una aplicación aparte en Cloudflare Access, «Rumbo iconos», con una política *Bypass* solo para
  `rumbo.jviscafe.com/iconos/*` y `rumbo.jviscafe.com/manifest.webmanifest`: esos archivos se entregan sin iniciar
  sesión. Solo tienen la brújula, el nombre «Rumbo» y los colores; ningún dato.
- La página, la API y todo lo demás siguen detrás de la aplicación «Rumbo», que no cambia. La API sigue exigiendo el
  token de Access (PUB-01).
- **El código no cambia:** el servidor ya entrega los archivos de la página sin token y exige el token solo en la API.
- **Crisol** por permisos: cambia qué se ve sin iniciar sesión.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `pantallas`: PAN-10 Instalable en el teléfono (el manifest y los íconos se entregan sin iniciar sesión).

## Impact

- Cloudflare Zero Trust (`empty-truth-cd43`): aplicación nueva «Rumbo iconos» con política *Bypass*.
- `docs/DESPLIEGUE.md` y `docs/DECISIONES.md`.
