## ADDED Requirements

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
