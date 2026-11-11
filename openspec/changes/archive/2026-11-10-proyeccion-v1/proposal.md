# Proposal

## Why

El ingreso de Joaquín es una base fija más ingresos irregulares (negocio, ventas). Con el promedio real, un mes muy bueno o muy malo mueve toda la proyección. Y con la inflación de Bolivia, un monto a 5 años sin descontarla se ve más grande de lo que podrá comprar.

## What Changes

- El ritmo usa el ingreso irregular que la persona espera al mes en lugar del promedio real; Ajustes muestra el promedio real de 3 meses como referencia.
- La proyección se muestra en plata de hoy, descontando la inflación anual que pone la persona; un toque cambia a montos nominales.
- La proyección mantiene constante el tipo de cambio y lo dice debajo de la gráfica.

## Capabilities

### New Capabilities

### Modified Capabilities
- `proyeccion`: PRO-02 usa el ingreso irregular esperado; se agregan PRO-05 (inflación) y PRO-06 (tipo de cambio constante).
- `ajustes`: se agregan AJU-01 (ingreso irregular esperado) y AJU-02 (inflación).

## Impact

- `index.html`: cálculo del ritmo y de la proyección, Ajustes, interruptor plata de hoy y nominal.
- Toca cálculos de dinero: en Foundry es Crisol.
- Depende de `base-bolivianos-y-cuentas`.
