# Proposal

## Why

Joaquín pidió (trabajo 073): «Rumbo instalable en el teléfono (PWA): manifest, íconos para iPhone (apple-touch-icon 180
px) y Android (192 y 512 px, con versión maskable), nombre, color de tema y pantalla de inicio, sin cambiar ningún
cálculo. Probarlo agregándolo a la pantalla de inicio en un iPhone y un Android.»

Aprobó el 14/11/2026: ícono A (brújula blanca sobre bloque azul `#2B47E0`), nombre «Rumbo» y el fondo de la app como
color de tema y de la pantalla de inicio.

## What Changes

- El servidor entrega `manifest.webmanifest` y los íconos de `iconos/` (180, 192 y 512; el de 512 también como
  maskable), y la página que arma suma el enlace al manifest (con `crossorigin="use-credentials"`, porque todo pasa por
  Cloudflare Access), el `apple-touch-icon`, el color de tema claro y oscuro y lo necesario para abrirse a pantalla
  completa en el iPhone.
- Al abrirse desde la pantalla de inicio, Rumbo se ve sin la barra del navegador y con su ícono y nombre.
- Sin service worker: Rumbo se usa con internet (decisión 48).
- No cambia ningún cálculo, dato guardado ni `index.html`.

## Capabilities

### Modified Capabilities

- `pantallas`: nuevo PAN-10, instalable en el teléfono.

## Impact

- `servidor/servidor.mjs` (rutas de archivos fijos y cabecera de la página), nuevos `manifest.webmanifest` e `iconos/`,
  `deploy/Dockerfile` y `.dockerignore` (los copian), `pruebas/servidor.test.mjs`, `docs/DISENO.md` y
  `docs/DECISIONES.md`.
