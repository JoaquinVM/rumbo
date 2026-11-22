## ADDED Requirements

### Requirement: DES-06 De dónde entró
El sistema SHALL mostrar en el Desglose del mes, debajo de los gastos, una sección «De dónde entró» con una fila por cada categoría de ingreso que tuvo ingresos ese mes, de la que más entró a la que menos, con su total en Bs y cuánto es de cada 100 que entraron. Cada ingreso SHALL pasar a Bs con el tipo de cambio de su movimiento (MOV-06), y la suma de las filas SHALL ser igual a «Entró» (DES-01). Al tocar una fila, SHALL abrir Movimientos del mismo mes con esa categoría elegida (MOV-07) y sin filtro de cuenta. Si en el mes no entró nada, la sección MUST NOT aparecer.

#### Scenario: Sueldo y un extra
- **WHEN** en octubre entraron 9000 de Sueldo y 800 de Extras
- **THEN** «De dónde entró» muestra Sueldo Bs 9.000 con 92 de cada 100 y Extras Bs 800 con 8 de cada 100, y suman los 9.800 de «Entró»

#### Scenario: Un ingreso en dólares
- **WHEN** entran Bs 1.000 de Sueldo y US$ 100 de Extras con tipo de cambio 12,5
- **THEN** Extras muestra Bs 1.250 y «Entró» es Bs 2.250

#### Scenario: De una fila a sus movimientos
- **WHEN** la persona toca Sueldo en «De dónde entró» de octubre
- **THEN** ve Movimientos de octubre solo con Sueldo, en todas las cuentas, y arriba su total, el mismo de la fila

#### Scenario: Mes sin ingresos
- **WHEN** en noviembre todavía no entró nada
- **THEN** el Desglose de noviembre no muestra «De dónde entró»
