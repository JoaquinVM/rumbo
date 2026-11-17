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

### Requirement: MOV-07 Movimientos de una categoría
El sistema SHALL permitir elegir una categoría en Movimientos con una pastilla «Categoría», debajo de las de cuentas, que abre la lista de categorías de gasto y de ingreso: las activas y las archivadas que tengan movimientos en ese mes. Con una categoría elegida, SHALL mostrar solo los movimientos del mes que cuentan para ella y, arriba, su total y cuántos son; el total de cada día SHALL sumar de la misma forma. En una categoría de gasto cuentan sus gastos, también los de fijos confirmados; en Intereses cuentan además los pagos de cuota, solo por su interés, y los intereses sin pagar; en una de ingreso cuentan sus ingresos. Un préstamo dado que salió de un gasto MUST NOT aparecer ni sumar, aunque conserve la categoría del gasto. Cada monto SHALL pasar a Bs con el tipo de cambio de su movimiento (MOV-06). Sin filtro de cuenta, el total SHALL ser igual al de esa categoría en el Desglose del mes; con filtro de cuenta, SHALL sumar solo los movimientos que se ven. La categoría elegida SHALL verse en una pastilla azul con su nombre, mantenerse al cambiar de mes y quitarse con la ✕ de esa pastilla.

#### Scenario: Comida fuera en noviembre
- **WHEN** el Desglose de noviembre muestra Comida fuera en Bs 1.150 y la persona elige Comida fuera en Movimientos
- **THEN** ve solo los gastos de Comida fuera de noviembre y arriba su total, Bs 1.150

#### Scenario: La cuota en Intereses
- **WHEN** este mes se pagó la cuota de 900 del préstamo y su interés fue 214,67
- **THEN** Intereses muestra ese pago de 900 con su interés y suma Bs 214,67, igual que el Desglose

#### Scenario: La mitad de la cena
- **WHEN** de un gasto de 300 en Comida fuera la persona dijo que Amigo le debe 150
- **THEN** Comida fuera muestra ese gasto por 150 y el préstamo dado de 150 no aparece

#### Scenario: Con una cuenta
- **WHEN** con Comida fuera elegida la persona filtra además por Efectivo
- **THEN** ve solo los gastos de Comida fuera desde Efectivo y el total suma solo esos

#### Scenario: Otro mes
- **WHEN** con Comida fuera elegida la persona pasa de noviembre a octubre
- **THEN** ve los gastos de Comida fuera de octubre

#### Scenario: Quitar la categoría
- **WHEN** la persona toca la ✕ de la pastilla Comida fuera
- **THEN** vuelve a ver todos los movimientos del mes
