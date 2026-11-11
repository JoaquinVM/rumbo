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
