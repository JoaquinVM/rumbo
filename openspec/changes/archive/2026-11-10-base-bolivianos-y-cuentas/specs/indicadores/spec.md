# Spec Delta

## MODIFIED Requirements

### Requirement: IND-02 Colchón
El sistema SHALL mostrar el colchón como la suma del saldo de las cuentas (en Bs) ÷ gasto mensual del ritmo, en meses. Lo que le deben MUST NOT contar.

#### Scenario: Colchón en meses
- **WHEN** las cuentas suman Bs 19.200 y el gasto mensual es 7440
- **THEN** el colchón es 2,6 meses
