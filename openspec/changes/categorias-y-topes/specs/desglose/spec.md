# Spec Delta

## MODIFIED Requirements

### Requirement: DES-02 A dónde va cada 100
El sistema SHALL mostrar por categoría cuánto va de cada 100 que entran, cuántas horas de trabajo cuesta (si hay horas en Ajustes), cuánto suma en 10 años a su ritmo promedio y, si tiene tope, su avance con el color de LIM-04.

#### Scenario: Casa
- **WHEN** entran 9800, Casa suma 2880 y la persona trabaja 160 horas
- **THEN** Casa muestra 29 de cada 100 y 47 horas

#### Scenario: Categoría con tope
- **WHEN** Súper suma 1300 con un tope de 1400
- **THEN** Súper se muestra en ámbar con «93 % de tu tope de Bs 1.400»
