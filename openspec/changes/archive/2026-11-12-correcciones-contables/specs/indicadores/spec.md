## MODIFIED Requirements

### Requirement: IND-01 Tasa de ahorro
El sistema SHALL mostrar la tasa de ahorro como (neto del ritmo + capital de las cuotas del mes) ÷ ingresos del ritmo, en porcentaje: el capital que baja una deuda es ahorro.

#### Scenario: Ahorro del 20 %
- **WHEN** entran 10000 al mes y el neto es 2000
- **THEN** la tasa de ahorro es 20 %

#### Scenario: Con cuota de préstamo
- **WHEN** entran 8000, la cuota de 2000 es el único gasto y su interés es 200
- **THEN** la tasa de ahorro es 97,5 %
