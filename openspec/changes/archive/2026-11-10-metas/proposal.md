# Proposal

## Why

El prototipo resta un «ahorro mensual» fijo sin decir para qué es. Joaquín quiere metas con fecha («Fondo de emergencia, Bs 15.000 para diciembre de 2027») que le digan si llega a este ritmo y cuánto apartar por mes, reservando ese dinero sin moverlo de cuenta (apartado virtual). Va antes de `fijos-por-confirmar-y-hoy` porque el libre del día resta lo que falta apartar.

## What Changes

- Nueva capability de metas: nombre, monto y fecha.
- «Apartar» reserva dinero de una cuenta para una meta sin moverlo; lo apartado deja de contar como disponible. Se puede desapartar.
- Aporte sugerido al mes y cuánto falta apartar este mes.
- Cada meta dice cuánto lleva y si va bien; las metas se marcan en la gráfica.
- Plan y Rumbo muestran las metas en un bloque verde.

## Capabilities

### New Capabilities
- `metas`: metas con fecha, apartados virtuales por cuenta, aporte sugerido y estado.

### Modified Capabilities
- `pantallas`: se agrega PAN-08 (metas en Rumbo y Plan).

## Impact

- `index.html`: colecciones `metas` y `apartados`, pantalla de detalle de meta, bloque de metas.
- Toca dinero y datos guardados: en Foundry es Crisol.
- Depende de `base-bolivianos-y-cuentas`.
