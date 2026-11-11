# formato Specification

## Purpose

Define cómo Rumbo muestra los montos y cómo lee los montos que la persona escribe, para que nunca se pierda dinero al anotar.

## Requirements

### Requirement: FMT-01 Moneda y formato de montos
El sistema SHALL mostrar todos los montos en una sola moneda elegida en Ajustes (MXN por defecto; también USD, EUR, COP, ARS, CLP, PEN y GTQ), con formato es-MX y sin decimales.

#### Scenario: Mostrar un monto
- **WHEN** la moneda es MXN y un gasto es de 1500
- **THEN** el sistema muestra «$1,500»

### Requirement: FMT-03 Lectura de montos escritos
El sistema SHALL leer un monto tal como se escribe: punto o coma de miles y punto o coma decimal.

#### Scenario: Separador de miles
- **WHEN** la persona escribe «1.500» o «1,500»
- **THEN** el sistema guarda 1500

#### Scenario: Decimales con coma
- **WHEN** la persona escribe «12,50» o «1.500,50»
- **THEN** el sistema guarda 12.5 y 1500.5
