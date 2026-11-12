# Design

## Monedas de una deuda (DEU-06)
En vez de convertir, se ofrecen solo cuentas de la moneda de la deuda al pagar, cobrar, recibir, prestar y al elegir la
cuenta del fijo de la cuota. Sin una cuenta de esa moneda, la app lo pide. Así el `monto` de esos movimientos vale igual
para la cuenta y para la deuda.

## Dinero que te prestan (DEU-07)
Tipo `recibido`: la cuenta sube y la deuda sube. Al crear un préstamo o una deuda con una persona se puede decir a qué
cuenta entra (como «sale de una cuenta» en «te deben»); en el detalle hay «Recibir más».

## Interés no pagado (DEU-02, DEU-08)
Un pago guarda `interes` = saldo × tasa ÷ 12 completo y `capital` = monto − interés, que puede ser negativo: la deuda sube
lo que faltó de interés. Saltar la cuota de un préstamo crea un movimiento `interes` (sin cuenta) con ese mes de interés;
la ocurrencia saltada apunta a él, así que borrarlo devuelve la cuota a «por confirmar».

## Fecha de apertura (CTA-07)
`desde` (fecha) en cuentas y deudas nuevas. El saldo ignora movimientos anteriores, que sí cuentan en el Desglose de su mes
(el gasto existió; el saldo de apertura ya lo incluía). Sin `desde`, todo cuenta, como antes.

## Cuota pagada a mano (FIJ-06, FIJ-07)
Al pagar un préstamo con fijo de cuota, si hay una cuota por confirmar (o la del mes del pago todavía no está), el pago
queda como esa cuota. Un préstamo nuevo cuyo día ya pasó este mes empieza a preguntar el mes siguiente.

## Conciliación (DES-03)
Δ patrimonio del mes = quedó + cuadres + diferencia de cambio + deudas cerradas. La diferencia de cambio de una compra o
venta de dólares es lo que valen en Bs, al tipo de cambio guardado en el movimiento, menos lo que se dio en Bs. El cambio
de tipo de cambio sobre los dólares que ya tienes no se muestra como movimiento.

## Plata de hoy (PRO-05)
El neto del ritmo sin cuotas sube cada mes con la inflación; las cuotas y los adelantos son montos fijos. En nominal la
curva crece más; en plata de hoy un neto constante suma lo mismo cada mes. Decisión de Claude: en Bolivia los sueldos se
reajustan cada año, y suponer un sueldo congelado por 20 años subestimaba mucho el rumbo.
