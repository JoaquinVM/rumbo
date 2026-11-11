# Design

## Context

Hay cuentas, movimientos con cuenta, fijos con ocurrencias y una proyección por cuenta. Ver `docs/DOMINIO.md` (Deuda, Movimiento).

## Goals / Non-Goals

**Goals:**
- Saldo de cada deuda calculado de su saldo inicial y sus pagos, nunca guardado.
- Una sola función de amortización para el detalle, la proyección y «¿Y si…?».

**Non-Goals:**
- Préstamos con cuota variable, seguros o comisiones; tarjetas de crédito.

## Decisions

- **Interés del pago = saldo de la deuda al momento × interés anual ÷ 12, redondeado a centavos**; el resto del pago es capital. Se guardan `interes` y `capital` en el movimiento para que el historial no cambie si después se corrige la tasa. Alternativa descartada: recalcular el reparto cada vez, que cambiaría meses pasados.
- **Un pago de deuda es un solo movimiento** con `tipo: pago`, `deudaId`, `monto`, `interes` y `capital`. Para el desglose, solo `interes` cuenta como gasto (categoría Intereses).
- **Deudas en USD** se convierten con el tipo de cambio igual que las cuentas.
- **Proyección:** cada préstamo se amortiza mes a mes con la misma función; al llegar a cero, su cuota sale del ritmo desde el mes siguiente.

## Risks / Trade-offs

- [El banco calcula el interés por días, no por mes] → Diferencias de centavos; «Cuadrar» la deuda (un ajuste del saldo) las corrige.
- [Cuota menor que el interés del mes] → El sistema avisa que la deuda crece y no proyecta fecha de fin.
