# Proposal

## Why

En el Desglose del mes se ve cuánto entró en un solo número, y solo los gastos se abren por categoría. Joaquín quiere
ver de dónde vino lo que entró: «quisiera ver un detalle de los ingresos del mes, solo se ve los gastos por categoria en
desglose» (trabajo 106).

## What Changes

- Debajo de los gastos y de «Te quedas tú», el Desglose muestra **«De dónde entró»**: una fila por categoría de ingreso
  del mes, de la que más entró a la que menos, con su ícono, su total en Bs y cuánto es de cada 100 que entraron.
- Las filas suman exactamente lo que dice «Entró»: los mismos ingresos, pasados a Bs con el tipo de cambio de cada uno
  (MOV-06), agrupados por su categoría.
- Al tocar una fila se abre Movimientos de ese mes con esa categoría elegida y sin filtro de cuenta, como ya pasa con
  los gastos (DES-05 y MOV-07, que ya cuenta los ingresos de una categoría de ingreso).
- Si en el mes no entró nada, la sección no aparece.
- No cambia ningún dato guardado ni ningún otro cálculo: «Entró», «Salió», «Quedó» y los gastos siguen igual.
- **Crisol** por cantidades: suma montos por categoría.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `desglose`: DES-06 De dónde entró (nuevo).

## Impact

- `paquetes/dominio`: `resumenMes` también agrupa los ingresos por categoría.
- `paquetes/contratos`: `VistaDesglose` lleva la lista de ingresos.
- `app`: `vistaDesglose` y la pantalla `Desglose.tsx`.
- Pruebas en Vitest nombradas con DES-06.
