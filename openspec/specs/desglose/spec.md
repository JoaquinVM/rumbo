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
