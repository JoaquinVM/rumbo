# deudas Specification

## Purpose
Registra lo que la persona debe y lo que le deben, cómo baja cada deuda con sus pagos y cuánto interés le cuesta, para que el patrimonio y la proyección digan la verdad.

## Requirements

### Requirement: DEU-01 Tipos de deuda
El sistema SHALL permitir registrar tres tipos de deuda, en Bs o US$: préstamo (saldo, interés anual, cuota mensual y día de pago), deuda con una persona (saldo sin interés y fecha esperada opcional) y dinero que te deben (saldo y fecha esperada opcional).

#### Scenario: Préstamo del banco
- **WHEN** la persona registra un préstamo de Bs 18.400 al 14 % anual con cuota de Bs 900 el día 20
- **THEN** aparece en Plan con «14 % · cuota Bs 900» y su saldo resta del patrimonio

### Requirement: DEU-02 Interés y capital de cada pago
El sistema SHALL dividir cada pago de un préstamo en interés (saldo × interés anual ÷ 12, redondeado a centavos) y capital (el resto). El interés SHALL contar como gasto en la categoría Intereses; el capital MUST NOT contar como gasto. Si el pago es menor que el interés, el capital SHALL ser negativo y la deuda SHALL subir lo que faltó.

#### Scenario: Cuota de noviembre
- **WHEN** el préstamo tiene saldo 18400 al 14 % y se paga la cuota de 900
- **THEN** el interés es 214,67 (gasto en Intereses), el capital 685,33 y el saldo queda en 17714,67

#### Scenario: Pago menor que el interés
- **WHEN** el préstamo tiene saldo 10000 al 24 % y se pagan 150
- **THEN** el interés es 200 (gasto en Intereses), el capital −50 y el saldo queda en 10050

### Requirement: DEU-03 Pagar, cobrar y prestar
El sistema SHALL registrar como movimientos de una cuenta el pago de una deuda (baja su saldo), el cobro de lo que te deben (baja lo pendiente) y el préstamo dado (crea o sube un «te deben»). Una deuda con una persona y un cobro MUST NOT tener interés.

#### Scenario: El amigo paga
- **WHEN** el amigo que debía 400 paga 400 en efectivo
- **THEN** Efectivo sube 400, «te deben» queda en 0 y el patrimonio no cambia

### Requirement: DEU-04 Estado de cada deuda
El sistema SHALL mostrar el saldo de cada deuda y, en un préstamo, cuándo termina y cuánto interés pagará en total a la cuota actual. Si la cuota no cubre el interés del mes, SHALL avisar que la deuda crece.

#### Scenario: Fin del préstamo
- **WHEN** el préstamo tiene saldo 18400 al 14 % con cuota 900 desde noviembre de 2026
- **THEN** dice que termina en octubre de 2028, en 24 cuotas, con Bs 2.744 de interés

### Requirement: DEU-05 Próximas cuotas
El sistema SHALL mostrar en el detalle de un préstamo las próximas 3 cuotas con su interés, su capital y el saldo que queda.

#### Scenario: Tres cuotas
- **WHEN** se abre el préstamo de 18400 al 14 % con cuota 900
- **THEN** muestra noviembre 214,67 / 685,33 / 17714,67, diciembre 206,67 / 693,33 / 17021,34 y enero 198,58 / 701,42 / 16319,92

### Requirement: DEU-06 Misma moneda
El sistema SHALL ofrecer, para pagar, cobrar, prestar o recibir dinero de una deuda y para el fijo de su cuota, solo cuentas de la moneda de la deuda. Sin una cuenta de esa moneda, SHALL pedir crearla.

#### Scenario: Deuda en dólares
- **WHEN** la persona paga una deuda de US$ 100 y tiene Efectivo en Bs y Dólares en US$
- **THEN** solo puede elegir Dólares, que baja US$ 100, y el patrimonio no cambia

### Requirement: DEU-07 Dinero que te prestan
El sistema SHALL registrar el dinero que te prestan (al crear un préstamo o una deuda con una persona, o con «Recibir más») como un movimiento que sube la cuenta y sube la deuda. MUST NOT contar como ingreso.

#### Scenario: El banco desembolsa
- **WHEN** la persona crea un préstamo de 5000 que entra a Banco
- **THEN** Banco sube 5000, el préstamo queda en 5000, el patrimonio no cambia y el Desglose no muestra ingreso

### Requirement: DEU-08 Interés de una cuota saltada
El sistema SHALL sumar a la deuda y contar como gasto en Intereses el interés del mes cuando la persona salta la cuota de un préstamo. Borrar ese movimiento SHALL devolver la cuota a «por confirmar».

#### Scenario: Saltar noviembre
- **WHEN** el préstamo tiene saldo 10000 al 24 % y la persona toca «No este mes» en su cuota
- **THEN** el saldo pasa a 10200 y el Desglose de noviembre suma 200 en Intereses

### Requirement: DEU-09 Cerrar una deuda con saldo
El sistema SHALL registrar un movimiento de cierre por el saldo al archivar una deuda que no está en cero, de modo que la deuda queda en cero y el cambio en el patrimonio queda a la vista en el Desglose.

#### Scenario: Perdonar a un amigo
- **WHEN** la persona archiva «te deben» de 400 sin cobrarlo
- **THEN** queda un cierre de 400, el patrimonio baja 400 y el Desglose lo muestra como deuda cerrada

### Requirement: DEU-10 Pago hasta el saldo
El sistema MUST NOT registrar un pago mayor que el saldo más el interés del mes, ni un cobro mayor que lo que te deben.

#### Scenario: Pagar de más
- **WHEN** la deuda con una persona es de 300 y la persona escribe 350
- **THEN** el sistema dice que el máximo es 300 y no guarda

### Requirement: DEU-11 Un gasto que te deben
El sistema SHALL permitir, al editar un gasto ya anotado, decir que otra persona te debe todo o una parte de ese gasto. La persona SHALL elegir cuánto (mayor que 0 y hasta el monto del gasto, todo por defecto) y quién: un «te deben» no archivado de la moneda de la cuenta del gasto y abierto el día del gasto o antes, o una persona nueva. Una persona nueva SHALL crear un «te deben» con ese nombre, la moneda de la cuenta, saldo inicial 0 y apertura el día del gasto.
Con una parte, el gasto SHALL bajar a lo que queda y SHALL nacer un préstamo dado por la parte, con la misma cuenta, fecha, nota y tipo de cambio que el gasto. Con todo, el mismo movimiento SHALL dejar de ser gasto y pasar a ser préstamo dado, conservando su cuenta, fecha, nota, tipo de cambio y su fijo y mes si los tiene. En los dos casos el saldo de la cuenta MUST NOT cambiar, «te deben» y el patrimonio SHALL subir lo separado, y el Desglose, los topes y el ritmo SHALL contar solo lo que queda como gasto. Ingresos y transferencias MUST NOT ofrecerlo.

#### Scenario: La mitad de la cena
- **WHEN** hay un gasto de 300 desde Efectivo en Comida fuera y la persona dice que Amigo, que ya debía 400, le debe 150
- **THEN** el gasto queda en 150, hay un préstamo dado de 150 a Amigo con la misma fecha, Amigo debe 550, Efectivo no cambia, el patrimonio sube 150 y Comida fuera del mes baja 150

#### Scenario: Todo el gasto
- **WHEN** hay un gasto de 300 desde Efectivo y la persona dice que Amigo, que debía 400, le debe todo
- **THEN** ya no hay gasto de 300, el mismo movimiento es un préstamo dado de 300, Amigo debe 700 y Efectivo no cambia

#### Scenario: Gasto de un fijo
- **WHEN** la renta de 2500, confirmada desde su fijo, se vuelve entera un préstamo dado a Compañero
- **THEN** el fijo de la renta de ese mes sigue confirmado y Compañero debe 2500

#### Scenario: Persona nueva
- **WHEN** la persona dice que Prima, que no tenía deuda, le debe 150 de un gasto del 5 de noviembre
- **THEN** se crea «te deben» Prima en Bs con apertura el 5 de noviembre y Prima debe 150

#### Scenario: Más que el gasto
- **WHEN** el gasto es de 300 y la persona escribe 350
- **THEN** el sistema dice que el máximo es Bs 300 y no guarda

#### Scenario: Gasto en dólares
- **WHEN** hay un gasto de US$ 20 desde Dólares con tipo de cambio 12,5, la persona dice que Amigo US$ le debe todo y hoy el tipo de cambio es 14
- **THEN** solo se ofrecen «te deben» en US$, Amigo US$ sube US$ 20 y el Desglose de ese mes baja Bs 250

#### Scenario: Deuda abierta después del gasto
- **WHEN** el gasto es del 5 de noviembre y el «te deben» de Amigo se abrió el 10 de noviembre
- **THEN** Amigo no se ofrece para ese gasto y la persona puede crear uno nuevo

### Requirement: DEU-12 Devolver al gasto
El sistema SHALL mostrar en un préstamo dado que salió de un gasto de qué gasto salió y SHALL permitir devolverlo con «Devolver al gasto» y un segundo toque. Si ese gasto todavía existe como gasto, su monto SHALL volver a sumarse a él y el préstamo SHALL desaparecer; si no, el préstamo SHALL volver a ser un gasto con la categoría que tenía. El saldo de la cuenta MUST NOT cambiar y «te deben» SHALL bajar lo devuelto.

#### Scenario: Devolver la mitad
- **WHEN** el gasto de 300 quedó en 150 con un préstamo dado de 150 a Amigo, que debe 550, y la persona toca «Devolver al gasto» dos veces
- **THEN** el gasto vuelve a 300, el préstamo ya no está, Amigo debe 400 y Efectivo no cambia

#### Scenario: Devolver un gasto entero
- **WHEN** el gasto de 300 se volvió entero un préstamo dado a Amigo y la persona toca «Devolver al gasto» dos veces
- **THEN** el movimiento vuelve a ser un gasto de 300 en Comida fuera y Amigo baja 300
