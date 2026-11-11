# hoy Specification

## Purpose

Dice cuánto le queda a la persona para lo variable y cuánto puede gastar por día, para que las decisiones de hoy no rompan el rumbo.

## Requirements

### Requirement: HOY-02 Libre del mes
El sistema SHALL calcular el libre del mes de calendario como ingresos del mes (fijos + variables del mes) − fijos de gasto − ahorro mensual apartado en Ajustes − gastos variables del mes.

#### Scenario: Libre calculado
- **WHEN** entran 8000 de fijos, salen 3000 de fijos, el ahorro apartado es 1000 y van 2000 de gastos variables
- **THEN** el libre del mes es 2000

### Requirement: HOY-03 Monto al día
El sistema SHALL dividir el libre entre los días que quedan del mes, contando hoy.

#### Scenario: Monto al día
- **WHEN** el libre es 2000 y hoy es 21 de un mes de 30 días
- **THEN** el sistema muestra 200 al día por 10 días

### Requirement: HOY-05 Libre negativo
El sistema SHALL decir que ya se gastó más de lo disponible, en lugar de un monto por día, cuando el libre es negativo.

#### Scenario: Pasarse
- **WHEN** el libre es −300
- **THEN** el sistema muestra −300 y «ya gastaste más de lo disponible»
