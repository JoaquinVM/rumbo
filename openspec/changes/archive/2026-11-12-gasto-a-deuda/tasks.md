# Tasks

## 1. Separar un gasto hacia «te deben» (DEU-11)

- [x] 1.1 Función de dominio que, dado un gasto, un monto y una deuda (o un nombre nuevo), devuelve los documentos a
      escribir: gasto reducido + préstamo dado con `deGastoId`, `categoriaId`, cuenta, fecha, nota y `tc` del gasto; o,
      con todo, el mismo documento como préstamo dado (conserva `fijoId` y `mes`); y la deuda nueva con `saldoInicial: 0`
      y `desde` = fecha del gasto. Rechaza 0 y más que el gasto. Verificar: pruebas `DEU-11` en `pruebas/verificar.mjs`
      con los escenarios de la spec (mitad de la cena, todo, fijo con su ocurrencia, persona nueva, 350 de 300, dólares a
      12,5 con tipo de hoy 14) comprobando gasto, préstamo, saldo de Amigo, Efectivo sin cambio, patrimonio y
      `gastoMesCat`.
- [x] 1.2 Función que lista los «te deben» elegibles para un gasto (no archivados, moneda de la cuenta, `desde` ≤ fecha
      del gasto o sin `desde`). Verificar: prueba `DEU-11` de la deuda abierta después del gasto y la de dólares.
- [x] 1.3 Botón «Me deben una parte» en «Editar movimiento» (solo gastos ya guardados) y hoja con monto, pastillas de
      deudas y «Otra persona», y la línea que explica el resultado; escribe primero el gasto y después el préstamo.
      Verificar: `npm run verificar` dibuja la hoja sin errores y el ensayo en navegador separa 150 de un gasto del
      ejemplo.

## 2. Devolver al gasto (DEU-12)

- [x] 2.1 Función de dominio que devuelve un préstamo con `deGastoId` a su gasto (suma al original si sigue siendo
      gasto; si no, vuelve a gasto con su categoría, sin `deudaId` ni `deGastoId`). Verificar: pruebas `DEU-12` (devolver
      la mitad y devolver un entero) comprobando gasto, Amigo y Efectivo.
- [x] 2.2 En el detalle del préstamo dado: «Salió del gasto …» y «Devolver al gasto» con dos toques en lugar de
      «Borrar». Verificar: `npm run verificar` dibuja el detalle y el ensayo en navegador devuelve los 150.

## 3. Documentos y cierre

- [x] 3.1 `docs/DOMINIO.md` (campo `deGastoId` y el préstamo que sale de un gasto) y `docs/DECISIONES.md` (decisiones
      1 a 6 del design). Verificar: los dos archivos lo dicen.
- [x] 3.2 `openspec validate --all --strict` y `npm run verificar` pasan; los datos de ejemplo dan los mismos saldos que
      antes. Verificar: salida de los dos comandos.
- [x] 3.3 Archivar el cambio en el mismo PR (`openspec archive gasto-a-deuda`). Publicar el artifact a la misma URL
      queda para la sesión de publicar, con el sí de Joaquín. Verificar: `openspec list` sin cambios activos.
