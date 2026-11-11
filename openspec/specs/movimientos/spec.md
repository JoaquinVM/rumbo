# movimientos Specification

## Purpose

Permite anotar lo variable (gastos e ingresos que no son fijos) y revisarlo por mes, que es la materia prima del ritmo y del desglose.

## Requirements

### Requirement: MOV-01 Anotar un movimiento
El sistema SHALL permitir anotar un gasto o un ingreso con monto, categoría, nota opcional y fecha (hoy por defecto) desde el botón + de cualquier pantalla.

#### Scenario: Anotar un gasto
- **WHEN** la persona anota un gasto de 35 en Comida fuera con la nota «Almuerzo»
- **THEN** el movimiento aparece en Movimientos el día de hoy y cuenta en el ritmo y el desglose

### Requirement: MOV-04 Ver, editar y borrar movimientos
El sistema SHALL mostrar los movimientos por mes de calendario, agrupados por día con su total, y SHALL permitir editarlos y borrarlos con un segundo toque de confirmación.

#### Scenario: Borrar con dos toques
- **WHEN** la persona toca «Borrar» en un movimiento de 320
- **THEN** el sistema pide un segundo toque y solo entonces lo borra
