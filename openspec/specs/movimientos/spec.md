# movimientos Specification

## Purpose

Permite anotar lo variable (gastos e ingresos que no son fijos) y revisarlo por mes, que es la materia prima del ritmo y del desglose.

## Requirements

### Requirement: MOV-01 Anotar un movimiento
El sistema SHALL permitir anotar un gasto, un ingreso o una transferencia desde el botón + de cualquier pantalla, con monto, cuenta, categoría (no en transferencias), nota opcional y fecha (hoy por defecto).

#### Scenario: Anotar un gasto
- **WHEN** la persona anota un gasto de 35 desde Efectivo en Comida fuera con la nota «Almuerzo»
- **THEN** el movimiento aparece hoy en Movimientos y el saldo de Efectivo baja 35

### Requirement: MOV-04 Ver, editar y borrar movimientos
El sistema SHALL mostrar los movimientos por mes de calendario, agrupados por día con su total y con filtro por cuenta, y SHALL permitir editarlos y borrarlos con un segundo toque de confirmación.

#### Scenario: Filtrar por cuenta
- **WHEN** la persona filtra noviembre por Efectivo
- **THEN** ve solo los movimientos que entran o salen de Efectivo

#### Scenario: Borrar con dos toques
- **WHEN** la persona toca «Borrar» en un movimiento de 320
- **THEN** el sistema pide un segundo toque y solo entonces lo borra

### Requirement: MOV-02 Anotar rápido
El sistema SHALL recordar la última cuenta usada, ordenar primero las categorías más usadas en los últimos 90 días y sugerir notas ya escritas en esa categoría.

#### Scenario: Segundo almuerzo
- **WHEN** el último gasto fue desde Efectivo y Comida fuera es la categoría más usada
- **THEN** el formulario abre con Efectivo elegido, Comida fuera primera y «Almuerzo» entre las notas sugeridas

### Requirement: MOV-03 Transferencia entre cuentas
El sistema SHALL registrar una transferencia que saca dinero de una cuenta y lo pone en otra distinta. Si las monedas son distintas, SHALL pedir los dos montos. Una transferencia MUST NOT contar como gasto ni ingreso.

#### Scenario: Compra de dólares
- **WHEN** la persona transfiere Bs 1.250 de Banco a Dólares y recibe US$ 100
- **THEN** Banco baja 1250, Dólares sube 100 y el gastado del mes no cambia

#### Scenario: Misma cuenta
- **WHEN** la persona elige la misma cuenta de origen y destino
- **THEN** el sistema no deja guardar y explica que deben ser distintas

### Requirement: MOV-05 Aviso de tope al anotar
El sistema SHALL decir, al anotar o guardar un gasto de una categoría con tope, cuánto llevará del tope cuando ese gasto la deja en 80 % o más.

#### Scenario: Almuerzo cerca del tope
- **WHEN** Comida fuera lleva 850 de 1000 y la persona escribe un gasto de 35
- **THEN** el formulario dice «Comida fuera: después de esto llevas 89 % de tu tope»

### Requirement: MOV-06 Tipo de cambio de cada movimiento en dólares
El sistema SHALL guardar en cada movimiento de una cuenta en dólares el tipo de cambio del día en que se anota, y SHALL usarlo para pasarlo a Bs en el Desglose, el ritmo y los topes.

#### Scenario: Cambia el tipo de cambio
- **WHEN** en octubre se gastaron US$ 20 con tipo de cambio 12,5 y hoy la persona pone 14
- **THEN** el Desglose de octubre sigue mostrando Bs 250
