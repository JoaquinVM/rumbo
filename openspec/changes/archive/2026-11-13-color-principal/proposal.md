# Proposal

## Why

Joaquín quiere elegir el color principal de Rumbo. Hoy es siempre el azul `#2B47E0`. Pidió una paleta corta que
incluya el rosa, elegida en Ajustes y guardada en su base para que se vea igual en todos sus equipos.

## What Changes

- Ajustes suma una sección **Apariencia** con 4 colores para elegir: **Azul** (el de hoy y el que viene por defecto),
  **Cielo**, **Morado** y **Rosa pastel**.
- El color elegido reemplaza al azul en todo lo que hoy es azul: bloque Hoy, patrimonio, resumen del mes, monto de los
  formularios, opción elegida, pestaña activa, línea de la proyección, aviso suave, etiqueta «Fijo» y el logo.
- Cada color trae su tono suave, su texto y su variante para modo oscuro, revisados para que se lean bien. El Rosa
  pastel lleva texto vino en sus bloques, porque el blanco no se lee sobre él, y un rosa más fuerte para los detalles
  sobre el fondo claro.
- No cambian el ámbar (avisos), el verde (metas), el rojo (te pasaste), el ladrillo (lo que debes) ni la tinta
  (acciones). Se descartó el turquesa porque se confunde con el verde de metas.
- Se elige con un toque y se ve al instante. En el ejemplo se ve, pero no se guarda.
- **Datos:** campo nuevo y opcional en los Ajustes guardados (`aj.color`). No se renombra ni se borra nada. Si falta,
  se usa Azul, así que no hace falta migrar. El respaldo lo lleva solo, porque ya guarda los Ajustes completos. Por
  esto el trabajo es **Crisol** (datos guardados). No toca dinero ni cantidades.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `ajustes`: nuevo requirement AJU-05 Color principal.

## Impact

- `index.html`: los colores de la paleta, la sección Apariencia en `vAjustes()` y cómo se aplica el color al cargar y
  al elegir.
- `pruebas/verificar.mjs`: pruebas de AJU-05.
- `docs/DISENO.md` (la tabla de color dice que el azul se puede elegir), `docs/DOMINIO.md` (Ajustes suma el color) y
  `docs/DECISIONES.md`.
