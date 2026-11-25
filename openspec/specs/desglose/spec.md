# desglose Specification

## Purpose

Muestra a dónde se va el dinero de un mes, en términos que se sienten: de cada 100, en horas de trabajo y en 10 años.

## Requirements

### Requirement: DES-01 Resumen del mes
El sistema SHALL mostrar, por mes de calendario, lo que entró, lo que salió y lo que quedó, contando fijos y variables.

#### Scenario: Octubre
- **WHEN** en octubre entraron 9800 y salieron 7335
- **THEN** muestra entró 9.800, salió 7.335 y quedó 2.465

### Requirement: DES-02 A dónde va cada 100
El sistema SHALL mostrar por categoría cuánto va de cada 100 que entran, cuántas horas de trabajo cuesta (si hay horas en Ajustes), cuánto suma en 10 años a su ritmo promedio y, si tiene tope, su avance con el color de LIM-04.

#### Scenario: Casa
- **WHEN** entran 9800, Casa suma 2880 y la persona trabaja 160 horas
- **THEN** Casa muestra 29 de cada 100 y 47 horas

#### Scenario: Categoría con tope
- **WHEN** Súper suma 1300 con un tope de 1400
- **THEN** Súper se muestra en ámbar con «93 % de tu tope de Bs 1.400»

### Requirement: DES-03 Fuera de tus gastos
El sistema SHALL mostrar en el Desglose del mes lo que cambió el patrimonio sin ser ingreso ni gasto: cuadres, diferencia de cambio al comprar o vender dólares y deudas cerradas, de modo que quedó + esas líneas = cambio del patrimonio por movimientos.

#### Scenario: Compra de dólares y un cuadre
- **WHEN** con tipo de cambio 12,5 la persona compra US$ 50 por Bs 650 y cuadra Efectivo con −200
- **THEN** el Desglose muestra diferencia de cambio −Bs 25 y cuadres −Bs 200

### Requirement: DES-04 Promedio de Intereses
El sistema SHALL usar, en el promedio de la categoría Intereses, el interés de cada cuota y no la cuota entera.

#### Scenario: Cuota de 900
- **WHEN** la cuota es 900 y su interés este mes es 214,67
- **THEN** el promedio de Intereses usa 214,67

### Requirement: DES-05 De una categoría a sus movimientos
El sistema SHALL abrir, al tocar una categoría del Desglose, también una en ámbar o en rojo por su tope, Movimientos del mismo mes con esa categoría elegida (MOV-07) y sin filtro de cuenta, para que el total sea el mismo del Desglose. Cada categoría del Desglose SHALL mostrar que se puede tocar.

#### Scenario: Súper cerca del tope
- **WHEN** Súper suma 1300 en el Desglose de octubre, con un tope de 1400
- **THEN** al tocarla la persona ve Movimientos de octubre solo con Súper y arriba su total, Bs 1.300

#### Scenario: Venía con una cuenta elegida
- **WHEN** en Movimientos estaba elegida la cuenta Efectivo y la persona toca Casa en el Desglose
- **THEN** ve Casa en todas las cuentas y el total es el mismo del Desglose

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
