# formato Specification

## Purpose

Define cómo Rumbo muestra los montos y cómo lee los montos que la persona escribe, para que nunca se pierda dinero al anotar.

## Requirements

### Requirement: FMT-01 Moneda y formato de montos
El sistema SHALL usar el boliviano como moneda base y SHALL mostrar los montos como «Bs 1.234,50», con punto de miles y coma decimal. No hay elección de moneda.

#### Scenario: Mostrar un monto
- **WHEN** un gasto es de 1500
- **THEN** el sistema muestra «Bs 1.500»

### Requirement: FMT-03 Lectura de montos escritos
El sistema SHALL leer un monto tal como se escribe: punto o coma de miles y punto o coma decimal.

#### Scenario: Separador de miles
- **WHEN** la persona escribe «1.500» o «1,500»
- **THEN** el sistema guarda 1500

#### Scenario: Decimales con coma
- **WHEN** la persona escribe «12,50» o «1.500,50»
- **THEN** el sistema guarda 12.5 y 1500.5

### Requirement: FMT-02 Decimales según dónde se muestra
El sistema SHALL mostrar los movimientos con 2 decimales y los resúmenes, la gráfica y los indicadores sin decimales.

#### Scenario: Movimiento y resumen
- **WHEN** un gasto es de 35 y el gastado del mes es 3073,40
- **THEN** el movimiento dice «−Bs 35,00» y el resumen «Bs 3.073»

### Requirement: FMT-04 Montos en dólares
El sistema SHALL mostrar los montos de cuentas en dólares como «US$ 1.234,50».

#### Scenario: Cuenta en dólares
- **WHEN** la cuenta Dólares tiene 1200
- **THEN** su saldo dice «US$ 1.200»
