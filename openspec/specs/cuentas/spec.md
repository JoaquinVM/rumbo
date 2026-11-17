# cuentas Specification

## Purpose
Dice dónde está el dinero de la persona, cuánto hay en cada lugar y cuánto vale todo junto en bolivianos, a partir de hechos y no de números escritos a mano.

## Requirements

### Requirement: CTA-01 Crear y archivar cuentas
El sistema SHALL permitir crear cuentas con nombre, moneda (Bs o USD), saldo de hoy, rendimiento anual (0 si no rinde) y si es para el día a día (por defecto sí en Bs y no en USD). SHALL permitir editarlas y archivarlas; una cuenta archivada MUST NOT perder sus movimientos.

#### Scenario: Crear Banco
- **WHEN** la persona crea «Banco», Bs, saldo 3550, rendimiento 2 %
- **THEN** aparece en Plan con Bs 3.550,00 y marcada «Día a día»

#### Scenario: Archivar con movimientos
- **WHEN** la persona archiva una cuenta con 20 movimientos
- **THEN** la cuenta deja de ofrecerse al anotar y sus 20 movimientos siguen en Movimientos

### Requirement: CTA-02 Saldo calculado
El sistema SHALL calcular el saldo de una cuenta como su saldo inicial más sus movimientos: suman ingresos y transferencias que entran; restan gastos y transferencias que salen; los ajustes suman o restan según su sentido.

#### Scenario: Saldo del Banco
- **WHEN** Banco empezó con 3550, recibió 1200 de ingreso, pagó 320 de gasto y transfirió 1250 a Dólares
- **THEN** su saldo es 3180

### Requirement: CTA-03 Cuadrar una cuenta
El sistema SHALL permitir escribir el saldo real de una cuenta y registrar la diferencia como un movimiento de tipo ajuste visible en Movimientos. Un ajuste MUST NOT contar como gasto ni ingreso.

#### Scenario: Faltan 45 en efectivo
- **WHEN** Efectivo calcula 695 y la persona cuenta 650
- **THEN** se registra un ajuste de −45, el saldo queda en 650 y el gastado del mes no cambia

### Requirement: CTA-04 Tipo de cambio
El sistema SHALL guardar un único tipo de cambio (Bs por US$) con su fecha, puesto por la persona, y SHALL avisar en Rumbo cuando tiene más de 7 días.

#### Scenario: Tipo de cambio viejo
- **WHEN** el tipo de cambio se puso hace 9 días
- **THEN** Rumbo muestra «Tu tipo de cambio es de hace 9 días» con un botón para actualizarlo

### Requirement: CTA-05 Patrimonio
El sistema SHALL calcular el patrimonio como la suma de las cuentas (las de USD por el tipo de cambio) más lo que le deben menos lo que debe, y SHALL mostrarlo en Bs y su equivalente en US$.

#### Scenario: Patrimonio con dólares
- **WHEN** Efectivo tiene 650, Banco 3550 y Dólares US$ 1.200, con tipo 12,50 y sin deudas
- **THEN** el patrimonio es Bs 19.200, unos US$ 1.536

### Requirement: CTA-06 Tipo de cambio desde un cambio real
El sistema SHALL ofrecer, al guardar una transferencia entre monedas distintas, usar el tipo de esa operación como tipo de cambio, y SHALL mostrar en Ajustes el último cambio real junto al tipo en uso.

#### Scenario: Compra de dólares
- **WHEN** la persona transfiere Bs 1.250 de Banco y recibe US$ 100 en Dólares
- **THEN** el sistema dice «Este cambio fue a Bs 12,50 por dólar» y ofrece usarlo como tipo de cambio

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
