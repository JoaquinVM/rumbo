# Spec Delta

## ADDED Requirements

### Requirement: PAN-07 Deudas en Plan y detalle del préstamo
El sistema SHALL mostrar en Plan, después de los fijos, la sección Deudas con cada deuda, su tipo y su saldo, y SHALL abrir el detalle de un préstamo al tocarlo, con su saldo en un bloque ladrillo, cuándo termina, el interés por pagar, las próximas cuotas, la palanca de adelantar y el botón «Registrar un pago».

#### Scenario: Abrir el préstamo
- **WHEN** la persona toca el préstamo del banco en Plan
- **THEN** ve Bs 18.400 por pagar, «Terminas oct 2028» y las 3 próximas cuotas
