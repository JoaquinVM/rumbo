# Design

## Context

Un gasto es un movimiento `tipo: 'gasto'` con cuenta y categoría; el saldo de la cuenta lo resta. El préstamo dado ya
existe (`tipo: 'prestamo'`, con `deudaId`): resta de la cuenta y suma al «te deben». Saldos, Desglose
(`gastoMesCat`), topes (`avanceTopes`), ritmo y proyección cuentan por tipo de movimiento, así que un préstamo dado nunca
es gasto. Una deuda guarda su apertura (`desde`) y `saldoDeuda` ignora lo anterior a ella (CTA-07). Escribir son varios
`put` independientes, como al crear una deuda con su movimiento o al pagar una cuota con su ocurrencia.

## Goals / Non-Goals

**Goals:**
- Separar todo o una parte de un gasto hacia un «te deben» con los tipos de movimiento que ya existen, sin tocar
  ningún cálculo.
- Poder deshacerlo sin dejar la cuenta descuadrada.

**Non-Goals:**
- El caso contrario («otro pagó por mí»): no se pidió.
- Repartir un gasto entre varias personas en un solo paso: se repite la acción por cada persona.
- Cambiar el fijo: si la renta se comparte cada mes, el fijo sigue con su monto; solo cambia el movimiento del mes.

## Decisions

1. **Partir en dos movimientos, no marcar el gasto.** Una parte = gasto con monto menor + préstamo dado nuevo, misma
   cuenta y fecha. La cuenta resta lo mismo (150 + 150 = 300) y todos los cálculos siguen igual. Alternativa
   descartada: un campo «te deben X» dentro del gasto, que obligaba a cambiar saldos, Desglose, topes y ritmo.
2. **Todo = el mismo documento cambia de tipo.** Mismo `id`, `tipo: 'prestamo'`, `deudaId` nuevo; conserva cuenta,
   fecha, nota, `tc`, `fijoId` y `mes`. Así la ocurrencia del fijo sigue apuntando a su movimiento y el mes no vuelve a
   «por confirmar». Alternativa descartada: borrar el gasto y crear otro, que rompe esa ocurrencia (`borrarMov` la borra).
3. **Campo nuevo opcional `deGastoId` y `categoriaId` en el préstamo.** `deGastoId` es el id del gasto del que salió
   (en «todo», su propio id); `categoriaId` guarda la categoría para poder volver a gasto. Ningún cálculo lee
   `categoriaId` sin mirar el tipo (lo comprobé: `gastoMesCat`, `ritmo`, `catsPorUso` filtran por tipo; `notasSugeridas`
   solo sugiere notas). Es un campo agregado: no se renombra ni borra nada y no hace falta migración (DAT-05).
4. **Mismo tipo de cambio.** El préstamo copia el `tc` del gasto; `put` solo pone el de hoy si falta. Así el Desglose
   del mes baja exactamente lo que valía la parte en Bs ese día.
5. **Qué deudas se ofrecen.** «Te deben» no archivados, de la moneda de la cuenta del gasto (DEU-06) y con `desde`
   igual o anterior a la fecha del gasto (o sin `desde`). Una deuda abierta después ya incluía lo anterior en su saldo
   inicial y `saldoDeuda` ignoraría el préstamo. La persona nueva se crea con `saldoInicial: 0` y `desde` = fecha del
   gasto, para que el préstamo cuente.
6. **Devolver al gasto.** En el detalle del préstamo (`verMovimiento`), si tiene `deGastoId`, el botón «Borrar» se
   cambia por «Devolver al gasto» con dos toques: si el gasto original existe y sigue siendo gasto, se le suma el monto
   y se borra el préstamo; si no (fue el entero, o el original se volvió préstamo o se borró), el préstamo vuelve a ser
   gasto con su `categoriaId`, sin `deudaId` ni `deGastoId`. En los dos casos la cuenta no cambia. Para borrar del todo,
   se borra después el gasto, como cualquier otro.
7. **Dónde va en pantalla.** En «Editar movimiento», solo si el movimiento ya existe y es gasto, un botón secundario
   «Me deben una parte» (texto subrayado, DISENO.md). Abre una hoja con el monto en el bloque azul (todo por defecto),
   las pastillas de «te deben» elegibles más «Otra persona» (con su campo de nombre) y una línea que explica el
   resultado: «Tu gasto queda en Bs 150 y Amigo te debe Bs 150 más. Tu cuenta no cambia.»

## Risks / Trade-offs

- [Dos escrituras sin transacción: si se corta entre las dos, la cuenta queda descuadrada por la parte] → se escribe
  primero el gasto reducido y después el préstamo, igual que hoy al crear una deuda con su movimiento; si falla la
  segunda, la cuenta queda arriba por la parte (nunca se cuenta dos veces) y «Cuadrar» lo corrige. Es el mismo riesgo
  que ya tienen esos flujos.
- [Un fijo compartido cada mes sigue proyectándose entero] → aceptado como non-goal; el Desglose del mes sí baja.
- [Devolver un préstamo que ya tuvo cobros puede dejar «te deben» negativo] → igual que borrar hoy un préstamo dado
  ya cobrado; no se cambia.

## Migration Plan

No hay migración: los datos existentes no tienen `deGastoId` y se comportan como hoy. Publicar es reemplazar
`index.html` en el artifact; volver atrás es publicar la versión anterior, y los préstamos con `deGastoId` siguen
contando bien (la versión vieja solo no muestra «Devolver al gasto»).
