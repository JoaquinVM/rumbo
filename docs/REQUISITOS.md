# Requisitos de Rumbo

**Para qué existe.** Pedido de Joaquín (9/11/2026): «una app para administrar mi dinero, completa pero simple y que te dé
gusto usar. Que realmente te haga entender a dónde te llevan tus ingresos y gastos actuales».

**Para quién.** Joaquín, en Bolivia. Uso personal, en el teléfono y en la computadora, dentro de claude.ai.

**Versión de estos requisitos:** v1.1, escrita por Joaquín y Claude el 10/11/2026 y ajustada con los mockups el mismo día. Cada requisito tiene un ID; el código y
las pruebas apuntan a él. Estado: **Hecho** (ya está en la app), **Cambia** (está en la app de otra forma) o
**Por hacer**.

Si un requisito cambia, se ajustan el código y las pruebas; nunca al revés. Lo nuevo se propone aquí antes de construirse.

## Glosario

| Palabra | Significa |
| --- | --- |
| Cuenta | Un lugar donde está tu dinero: efectivo, banco, dólares. Tiene saldo. |
| Cuenta para el día a día | Una cuenta de la que sale lo que gastas normalmente. Por defecto, las de Bs sí y las de USD no. |
| Movimiento | Un gasto, ingreso, transferencia o ajuste en una cuenta, con fecha. |
| Fijo | Un ingreso o gasto que se repite cada mes el mismo día: sueldo, renta, servicios, cuotas. |
| Variable | Todo movimiento de gasto o ingreso que no viene de un fijo. |
| Ingreso irregular | Un ingreso variable: retiros del negocio, ventas, proyectos. |
| Patrimonio | Cuentas + lo que te deben − deudas, en Bs. |
| Ritmo | Lo que entra y sale en un mes típico, según tus fijos y tu promedio. |
| Libre | Lo que puedes gastar en lo variable sin tocar lo comprometido. |
| Tipo de cambio | Los Bs que vale 1 USD para ti. Lo pones tú. |

## Formato y moneda

| ID | Requisito | Estado |
| --- | --- | --- |
| FMT-01 | La moneda base es el boliviano. Los montos se muestran «Bs 1.234,50»: punto de miles y coma decimal. | Cambia: hoy arranca en MXN y no tiene Bs |
| FMT-02 | Los movimientos se muestran con 2 decimales; los resúmenes, la gráfica y los indicadores, sin decimales. | Por hacer |
| FMT-03 | Los montos se leen como se escriben: `1.500` y `1,500` son 1500; `12,50`, `1.500,50` y `1,500.50` conservan los decimales. | Hecho (era RUM-12) |
| FMT-04 | Un monto en USD se muestra «US$ 1.234,50». | Por hacer |

## Cuentas y tipo de cambio

| ID | Requisito | Estado |
| --- | --- | --- |
| CTA-01 | Puedes crear cuentas con nombre, moneda (Bs o USD), saldo de hoy, rendimiento anual % (0 si no rinde) y si es para el día a día. Se pueden editar y archivar; una cuenta archivada no se borra ni pierde sus movimientos. | Por hacer |
| CTA-02 | El saldo de una cuenta es su saldo inicial más todos sus movimientos. | Por hacer |
| CTA-03 | «Cuadrar» una cuenta: escribes el saldo real y Rumbo registra la diferencia como un movimiento de tipo ajuste, visible en Movimientos. Un ajuste no es gasto ni ingreso. | Por hacer |
| CTA-04 | El tipo de cambio es uno solo, lo pones tú y guarda su fecha. Si tiene más de 7 días, Rumbo lo avisa. | Por hacer |
| CTA-05 | Patrimonio = cuentas (las de USD por el tipo de cambio) + lo que te deben − deudas. Se muestra en Bs y su equivalente en USD. | Cambia: hoy es un número que escribes |
| CTA-06 | Al guardar un cambio de moneda (MOV-03), Rumbo ofrece usar el tipo de esa operación como tu tipo de cambio. Ajustes muestra tu último cambio real junto al tipo que usas. | Por hacer |

## Movimientos y cómo anotar

| ID | Requisito | Estado |
| --- | --- | --- |
| MOV-01 | El botón + anota un gasto, ingreso o transferencia: monto, cuenta, categoría (no en transferencias), nota opcional y fecha (hoy por defecto). | Cambia: hoy no hay cuenta ni transferencia |
| MOV-02 | El formulario recuerda la última cuenta usada, ordena primero tus categorías más usadas en los últimos 90 días y sugiere notas que ya escribiste. | Por hacer |
| MOV-03 | Una transferencia saca dinero de una cuenta y lo pone en otra. Si las monedas son distintas (un cambio de Bs a USD), se escriben los dos montos. No es gasto ni ingreso. | Por hacer |
| MOV-04 | Movimientos se ven por mes de calendario, agrupados por día, con filtro por cuenta. Se editan y se borran con dos toques. | Cambia: falta el filtro por cuenta |
| MOV-05 | Al guardar un gasto de una categoría con tope, Rumbo dice cuánto llevas si pasaste el 80 % o el 100 % (LIM-03). | Por hacer |

## Fijos

| ID | Requisito | Estado |
| --- | --- | --- |
| FIJ-01 | Un fijo tiene nombre, gasto o ingreso, monto, cuenta, categoría y día del mes. Son mensuales. Si el mes no tiene ese día, cae el último día del mes. | Cambia: hoy no tiene cuenta ni día |
| FIJ-02 | Desde su día, el fijo aparece en «Por confirmar» con su monto editable. «Confirmar» crea el movimiento en su cuenta; «No este mes» lo salta. Sigue pendiente hasta que elijas una de las dos. | Por hacer |
| FIJ-03 | Un fijo no se registra solo. Un mes con un fijo sin confirmar no cuenta como pagado. | Cambia: hoy se cuentan solos |
| FIJ-04 | Un fijo puede ser la cuota de una deuda; al confirmarlo, el pago se registra en esa deuda (DEU-03). | Por hacer |

## Hoy: lo que puedes gastar

| ID | Requisito | Estado |
| --- | --- | --- |
| HOY-01 | Disponible = saldo de las cuentas para el día a día − lo apartado para metas en esas cuentas. | Por hacer |
| HOY-02 | Libre = disponible − fijos de gasto que vencen antes de tu próximo ingreso fijo y no están confirmados ni saltados − el aporte a metas que falta este mes (MET-03). | Cambia: hoy se calcula sobre el mes de calendario |
| HOY-03 | Al día = libre ÷ días desde hoy hasta el día anterior a tu próximo ingreso fijo. Sin ingresos fijos, hasta fin de mes. | Cambia |
| HOY-04 | Un ingreso irregular entra a su cuenta y sube el libre en ese momento. | Por hacer |
| HOY-05 | Si el libre es negativo, Rumbo dice cuánto te pasaste en vez de un monto por día. | Hecho |

## Proyección: a dónde te lleva tu ritmo

| ID | Requisito | Estado |
| --- | --- | --- |
| PRO-01 | La pantalla principal dice en una frase cuánto tendrás a este ritmo al horizonte elegido (1, 5, 10 o 20 años), con una gráfica mes a mes. | Hecho |
| PRO-02 | Neto del ritmo = fijos de ingreso + ingreso irregular esperado (AJU-01) − fijos de gasto − promedio de lo variable de gasto de los últimos 90 días por categoría. El promedio cuenta desde el primer movimiento de esa ventana, mínimo 1 mes y máximo 3. | Cambia: hoy el irregular es el promedio real |
| PRO-03 | La proyección parte del patrimonio de hoy. Cada mes cada cuenta crece con su rendimiento si su saldo es positivo; una deuda no rinde. | Cambia: hoy hay un solo rendimiento |
| PRO-04 | Cada préstamo se amortiza mes a mes con su interés y su cuota. Cuando termina, su cuota deja de salir, y Rumbo dice en qué mes terminas y cuánto más ahorras desde ahí. | Por hacer |
| PRO-05 | La proyección se muestra en plata de hoy, descontando la inflación anual que pones (AJU-02). Un toque cambia a montos nominales. | Por hacer |
| PRO-06 | El tipo de cambio se mantiene constante en la proyección, y Rumbo lo dice debajo de la gráfica. | Por hacer |
| PRO-07 | Si a este ritmo tus cuentas llegan a cero, el titular dice en qué mes. | Hecho (era RUM-05) |
| PRO-08 | «¿Y si…?»: recortar 0–60 % de tus 4 categorías variables más grandes, sumar un ingreso extra al mes y adelantar un pago extra al mes a un préstamo. Se dibuja una segunda línea y la diferencia al horizonte; en un préstamo, también cuántos meses antes terminas y cuánto interés te ahorras. | Cambia: falta adelantar préstamo |

## Indicadores

| ID | Requisito | Estado |
| --- | --- | --- |
| IND-01 | Tasa de ahorro = neto del ritmo ÷ ingresos del ritmo. | Hecho |
| IND-02 | Colchón = saldo de las cuentas ÷ gasto mensual del ritmo, en meses. | Cambia: hoy usa el patrimonio escrito |
| IND-03 | Neto al mes, con lo que entra y lo que sale. | Hecho |
| IND-04 | Deuda total y el mes en que quedas libre de préstamos a este ritmo. | Por hacer |

## Deudas

| ID | Requisito | Estado |
| --- | --- | --- |
| DEU-01 | Tres tipos: **préstamo** (saldo, interés anual, cuota mensual, día de pago), **deuda con una persona** (saldo, sin interés, fecha esperada opcional) y **dinero que te deben** (saldo, fecha esperada opcional). Moneda Bs o USD. | Por hacer |
| DEU-02 | En un pago de préstamo, el interés es saldo × interés anual ÷ 12 y el resto baja el capital. El interés cuenta como gasto en la categoría Intereses; el capital no es gasto. | Por hacer |
| DEU-03 | Pagar una deuda o cobrar lo que te deben es un movimiento de una cuenta que baja el saldo pendiente. Prestar dinero crea o sube un «te deben». | Por hacer |
| DEU-04 | Cada deuda muestra su saldo; el préstamo, además, cuándo terminas y cuánto interés pagarás en total. | Por hacer |
| DEU-05 | El detalle del préstamo muestra las próximas 3 cuotas con su interés, su capital y el saldo que queda. Al adelantar pagos (PRO-08) dice cuánto baja tu libre al día. | Por hacer |

## Metas

| ID | Requisito | Estado |
| --- | --- | --- |
| MET-01 | Una meta tiene nombre, monto y fecha. | Por hacer |
| MET-02 | «Apartar» reserva dinero para una meta en una cuenta, sin moverlo. Lo apartado no cuenta como disponible (HOY-01). Se puede desapartar. | Por hacer |
| MET-03 | Aporte sugerido al mes = (monto − apartado) ÷ meses que faltan para la fecha. Lo que falta apartar este mes se resta del libre (HOY-02). | Por hacer |
| MET-04 | Cada meta muestra cuánto llevas, si llegas a la fecha a este ritmo y cuánto apartar por mes. Se marca en la gráfica de la proyección. | Por hacer |
| MET-05 | «Vas bien» cuando el neto del ritmo (PRO-02) cubre la suma de los aportes sugeridos de todas tus metas. Si no la cubre, las metas dicen «No alcanza» y cuánto falta al mes en total. | Por hacer |

## Categorías y límites

| ID | Requisito | Estado |
| --- | --- | --- |
| LIM-01 | Las categorías se crean, renombran, cambian de color y archivan; no hay subcategorías. Una categoría archivada conserva sus movimientos. | Cambia: hoy son fijas |
| LIM-02 | Categorías base de gasto: Comida fuera, Súper, Casa, Transporte, Salud, Ocio, Compras, Suscripciones, Educación, Intereses y Otros. De ingreso: Sueldo, Negocio, Ventas, Extra y Otros. | Cambia: se suma Intereses y Negocio; Deudas sale (lo cubre DEU) |
| LIM-03 | Una categoría de gasto puede tener un tope mensual. Cuenta los gastos del mes de calendario, incluidos los fijos confirmados. Lo que sobra no pasa al mes siguiente. | Por hacer |
| LIM-04 | Aviso al llegar al 80 % (ámbar) y al pasar el 100 % (rojo), en Rumbo y en el Desglose. | Por hacer |

## Desglose

| ID | Requisito | Estado |
| --- | --- | --- |
| DES-01 | Por mes de calendario: lo que entró, lo que salió y lo que quedó. | Hecho |
| DES-02 | De cada Bs 100 que entran, cuánto va a cada categoría, cuántas horas de trabajo cuesta (si pusiste tus horas) y cuánto suma en 10 años a tu ritmo. Con el avance de su tope si tiene uno. | Cambia: falta el tope |

## Ajustes

| ID | Requisito | Estado |
| --- | --- | --- |
| AJU-01 | Ingreso irregular esperado al mes, que pones tú (puede ser 0). Al lado se ve tu promedio real de los últimos 3 meses como referencia. | Por hacer |
| AJU-02 | Inflación anual %. | Por hacer |
| AJU-03 | Horas que trabajas al mes; vacío oculta las horas en el Desglose. | Hecho |
| AJU-04 | Tipo de cambio (CTA-04). | Por hacer |

## Pantallas

| ID | Requisito | Estado |
| --- | --- | --- |
| PAN-01 | Cuatro pestañas: Rumbo, Movimientos, Desglose y Plan, más el botón + en todas. Ajustes desde el ícono de arriba. | Cambia: Fijos pasa a Plan |
| PAN-02 | **Rumbo**, en este orden: titular y gráfica; Hoy (HOY-03); Por confirmar (FIJ-02); avisos (CTA-04, LIM-04); metas; indicadores; ¿Y si…? | Cambia |
| PAN-03 | **Plan**: empieza con el patrimonio y su desglose (cuentas, te deben, deudas); luego cuentas con su saldo y el botón cuadrar, fijos, deudas, metas, y categorías con sus topes. | Por hacer |
| PAN-04 | Ninguna pantalla tiene scroll horizontal a 375 px de ancho, y se ve bien en modo claro y oscuro. | Hecho |
| PAN-05 | Los avisos son solo dentro de la app: un artifact no puede mandar notificaciones al teléfono. | Hecho |
| PAN-06 | El estilo es «Bloques sólidos» y sigue `DISENO.md`. Las pantallas de referencia son los mockups de v1. | Cambia: hoy es el estilo del prototipo |

## Datos y respaldo

| ID | Requisito | Estado |
| --- | --- | --- |
| DAT-01 | Sin datos guardados, la app muestra un ejemplo marcado como tal y no guarda nada hasta «Empezar con mis datos». | Hecho (era RUM-01) |
| DAT-02 | Empezar pide tus cuentas con su saldo de hoy, tu ingreso fijo (monto, cuenta y día) y tus gastos fijos principales; las deudas son opcionales. | Cambia |
| DAT-03 | Los datos son privados de la persona, en la base del artifact. Sin base, se guardan solo en ese navegador y la app lo dice. | Hecho (era RUM-11) |
| DAT-04 | «Descargar respaldo» baja un archivo con todos tus datos. «Cargar respaldo» muestra qué va a reemplazar (cuántas cuentas, movimientos, fijos, deudas y metas) y pide confirmar. | Por hacer |
| DAT-05 | Ningún campo guardado se renombra, borra ni cambia de tipo sin plan de migración, respaldo previo y verificación. La v1 arranca sin datos reales de v0 (Joaquín, 10/11/2026), así que no hay migración. | Hecho |
| DAT-06 | «Borrar todo» pide un segundo toque y vuelve al ejemplo. | Hecho |

## Fuera de v1

Están en `PENDIENTES.md`: anotar con una frase o por voz, foto del recibo o del QR, importar el extracto del banco,
compartir con tu pareja, exportar a CSV y escenarios de devaluación del dólar.
