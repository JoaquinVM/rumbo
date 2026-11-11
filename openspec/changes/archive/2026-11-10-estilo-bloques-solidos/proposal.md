# Proposal

## Why

El prototipo se parece a muchas otras apps y sus botones no se distinguen de las tarjetas. Joaquín eligió el estilo «Bloques sólidos» en los mockups de v1, con íconos SVG y un estilo propio para las acciones.

## What Changes

- Lo importante de cada pantalla pasa a bloques de color sólido con texto blanco: azul para el dinero de hoy, ámbar para pendientes y avisos, verde para metas y ahorro, rojo solo al pasarse de un tope y ladrillo para deudas.
- Indicadores en baldosas de tono suave; listas en filas blancas con un ícono SVG en un cuadrito del color de su categoría (nunca letras ni emojis).
- Botones con estilo propio: el principal en tinta oscura con esquinas de 12 px y sombra inferior, el secundario como texto subrayado, «Agregar» con borde punteado. Las opciones elegibles son pastillas con borde fino.
- Solo cambia la apariencia: no cambia ningún cálculo ni ningún dato guardado.

## Capabilities

### New Capabilities

### Modified Capabilities
- `pantallas`: PAN-06 pasa del estilo del prototipo a Bloques sólidos según `docs/DISENO.md`.

## Impact

- `index.html`: solo CSS y marcado; ningún cálculo.
- No toca dinero, cantidades ni datos guardados: en Foundry es Chispa.
- Referencia: `docs/DISENO.md` y los mockups https://claude.ai/artifact/JYRHrYcp9M72Tp22bMvnCy
