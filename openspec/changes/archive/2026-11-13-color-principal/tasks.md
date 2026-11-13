# Tasks

## 1. Color principal

- [x] 1.1 Agregar `PALETA` y `colorDe(aj)` (desconocido o ausente → azul) en `index.html`; prueba `AJU-05 color por defecto y desconocido` en `pruebas/verificar.mjs`.
- [x] 1.2 Agregar `--azul-on` y `--azul-l` (con los valores de hoy) y usarlas donde hoy hay `#fff` sobre `--azul` y `var(--azul)` como texto o trazo; aplicar el color con `<style id="tema">` al cargar datos (base, navegador y ejemplo), al cargar un respaldo y al borrar todo; prueba `AJU-05 el tema solo cambia las variables del color principal` y `AJU-05 ningún blanco fijo sobre el color principal` en `pruebas/verificar.mjs`.
- [x] 1.3 Sección «Apariencia» en `vAjustes()` con los 4 colores; al tocar uno, guarda `aj.color` con `guardarAj()` (en el ejemplo no guarda) y redibuja. Verificar con `npm run verificar` (la vista se dibuja) y el ensayo en navegador eligiendo Rosa pastel en claro y oscuro.
- [x] 1.4 Prueba `AJU-05 el respaldo conserva el color` en `pruebas/verificar.mjs`.

## 2. Documentos

- [x] 2.1 Actualizar `docs/DISENO.md` (el azul se puede elegir; paleta), `docs/DOMINIO.md` (Ajustes suma color) y anotar la decisión en `docs/DECISIONES.md`.
- [x] 2.2 `openspec validate --all --strict` pasa.
