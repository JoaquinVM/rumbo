# Decisiones

Registro de las decisiones tomadas al construir Rumbo, con su motivo. Las de producto que tomó Joaquín van marcadas
(J); las que tomó Claude al implementar, (C). Una decisión se cambia agregando otra que la reemplace.

## Producto (antes de implementar)

1. (J) Rumbo es un sistema propio, independiente de Steady, en `~/Proyectos/rumbo`. (9/11/2026)
2. (J) Bs y dólares, con un tipo de cambio que pone la persona; arranca con efectivo y banco en Bs.
3. (J) Anotar a mano rápido; frase, voz, foto, extracto y pareja quedan fuera de v1.
4. (J) Cuentas con saldo; fijos mensuales que preguntan antes de registrarse.
5. (J) Deudas de 3 tipos, metas como apartado virtual, categorías editables sin subcategorías, topes mensuales simples.
6. (J) Mes «mixto»: el día a día hasta el próximo ingreso; reportes y topes por mes de calendario.
7. (J) Ingresos: base fija más irregulares; la proyección usa un irregular esperado que pone la persona.
8. (J) Proyección en plata de hoy con inflación propia; rendimiento por cuenta; respaldo descargable.
9. (J) Estilo Bloques sólidos; íconos SVG, nunca letras; botones con estilo propio en tinta oscura.
10. (J) Requisitos en OpenSpec, con el mismo stack (una página, artifact, sin librerías). (10/11/2026)
11. (J) Construir todo v1 sin preguntas intermedias; las specs que redacte Claude quedan aprobadas. (10/11/2026)

## Implementación

12. (C) Metas se construye antes que Fijos y Hoy, porque el libre resta lo que falta apartar.
13. (C) Interés de un pago = saldo × tasa ÷ 12 redondeado a centavos; se guarda interés y capital en el movimiento.
14. (C) Ejemplo del préstamo con números exactos: adelantando Bs 300 termina en mar 2028, 7 meses antes, Bs 753 menos.
16. (C) El modelo de datos de v1 se escribe completo desde el primer cambio (las 9 colecciones de `docs/DOMINIO.md`),
    porque los 7 cambios lo comparten; cada cambio suma sus pantallas y reglas encima.
17. (C) El saldo de una cuenta suma todos sus movimientos sin mirar la fecha: el saldo inicial es «el de hoy» al crearla
    y se asume que los movimientos se anotan después.
18. (C) Un fijo guarda el mes en que se creó (`desde`) y solo genera pendientes desde ese mes; «Por confirmar» mira el mes
    actual y el anterior, para no acumular meses viejos.
19. (C) El ícono de un fijo sale de su nombre cuando es reconocible (luz, internet, streaming, cuota, sueldo) y si no, de
    su categoría.
20. (C) Proyección: las cuentas crecen con un rendimiento ponderado por saldo (igual al de cada cuenta en el primer mes);
    cada préstamo se amortiza aparte y, al terminar, su cuota deja de salir.
21. (C) En modo oscuro el color de acción se invierte (botón claro con texto oscuro) para que «lo oscuro se toca» siga
    siendo «lo que contrasta se toca».
22. (C) Los 7 cambios se implementaron en un solo pase de código sobre el mismo `index.html` (comparten modelo y
    pantallas) y se archivan juntos en OpenSpec; cada uno conserva su propuesta, deltas y tareas en el archivo.
23. (C) El movimiento de un fijo confirmado usa el id `m_<fijo>_<mes>`: dos pestañas que confirman a la vez escriben el
    mismo documento y no duplican el gasto.
24. (C) Pagar una deuda propone la cuenta del fijo de su cuota; si no hay, la última cuenta usada en la misma moneda.
25. (C) El Desglose abre en el mes en curso aunque el sueldo todavía no haya llegado; por eso «de cada Bs 100» puede
    pasar de 100 a principio de mes. Se deja así para no esconder el mes actual.
26. (C) El ejemplo usa un irregular esperado de Bs 2.000 para mostrar metas que «van bien».
27. (C) Un fijo quitado queda inactivo (no se borra) para conservar su historia; una meta archivada libera lo apartado.
28. (C) Las tareas de publicar quedan sin marcar en cada cambio hasta que Joaquín dé el sí; los cambios se archivan
    igual, porque el código ya cumple sus specs en la rama.
29. (C) Trabajo en la rama `v1`, un commit por cambio; publicar el artifact y mergear a main quedan para el sí de
    Joaquín al final, como piden `CLAUDE.md` y Foundry.
30. (C) 10/11/2026, prueba en pantalla con la sesión de Joaquín: al empezar, la app volvía unos segundos al ejemplo porque
    reemplazar los datos borraba primero el documento principal. Ahora reemplazar borra solo lo que sobra y escribe el
    principal al final, «Borrar todo» borra primero el principal, y mientras dura cualquiera de los dos la app no toma
    las fotos a medias de la base. Lo cubre `pruebas/nube.mjs`, con una base falsa.
31. (C) 12/11/2026, análisis contable (cambio `correcciones-contables`): una deuda solo se mueve con cuentas de su
    moneda, en vez de convertir montos; así un pago nunca crea ni destruye dinero.
32. (C) El interés que no se paga (cuota saltada o pago corto) se suma a la deuda y es gasto, como en un banco. Borrar
    ese interés devuelve la cuota a «por confirmar».
33. (C) Un movimiento anterior a la apertura de su cuenta cuenta en el Desglose pero no en el saldo: el saldo inicial ya
    lo incluía. Las cuentas y deudas anteriores a este cambio no tienen fecha de apertura y se comportan como antes.
34. (C) La tasa de ahorro cuenta el capital de las cuotas como ahorro; «Neto al mes» sigue siendo lo que queda en caja.
35. (C) «Plata de hoy» supone que ingresos y gastos suben con la inflación y las cuotas no. Cambia la spec PRO-05 que
    había aprobado Joaquín: con el sueldo congelado, 1.000 al mes por 10 años al 8 % mostraban Bs 55.600; ahora Bs 83.400.
    No llega a 120.000 porque lo que se ahorra sin rendimiento igual pierde valor.
36. (C) El Desglose no mete cuadres, cambio de moneda ni cierres en «Salió»: los muestra en una línea aparte, para que
    se vea todo lo que movió el patrimonio sin mezclarlo con los gastos.
37. (J) 12/11/2026, trabajo 063: un gasto que pagaste por otra persona se vuelve «te deben», todo o una parte, hacia un
    «te deben» existente o uno nuevo. El caso contrario («otro pagó por mí») no se pidió.
38. (C) Una parte parte el gasto en dos movimientos (gasto menor + préstamo dado); todo cambia el tipo del mismo
    movimiento, para que un fijo confirmado siga confirmado. Así ningún cálculo cambia: todos cuentan por tipo.
39. (C) El préstamo guarda `deGastoId` y `categoriaId` (campos nuevos, opcionales, sin migración). «Devolver al gasto»
    reemplaza a «Borrar» en ese préstamo: suma al gasto original si sigue siendo gasto de la misma cuenta; si no, el
    préstamo vuelve a ser gasto con su categoría. La cuenta nunca cambia.
40. (C) Solo se ofrecen «te deben» de la moneda de la cuenta y abiertos el día del gasto o antes; la persona nueva se
    abre el día del gasto. Una deuda abierta después ya incluye lo anterior en su saldo inicial.
41. (C) Se escribe primero lo que baja la salida de la cuenta y después lo que la sube (gasto reducido, luego préstamo;
    al devolver, borrar el préstamo y luego sumar al gasto): si se corta a la mitad, nada se cuenta dos veces.
42. (J) 12/11/2026, trabajo 064: Rumbo no se acerca con zoom. Los campos de texto usan 16px para que el iPhone no
    acerque al tocarlos, y tampoco se puede hacer zoom con los dedos ni con doble toque.
43. (J) 13/11/2026, trabajo 066: el color principal (el azul) se elige en Ajustes entre Azul, Cielo, Morado y Rosa
    pastel, y se guarda en los Ajustes de la base (`aj.color`; si falta, Azul). Se descartaron el verde y el turquesa
    porque se confunden con el verde de metas. El Rosa pastel lleva texto vino en sus bloques y un rosa más fuerte
    para textos y trazos sobre el fondo claro.
44. (J) 13/11/2026, trabajo 068: Rumbo se usa en `rumbo.jviscafe.com`, en el VPS de Akhana, aislado de Akhana. Entra
    quien Cloudflare Access apruebe por correo; no hay inicio de sesión propio. Los datos del artifact se copian una
    vez con el respaldo y el artifact se deja de usar.
45. (C) Servidor propio en Node 24 con PostgreSQL 17 y `pg` como única dependencia, solo en el servidor; la página sigue
    sin librerías ni compilación. Se descartó SQLite (`node:sqlite` todavía es experimental). Los documentos se guardan
    tal cual (JSON), así que no hay migración de campos.
46. (C) Las escrituras al servidor salen de a una y en orden; sin señal se reintentan y se avisa «Hay cambios sin
    guardar». Si venció la sesión de Access, se pide volver a entrar en otra pestaña: recargar perdería lo pendiente.
    Si no hay red al abrir, no se muestra el ejemplo, porque desde él se podría «empezar» encima de los datos reales.
47. (C) Se publica con un tag `vX.Y.Z`: el CI mueve `production` y el VPS la despliega con respaldo previo y vuelta
    atrás (`docs/DESPLIEGUE.md`). Respaldo diario cifrado en B2 con clave y ruta propias, prueba semanal de
    restauración y avisos en healthchecks.io.
48. (J) 14/11/2026, trabajo 068: Rumbo se usa con internet («no que sea con internet nomas»). Si la señal se corta un
    momento, lo anotado se reintenta y se avisa mientras la pestaña siga abierta, pero no se guarda en el teléfono: si
    el teléfono cierra la pestaña antes de que vuelva la señal, eso se pierde.
49. (J) 14/11/2026, trabajo 068: los respaldos de las apps van en un bucket propio de B2 (`jviscafe-apps-respaldos`),
    no en una carpeta del bucket de Akhana: así nunca aparecen en los listados de los scripts de Akhana. La clave
    `rumbo-vps` solo ve ese bucket y la carpeta `rumbo/`. Sigue siendo gratis: los 10 GB gratis de B2 son por cuenta.
50. (J) 14/11/2026, trabajo 074: Rumbo 2 se construye por etapas (opción B del cambio `rumbo-2-reescritura`), en los
    trabajos 075 a 080: base y CI, dominio en centavos, servidor, pantallas en dos partes, y migración con corte. La
    v1 sigue en producción hasta el corte. Un monto con más de 2 decimales no se guarda (FMT-03).
51. (J) 14/11/2026, trabajo 073: Rumbo se puede agregar a la pantalla de inicio del teléfono con el nombre «Rumbo», la
    brújula blanca sobre azul como ícono (fija, no sigue el color de Ajustes) y el fondo de la app como color de tema y
    de pantalla de inicio. No lleva service worker: se sigue usando con internet (decisión 48).
52. (J) 14/11/2026, trabajo 075: la base de Rumbo 2 (grupo 1) empieza ya, sin esperar a que 072 se mergee (073
    entró mientras se construía). Los trabajos 076 en adelante siguen esperando a 072. Para no chocar con él, 075 no
    toca `index.html` de la raíz ni `servidor/*.mjs`.
53. (C) 14/11/2026, trabajo 075: la v1 congelada en `pruebas/v1/` es una copia de v1.0.0 (`index.html` y
    `verificar.mjs`), no un traslado: producción sigue sirviendo el `index.html` de la raíz con `servidor/*.mjs` y la
    imagen no cambia hasta el corte (080), y 072 sigue trabajando sobre esos archivos. `pruebas/v1/motor.mjs`
    carga su motor en Node para compararlo con la v2.
54. (C) 14/11/2026, trabajo 075: un solo `package-lock.json` en la raíz para los seis workspaces, generado con npm 11.
    `servidor/` es workspace pero conserva su propio `package.json` y `package-lock.json` sin cambios, porque la
    imagen de Docker instala desde ellos; el servidor en TypeScript (077) decide cómo se construye la imagen.
    Versiones exactas: además de las del cambio, Zod 4.6.7, `@vitejs/plugin-react` 5.2.0 (como Strata), Playwright
    1.64.0, Lighthouse CI 0.15.1 y los tipos de Node 24 y React 18.
55. (C) 14/11/2026, trabajo 075: el e2e y Lighthouse corren contra `e2e/servidor-prueba.mjs`, un punto de entrada
    solo de pruebas que usa el servidor de la v1 (`crearServidor`) con su base Postgres y un Access de mentira que
    deja pasar un token fijo, y sirve la página de la v2 (`app/dist`) comprimida, como Cloudflare. La imagen no lo
    copia (`.dockerignore` solo deja pasar la página de la v1, su manifiesto, sus íconos y `servidor/`). Lighthouse mide la mediana de 3 corridas en
    su modo teléfono (pantalla de teléfono y 4G lento simulado).
56. (C) 14/11/2026, trabajo 075: la regla de capas es la de Strata sobre las carpetas del monorepo: dominio y
    contratos no importan nada nuestro (contratos solo usa Zod), aplicación solo dominio y contratos,
    infraestructura además aplicación, presentación solo contratos, el servidor solo contratos y dominio, la
    migración además la v1 congelada, y nadie importa la composición.
