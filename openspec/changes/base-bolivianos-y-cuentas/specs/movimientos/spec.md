# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
