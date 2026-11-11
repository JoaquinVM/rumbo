# Spec Delta

## MODIFIED Requirements

### Requirement: PAN-01 Navegación
El sistema SHALL tener cuatro pestañas (Rumbo, Movimientos, Desglose y Plan), el botón + en todas y Ajustes desde el ícono de arriba.

#### Scenario: Cambiar de pestaña
- **WHEN** la persona toca la pestaña Plan
- **THEN** ve su patrimonio, sus cuentas y sus fijos

## ADDED Requirements

### Requirement: PAN-03 Pantalla Plan
El sistema SHALL mostrar en Plan, en este orden: el patrimonio con su desglose (cuentas, te deben, deudas), las cuentas con su saldo y el botón cuadrar, y los fijos.

#### Scenario: Abrir Plan
- **WHEN** la persona abre Plan
- **THEN** lo primero es el patrimonio y debajo cada cuenta con su saldo y «Cuadrar»
