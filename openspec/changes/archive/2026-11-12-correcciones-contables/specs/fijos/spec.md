## ADDED Requirements

### Requirement: FIJ-06 Cuota pagada a mano
El sistema SHALL tomar un pago a mano de un préstamo con fijo de cuota como la cuota pendiente más antigua de ese fijo o, si no hay, como la del mes del pago, siempre que esa cuota no esté confirmada ni saltada.

#### Scenario: Pagar en el banco
- **WHEN** la cuota del 5 está por confirmar y la persona registra el pago desde el detalle del préstamo
- **THEN** la cuota deja de estar por confirmar y Hoy no la vuelve a restar

### Requirement: FIJ-07 Primera cuota de un préstamo nuevo
El sistema SHALL empezar a preguntar la cuota de un préstamo nuevo el mes siguiente cuando su día ya pasó en el mes en que se crea, porque el saldo de hoy ya la incluye.

#### Scenario: Préstamo creado el 12 con cuota el 5
- **WHEN** el 12 de noviembre la persona crea un préstamo con cuota el día 5
- **THEN** la primera cuota por confirmar es la del 5 de diciembre
