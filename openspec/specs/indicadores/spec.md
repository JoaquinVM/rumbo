# indicadores Specification

## Purpose

Resume la salud del ritmo en pocas cifras que se entienden de un vistazo.

## Requirements

### Requirement: IND-01 Tasa de ahorro
El sistema SHALL mostrar la tasa de ahorro como neto del ritmo ÷ ingresos del ritmo, en porcentaje.

#### Scenario: Ahorro del 20 %
- **WHEN** entran 10000 al mes y el neto es 2000
- **THEN** la tasa de ahorro es 20 %

### Requirement: IND-02 Colchón
El sistema SHALL mostrar el colchón como «lo que tienes hoy» ÷ gasto mensual del ritmo, en meses.

#### Scenario: Colchón en meses
- **WHEN** tiene 21000 y gasta 7000 al mes
- **THEN** el colchón es 3 meses

### Requirement: IND-03 Neto al mes
El sistema SHALL mostrar el neto del ritmo con lo que entra y lo que sale.

#### Scenario: Neto positivo
- **WHEN** entran 9500 y salen 7440
- **THEN** muestra +2060, «entra 9.500 · sale 7.440»
