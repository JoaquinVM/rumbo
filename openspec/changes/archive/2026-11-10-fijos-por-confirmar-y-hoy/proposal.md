# Proposal

## Why

En el prototipo los fijos se cuentan solos y el «libre» se calcula sobre el mes de calendario, contando un sueldo que todavía no llegó. Con cuentas reales, los saldos solo cuadran si cada fijo se confirma cuando pasa, y lo que se puede gastar hoy debe salir del dinero que hay en las cuentas hasta el próximo sueldo (opción D elegida por Joaquín: el día a día hasta el próximo ingreso y los reportes por mes de calendario).

## What Changes

- Cada fijo tiene cuenta y día del mes; si el mes no tiene ese día, cae el último.
- **BREAKING** Los fijos ya no se registran solos: desde su día aparecen en «Por confirmar» con el monto editable, y la persona elige «Confirmar» (crea el movimiento) o «No este mes».
- El libre se calcula con el dinero de las cuentas del día a día (sin lo apartado para metas), menos los fijos que vencen antes del próximo ingreso fijo y no están confirmados ni saltados, menos lo que falta apartar este mes para metas; se divide entre los días hasta el próximo ingreso.
- Un ingreso irregular sube el libre en el momento.
- Empezar pide el día de cada fijo; Rumbo muestra Hoy y Por confirmar arriba.

## Capabilities

### New Capabilities

### Modified Capabilities
- `fijos`: FIJ-01 con cuenta y día; se quita FIJ-03 (se contaban solos); se agregan FIJ-02 (Por confirmar) y FIJ-05 (pendiente no es pagado).
- `hoy`: HOY-02 y HOY-03 pasan a «hasta tu próximo ingreso»; se agregan HOY-01 (disponible) y HOY-04 (ingreso irregular).
- `datos`: DAT-02 pide el día de cada fijo.
- `pantallas`: PAN-02 con Hoy, Por confirmar y avisos.

## Impact

- `index.html`: colección nueva `ocurrencias`, cálculo del libre y del próximo ingreso, bloque Por confirmar.
- Toca dinero y datos guardados: en Foundry es Crisol.
- Depende de `base-bolivianos-y-cuentas` y `metas`.
