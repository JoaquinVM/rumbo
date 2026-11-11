# Proposal

## Why

Sin deudas, el patrimonio y la proyección mienten: Joaquín necesita ver préstamos, deudas con personas y dinero que le deben, cuándo termina de pagar, cuánto interés paga y qué gana adelantando pagos.

## What Changes

- Nueva capability de deudas: préstamo (con interés y cuota), deuda con una persona y dinero que te deben.
- Movimientos nuevos: pago de deuda (interés como gasto en Intereses y capital que baja la deuda), cobro y préstamo dado.
- Un fijo puede ser la cuota de una deuda.
- La proyección amortiza cada préstamo y dice cuándo termina y cuánto más se ahorra desde ahí.
- «¿Y si…?» suma la palanca de adelantar un préstamo.
- Indicador de deuda total y mes libre de préstamos; deudas en Plan y detalle del préstamo con sus próximas cuotas.

## Capabilities

### New Capabilities
- `deudas`: lo que se debe y lo que te deben, sus pagos y su interés.

### Modified Capabilities
- `fijos`: se agrega FIJ-04 (cuota de una deuda).
- `proyeccion`: se agrega PRO-04 (amortización); PRO-08 suma adelantar un préstamo.
- `indicadores`: se agrega IND-04 (deuda total).
- `pantallas`: se agrega PAN-07 (deudas en Plan y detalle del préstamo).

## Impact

- `index.html`: colección `deudas`, tipos de movimiento nuevos, amortización, detalle del préstamo.
- Toca dinero y datos guardados: en Foundry es Crisol.
- Depende de `base-bolivianos-y-cuentas` y `fijos-por-confirmar-y-hoy`.
