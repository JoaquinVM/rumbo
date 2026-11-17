# Dominio de Rumbo

**Dominio:** las finanzas personales de una persona. El dinero se guarda en **cuentas**, se mueve con **movimientos** y
se planifica con **fijos**, **deudas**, **metas** y **topes**.

**Principio:** se guardan solo hechos; todo lo demás se calcula. Saldos, patrimonio, ritmo, libre del día, proyección
y avance de topes nunca se guardan, así nunca hay dos números que se contradigan.

## Entidades que se guardan

### 1. Ajustes
Tus supuestos para que Rumbo calcule. Uno por persona.
- Tipo de cambio (valor y fecha), inflación anual, ingreso irregular esperado al mes, horas de trabajo al mes,
  empezado (sí o no), color principal (Azul, Cielo, Morado o Rosa pastel; si falta, Azul). La moneda base es siempre Bs.
- Ejemplo: Bs 12,50 (1 nov), 8 %, Bs 1.500, 160 h.

### 2. Cuenta
Un lugar donde está tu dinero, con saldo y moneda.
- Nombre, moneda (Bs o USD), saldo inicial con su fecha, rendimiento anual, «para el día a día», archivada.
- Las del día a día definen lo que puedes gastar hoy. Una cuenta con movimientos no se borra: se archiva.
- Ejemplo: Efectivo (Bs, día a día), Banco (Bs, día a día, 2 %), Dólares (US$, ahorro).

### 3. Categoría
El «para qué» de un gasto o el «de dónde» de un ingreso.
- Nombre, color, ícono, gasto o ingreso, tope mensual opcional, base o propia, archivada.
- Agrupa movimientos para el desglose, las palancas de «¿Y si…?» y los topes. Se archiva, no se borra.

### 4. Movimiento
Algo que pasó con tu dinero: una fecha, una cuenta y un monto. Es el único registro de lo que ocurrió.
- Fecha, tipo, cuenta, monto (siempre positivo; el tipo dice si entra o sale), nota y, según el tipo: categoría,
  cuenta y monto de destino, deuda, interés y capital, fijo y mes de origen.
- Tipos:
  - **Gasto** y **ingreso**: llevan categoría.
  - **Transferencia**: entre cuentas distintas; con dos montos si cambia la moneda. No es gasto ni ingreso.
  - **Ajuste**: corrige un saldo al cuadrar una cuenta. No es gasto ni ingreso.
  - **Pago de deuda**: se divide en interés (gasto en Intereses) y capital (baja la deuda).
  - **Cobro**: te pagan lo que te deben.
  - **Préstamo dado**: prestas dinero; nace o sube un «te deben».
    También sale de un gasto que pagaste por otra persona: todo el gasto o una parte pasa a ser préstamo dado, con la
    misma cuenta y fecha, y guarda de qué gasto salió (`deGastoId`) y su categoría, para poder devolverlo al gasto.
  - **Dinero que te prestan**: sube la cuenta y la deuda. No es ingreso.
  - **Interés sin pagar**: el interés de una cuota saltada; sube la deuda y es gasto en Intereses. No tiene cuenta.
  - **Cierre**: el saldo de una deuda que se archiva sin pagar o cobrar; cambia el patrimonio y se ve en el Desglose.
- Un movimiento en dólares guarda el tipo de cambio del día. Un pago, cobro o préstamo siempre usa una cuenta de la
  moneda de la deuda.
- Cuentas y deudas guardan su fecha de apertura: lo anterior ya está en el saldo inicial y no lo vuelve a cambiar.

### 5. Fijo
Una promesa de dinero que se repite cada mes el mismo día.
- Nombre, gasto o ingreso, monto, cuenta, categoría, día del mes (1–31; si el mes es más corto, cae el último día),
  deuda si es una cuota, activo.
- Ejemplo: Sueldo Bs 8.000 el 25 al Banco; Renta Bs 2.500 el 5.

### 6. Ocurrencia de fijo
Lo que pasó con un fijo en un mes concreto.
- Fijo, mes (AAAA-MM), estado (confirmado o saltado), movimiento creado.
- Una por fijo y mes. Sin ocurrencia, el fijo está pendiente y aparece en «Por confirmar».

### 7. Deuda
Dinero que debes o que te deben, con un saldo que baja con cada pago.
- Tipo (préstamo, con una persona, te deben), nombre, moneda, saldo inicial con su fecha. Préstamo: interés anual,
  cuota y día. Los otros: fecha esperada opcional.
- Ejemplo: Préstamo del banco Bs 18.400 al 14 % con cuota de Bs 900; Hermano Bs 1.500; Amigo te debe Bs 400.

### 8. Meta
Una cantidad que quieres juntar para una fecha.
- Nombre, monto, fecha, archivada.
- Ejemplo: Fondo de emergencia, Bs 15.000 para diciembre de 2027.

### 9. Apartado
Dinero de una cuenta que reservas para una meta, sin moverlo.
- Meta, cuenta, monto (positivo al apartar, negativo al desapartar), fecha.
- Es un historial, para saber cuánto apartaste en el mes. Lo apartado en una cuenta no supera su saldo.

## Lo que se calcula

| Valor | Cómo |
| --- | --- |
| Saldo de una cuenta | Saldo inicial + sus movimientos |
| Saldo de una deuda | Saldo inicial − capital pagado o cobrado; cuotas futuras desde ahí |
| Patrimonio | Cuentas (USD × tipo de cambio) + te deben − deudas |
| Ritmo | Fijos + promedio de 90 días de lo variable + irregular esperado → neto, tasa de ahorro, colchón |
| Hoy | Disponible, libre y monto al día hasta el próximo ingreso fijo |
| Proyección | Mes a mes, con rendimiento por cuenta, amortización e inflación |
| Metas y topes | «Vas bien» o «No alcanza»; avance de cada tope (80 % ámbar, 100 % rojo) |

## Montos

En Rumbo 2 todo monto de dinero se guarda como un **entero de centavos** de su moneda (FMT-05): Bs 3.550,50 es `355050`
y US$ 12 es `1200`. Son dinero estos campos: en Ajustes `irregular`; en cuentas `saldoInicial`; en categorías `tope`;
en movimientos `monto`, `montoDestino`, `interes` y `capital`; en fijos `monto`; en deudas `saldoInicial` y `cuota`; en
metas `monto`; y en apartados `monto`. El tipo de cambio, la inflación, el rendimiento y el `interes` de una deuda son
tasas y se guardan con sus decimales. La v1 guardaba los mismos campos en decimales; la migración (DAT-08,
`migracion/`) los pasa de una forma a otra y de vuelta.

## Dónde se guarda

En `rumbo.jviscafe.com`, en la base propia de Rumbo (PostgreSQL, `servidor/esquema.sql`), privado por correo de
Cloudflare Access: la tabla `principal` guarda los Ajustes (`{aj}`) y la tabla `docs` cada documento de las colecciones
`cuentas`, `categorias`, `movs`, `fijos`, `ocurrencias`, `deudas`, `metas` y `apartados`, tal como lo manda la página
(JSON, con su `id`). El servidor no interpreta montos ni campos: todas las cuentas las hace la página.

Rumbo 2 usa sus propias tablas, iguales pero con montos en centavos: `v2_principal` y `v2_docs`, y `v2_migracion`
anota cuándo se pasaron los datos de la v1 (sin esa fila, Rumbo 2 no arranca sano). Su servidor valida cada documento
con los contratos compartidos antes de guardarlo (DAT-09). Las tablas de la v1 no cambian con la migración.

Dentro del artifact, que se dejó de usar, en su base, privado por persona: `data/users/<id>/rumbo` guarda los Ajustes
y debajo hay una colección por entidad, con los mismos nombres. Sin ninguna de las dos, en el navegador.
