## ADDED Requirements

### Requirement: CTA-07 Fecha de apertura
El sistema SHALL guardar la fecha en que se crea una cuenta o una deuda. Un movimiento con fecha anterior MUST NOT cambiar su saldo, porque el saldo de apertura ya lo incluye, y SHALL contar en el Desglose de su mes. Al anotarlo, el sistema SHALL avisarlo.

#### Scenario: Gasto de ayer
- **WHEN** la persona creó Efectivo hoy con 650 y anota un gasto de 35 con fecha de ayer
- **THEN** Efectivo sigue en 650 y el gasto aparece en el Desglose

### Requirement: CTA-08 Archivar en cero
El sistema SHALL archivar una cuenta solo si su saldo es cero, y SHALL decir que se cuadre o se transfiera antes.

#### Scenario: Cuenta con saldo
- **WHEN** la persona intenta archivar Banco con 120
- **THEN** el sistema no la archiva y le pide dejarla en 0
