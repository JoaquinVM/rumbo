# Proposal

## Why

Las categorías del prototipo son fijas y no hay forma de ponerse un límite. Joaquín quiere categorías propias y un tope mensual simple por categoría, con aviso al acercarse y al pasarse, para corregir antes de que el mes se rompa.

## What Changes

- Las categorías se crean, renombran, cambian de color e ícono y se archivan; no hay subcategorías.
- Cada categoría de gasto puede tener un tope mensual; cuenta los gastos del mes de calendario, incluidos los fijos confirmados, y lo que sobra no pasa al mes siguiente.
- Aviso al llegar al 80 % (ámbar) y al pasar el 100 % (rojo), en Rumbo, en el Desglose y al guardar un gasto.
- El Desglose muestra el avance de cada tope.

## Capabilities

### New Capabilities

### Modified Capabilities
- `categorias`: se agregan LIM-01 (categorías editables), LIM-03 (tope mensual) y LIM-04 (avisos).
- `movimientos`: se agrega MOV-05 (aviso al guardar).
- `desglose`: DES-02 muestra el avance del tope.
- `pantallas`: se agrega PAN-09 (categorías y topes en Plan).

## Impact

- `index.html`: editor de categorías, cálculo del avance de topes, avisos.
- Toca cantidades y datos guardados (campos nuevos en `categorias`): en Foundry es Crisol.
- Depende de `base-bolivianos-y-cuentas` y `fijos-por-confirmar-y-hoy`.
