## ADDED Requirements

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
