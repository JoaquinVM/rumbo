# Proposal

## Why

Joaquín a veces paga algo por otra persona (una cena compartida, una compra para alguien) y lo anota como gasto. Hoy
ese gasto queda entero como suyo y no hay forma de decir que otra persona le debe todo o una parte; el Desglose, los
topes y el ritmo cuentan de más, y el «te deben» no sube. Pedido del 12/11/2026 (trabajo 063 de Foundry).

## What Changes

- Al editar un gasto ya anotado aparece «Me deben una parte»: se elige cuánto (todo o una parte) y quién lo debe, un
  «te deben» que ya existe o una persona nueva.
- Una parte: el gasto baja a lo que queda y nace un préstamo dado por la parte, con la misma cuenta, fecha y tipo de
  cambio. La cuenta no cambia; «te deben» y el patrimonio suben.
- Todo: el mismo movimiento deja de ser gasto y pasa a ser préstamo dado.
- El préstamo que salió de un gasto dice de cuál salió y se puede devolver al gasto («Devolver al gasto»).
- Toca dinero y datos guardados: cambia el gasto del mes y lo que te deben, y el préstamo guarda un campo nuevo
  opcional. En Foundry es **Crisol**.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `deudas`: se agregan DEU-11 (un gasto que te deben, todo o una parte) y DEU-12 (devolver al gasto).

## Impact

- `index.html`: hoja «Editar movimiento» de un gasto (botón nuevo), hoja nueva «Me deben una parte», detalle del
  préstamo dado (de qué gasto salió y «Devolver al gasto»).
- Datos: el préstamo dado que sale de un gasto guarda `deGastoId` (nuevo, opcional) y `categoriaId`. Una persona nueva
  crea un «te deben» con los campos de siempre. No se renombra, borra ni cambia de tipo ningún campo; los datos viejos
  no se tocan y no hace falta migración.
- Sin cambios en saldos, Desglose, topes, ritmo ni proyección: siguen contando por tipo de movimiento.
- `pruebas/verificar.mjs`: pruebas DEU-11 y DEU-12. `docs/DOMINIO.md` y `docs/DECISIONES.md` al día.
