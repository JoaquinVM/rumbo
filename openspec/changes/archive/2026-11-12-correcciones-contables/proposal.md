# Proposal

## Why

El análisis contable del 12/11/2026 encontró que Rumbo puede inventar dinero (deudas en dólares pagadas desde una cuenta
en Bs), anotar dos veces un pago (cuota pagada a mano, movimientos anteriores al saldo inicial) y mostrar números que no
concilian entre pantallas (Desglose, tasa de ahorro, Hoy). Joaquín pidió corregir todo antes de cargar sus datos reales.

## What Changes

- Una deuda solo se paga, cobra o recibe desde cuentas de su misma moneda.
- Nuevo movimiento: dinero que te prestan (sube la cuenta y la deuda, no es ingreso).
- Pagar una cuota a mano confirma el fijo de esa cuota; la primera cuota de un préstamo nuevo es la del mes siguiente
  si su día ya pasó.
- Cuentas y deudas guardan su fecha de apertura: lo anterior no vuelve a cambiar el saldo.
- El interés que no se paga (cuota saltada o pago corto) se suma a la deuda y cuenta como gasto.
- Cerrar una deuda con saldo deja un movimiento; una cuenta se archiva solo en cero.
- Un pago o cobro no puede pasar el saldo de la deuda.
- Los movimientos en dólares guardan el tipo de cambio del día.
- Hoy resta solo los fijos de las cuentas del día a día.
- Desglose muestra lo que cambió el patrimonio fuera de gastos e ingresos: cuadres, cambio de moneda y deudas cerradas.
- La tasa de ahorro cuenta el capital de las cuotas como ahorro; el promedio de Intereses usa el interés, no la cuota.
- «Plata de hoy» supone que ingresos y gastos suben con la inflación; las cuotas de préstamos no.

## Capabilities

### Modified Capabilities
- `deudas`: DEU-02 cambia; se agregan DEU-06 a DEU-10.
- `fijos`: se agregan FIJ-06 y FIJ-07.
- `cuentas`: se agregan CTA-07 y CTA-08.
- `movimientos`: se agrega MOV-06.
- `hoy`: HOY-02 cambia.
- `desglose`: se agregan DES-03 y DES-04.
- `indicadores`: IND-01 cambia.
- `proyeccion`: PRO-05 cambia.

## Impact

- `index.html`: dominio (saldos, deudas, ritmo, proyección, Hoy, resumen del mes) y formularios de deuda, pago y cuenta.
- Tipos de movimiento nuevos `recibido`, `interes` y `cierre`; campos nuevos `desde` (cuentas, deudas) y `tc`
  (movimientos en dólares). Los datos sin esos campos siguen funcionando como antes.
- Toca dinero y datos guardados: en Foundry es Crisol.
