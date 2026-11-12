# indicadores Specification

## Purpose

Resume la salud del ritmo en pocas cifras que se entienden de un vistazo.

## Requirements

### Requirement: IND-01 Tasa de ahorro
El sistema SHALL mostrar la tasa de ahorro como (neto del ritmo + capital de las cuotas del mes) ÷ ingresos del ritmo, en porcentaje: el capital que baja una deuda es ahorro.

#### Scenario: Ahorro del 20 %
- **WHEN** entran 10000 al mes y el neto es 2000
- **THEN** la tasa de ahorro es 20 %

#### Scenario: Con cuota de préstamo
- **WHEN** entran 8000, la cuota de 2000 es el único gasto y su interés es 200
- **THEN** la tasa de ahorro es 97,5 %

### Requirement: IND-02 Colchón
El sistema SHALL mostrar el colchón como la suma del saldo de las cuentas (en Bs) ÷ gasto mensual del ritmo, en meses. Lo que le deben MUST NOT contar.

#### Scenario: Colchón en meses
- **WHEN** las cuentas suman Bs 19.200 y el gasto mensual es 7440
- **THEN** el colchón es 2,6 meses

### Requirement: IND-03 Neto al mes
El sistema SHALL mostrar el neto del ritmo con lo que entra y lo que sale.

#### Scenario: Neto positivo
- **WHEN** entran 9500 y salen 7440
- **THEN** muestra +2060, «entra 9.500 · sale 7.440»

### Requirement: IND-04 Deuda total
El sistema SHALL mostrar la deuda total (préstamos y deudas con personas, en Bs) y el mes en que la persona queda libre de préstamos a este ritmo.

#### Scenario: Dos deudas
- **WHEN** debe 18400 al banco (termina en octubre de 2028) y 1500 a su hermano
- **THEN** el indicador dice Bs 19.900 y «sin préstamos en oct 2028»
