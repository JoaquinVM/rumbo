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
57. (J) 16/11/2026, trabajo 072: se entra a Rumbo con Google, y el código por correo se queda por si Google falla. Entra
    también la otra persona que usaba el artifact, con sus propios datos. Un correo nuevo va en la política de Access y
    en `CORREOS_PERMITIDOS`; el servidor no cambia porque ya separa los datos por correo. La app de Google queda en
    modo «Prueba»: para dos personas basta con agregarlas como usuarios de prueba, sin la verificación de Google.
58. (C) 16/11/2026, trabajo 077: el dominio de Rumbo 2 (`paquetes/dominio`) guarda y suma el dinero en centavos
    enteros; solo `porTasa`, `aBs` y las divisiones redondean, con aritmética exacta (sin decimales de JavaScript), a
    centavo y la mitad hacia arriba. Donde la v1 no redondeaba al pasar dólares a Bs, la v2 redondea cada conversión:
    por eso el patrimonio, el disponible, el Desglose y los topes pueden diferir en 1 centavo por cada cuenta, deuda o
    movimiento en dólares, como permite `design.md`. Lo apartado para una meta suma cada moneda y convierte una vez.
59. (C) Las estimaciones (ritmo, proyección, «¿Y si…?», monto al día, aporte de una meta) se calculan en centavos con
    decimales y con las mismas cuentas que la v1, y se redondean solo al mostrarse: así el titular, el monto al día y
    «vas bien» salen iguales que en la v1. `mostrar` copia el texto de la v1, incluido que un monto negativo justo en
    medio boliviano se muestra hacia arriba (−Bs 1,50 sin decimales es «−Bs 1»), como hacía `Math.round`.
60. (C) Al leer lo escrito, los ceros al final no cuentan como decimales: «0,500» son 50 centavos, como en la v1;
    «0,125» no se guarda.
61. (C) La comparación con la v1 (`pruebas/comparacion/`) corre 400 estados al azar con semilla fija en cada PR. Revisa
    cada cuota de cada préstamo desde el saldo de la v1, para que un centavo distinto en una cuota no tape los demás.
62. (J) 16/11/2026, trabajo 077: cuando el interés de una cuota cae justo en medio centavo, Rumbo 2 lo redondea hacia
    arriba, como dice FMT-05, aunque la v1, por sus decimales, a veces lo redondeaba hacia abajo (en 1 de cada 5 de
    esos casos, que son cerca de 1 de cada 1.200 cuotas). Lo ya guardado no cambia; la comparación con la v1 permite
    esa diferencia de 1 centavo solo en esas cuotas.
63. (J) 16/11/2026, trabajo 078: el saldo de cada cuenta se muestra siempre con dos decimales («Bs 3.550,00»,
    «Bs 3.180,40»), en Plan y en los botones para elegir una cuenta; los totales, el patrimonio y lo demás de FMT-02
    siguen sin decimales, y el «≈ Bs» de una cuenta en dólares también. Solo en Rumbo 2: la v1 no cambia, y el pedido
    queda en las specs de `rumbo-2-reescritura` (FMT-02, FMT-04 y CTA-01) para las pantallas.
64. (J) 16/11/2026, trabajo 080: los movimientos se pueden ver por categoría solo en Rumbo 2; la v1 sigue recibiendo
    solo arreglos. Se entra de dos formas: tocando una categoría del Desglose, que abre Movimientos de ese mes con esa
    categoría, y con la pastilla «Categoría» de Movimientos, debajo de las cuentas, que se quita con su ✕. El total es
    el mismo del Desglose: en Intereses cada cuota suma solo su interés, y lo que un gasto pasó a préstamo no aparece.
    Se combina con el filtro de cuenta y se mantiene al cambiar de mes. Joaquín lo vio en un prototipo local con los
    datos de ejemplo antes de aprobarlo (MOV-07, DES-05).
65. (C) 16/11/2026, trabajo 079: los contratos (`paquetes/contratos`) validan cada documento con Zod y dicen el problema
    con un código (`monto-no-entero`, `falta-categoria`, `falta-campo`, `tipo-desconocido`, `fecha-invalida`…) y el
    campo; la página elige las palabras. Los montos son los `Centavos` del dominio: los contratos usan del dominio solo
    ese tipo (la regla de capas lo comprueba), así el servidor no carga el dominio. Cada tipo pide sus campos (gasto e
    ingreso, cuenta y categoría; transferencia, las dos cuentas; pago, cobro, préstamo y recibido, cuenta y deuda;
    interés sin pagar y cierre, la deuda; un préstamo, su tasa, cuota y día), como los guarda la v1: una prueba pasa
    por el contrato el ejemplo y 400 estados al azar de la v1 convertidos a centavos. Los campos desconocidos pasan y se
    guardan tal cual (DAT-05).
66. (C) 16/11/2026, trabajo 079: el servidor de Rumbo 2 vive en `servidor/src` (TypeScript, se compila con `tsc -b`) y
    no cambia nada de la v1: `servidor/*.mjs`, `servidor/package.json`, `esquema.sql`, `deploy/Dockerfile`, el compose
    y `deploy/deploy.sh` quedan iguales, y producción sigue sirviendo la v1. Sus tablas (`v2_principal`, `v2_docs`,
    `v2_migracion`) las crea el propio servidor de la v2 al arrancar, solo agregando. Su imagen es `deploy/Dockerfile.v2`,
    de tres etapas, con su propio `.dockerignore` que deja fuera `e2e/`; el CI la construye y comprueba con
    `pruebas/imagen-v2.sh` que corre como `node`, no tiene el Access de mentira y no está sana sin la migración. El
    paquete de contratos compilado se elige al correr con `node --conditions=rumbo-compilado`; en el resto del
    proyecto se usa su código TypeScript. El e2e sigue usando el servidor de la v1 hasta que las pantallas usen
    `/api/v2`.
67. (C) 16/11/2026, trabajo 081: sin servidor ni artifact, Rumbo 2 guarda en el navegador con la clave
    `rumbo-2-centavos`, no `rumbo-v2` como decía `design.md`: esa clave ya es de la v1 y tiene montos con decimales, y
    leerla como centavos mostraría todo cien veces más chico. La primera vez convierte lo de `rumbo-v2` con la función
    de la migración (DAT-08) y no lo borra. En el artifact usa su propio documento (`rumbo2`) por lo mismo.
68. (C) 16/11/2026, trabajo 081: las pantallas de Rumbo 2 se arman con un contrato de la app (`paquetes/contratos/src/
    app.ts`): la aplicación entrega números en centavos y códigos, y la presentación elige las palabras y da formato.
    Como la presentación solo conoce los contratos, `presentacion/modelos/formato.ts` copia el `mostrar` del dominio, y
    una prueba compara los dos en 20.000 montos. Lo que todavía no se construye (Desglose, Plan, Ajustes, metas y
    empezar con mis datos, grupo 5) muestra «llega pronto» en Rumbo 2, sin tocar los datos.
69. (J) 16/11/2026, trabajo 081: no se monta el ambiente de prueba en el VPS que pedía PUB-07 («mejor haz todo,
    pruébalo en local y luego pásalo a producción, y si algo falla se hace rollback»). Cada trabajo de Rumbo 2 se
    prueba en local y en el CI; la migración se ensaya en la Mac de Joaquín con una copia del último respaldo, sin
    mostrar montos; y el corte (080) publica con respaldo previo y vuelta atrás sola si no queda sano (PUB-05).
    Producción sigue siendo la v1 hasta ese corte.
70. (C) 16/11/2026, trabajo 081: el e2e y Lighthouse usan ya el servidor de la v2 (`servidor/dist`), con un Access de
    mentira que da a cada prueba su propia persona; Lighthouse entra sin token (`E2E_ACCESS_ABIERTO=1`, solo en esa
    corrida) porque no puede mandar una cabecera solo al servidor y no a Google Fonts. Las fuentes se cargan sin frenar
    la primera pintada (la página se ve con la letra del sistema y cambia cuando llegan), la página pide los datos
    mientras baja el código, y la validación de los contratos (Zod, una cuarta parte del código) se carga junto a la
    primera pantalla y no antes: hasta que llega no se guarda nada («Un momento: Rumbo todavía está abriendo»), y si se
    corta la señal se vuelve a pedir. Así Rumbo pasa el mínimo de 90 en rendimiento también en las máquinas del CI,
    más lentas que la Mac. La accesibilidad da 95: los textos chicos al 88 % sobre los bloques ámbar y verde no llegan al
    contraste pedido; son los colores de la v1 y cambiarlos es un cambio visual que no se pidió.
71. (C) 16/11/2026, trabajo 084: las pantallas restantes de Rumbo 2 copian las de la v1 con sus textos; los casos de uso
    nuevos viven en `app/src/aplicacion/casos-plan.ts` y sus vistas en `vistas-plan.ts`, sobre las reglas del dominio. El
    respaldo nuevo es versión 2 (centavos); al cargar uno de versión 1 se convierte con la función de DAT-08 y, si un
    monto tiene más de 2 decimales, no se carga nada y se dice cuál es; uno de versión 2 con un documento que no pasa
    los contratos se trata como «no es un respaldo de Rumbo». Empezar y cargar un respaldo guardan todo junto
    (`PUT /api/v2/datos`, en la cola de DAT-07), como la v1. Borrar todo en el navegador deja la clave
    `rumbo-2-centavos` vacía en vez de quitarla, para que la próxima vez no vuelva a convertir lo de la v1. 073 se porta
    con el manifest y los íconos dentro de la página construida (`app/public`); 072 no cambió código de la página.
    Las pantallas que no son la primera se cargan aparte, con el primer toque (o enseguida si la página abre en Desglose
    o Plan), para que la pantalla Rumbo pese lo mismo que antes y Lighthouse siga sobre 90 en las máquinas del CI.
72. (C) Tres diferencias chicas con la v1, todas para no cambiar un monto sin querer: «Cuadrar» abre con el saldo con
    su signo (la v1 lo mostraba sin el «−»), el ingreso irregular de Ajustes se muestra con sus centavos si los tiene
    (la v1 lo redondeaba al guardar de nuevo), y los botones para elegir la cuenta al apartar para una meta muestran lo
    libre con 2 decimales, como los demás botones de cuenta (decisión 63).
73. (C) 16/11/2026, trabajo 084: la migración (`migracion/`) verifica con la misma comparación con la v1 que corre en el
    CI (`migracion/src/comparar.ts`, antes en `pruebas/comparacion/`), sobre los datos de cada persona y en la fecha de
    hoy, y además relee lo escrito y lo compara documento por documento. También pasa cada documento por los contratos:
    uno que no pasa se lista y no se aplica nada, para que un respaldo de Rumbo 2 siempre se pueda volver a cargar.
    Va empaquetada en un solo archivo (`migracion/dist/cli.js`, con Vite) dentro de la imagen de Rumbo 2, con la v1
    congelada al lado, porque en el corte corre en el VPS antes de que Rumbo 2 arranque. «Solo revisar» no crea ni
    escribe nada; `--aplicar` se niega a repetirse si ya hay una migración anotada (salvo `--de-nuevo`), porque Rumbo 2
    podría tener datos nuevos; el informe no muestra montos (las diferencias, que sí los tienen, solo con `--detalle`).
74. (J) 16/11/2026, trabajo 084: el ensayo de la migración se hizo con el respaldo local del VPS (copiado con `scp` por
    Joaquín como root), no bajándolo de B2, para no crear otra clave de B2 en la Mac. Resultado: 2 personas, 203
    documentos, cuadra en «solo revisar» y en `--aplicar` sobre la copia; ningún monto con más de 2 decimales. La copia
    y su Postgres se borraron al terminar.
75. (C) 17/11/2026, trabajo 084: las fuentes se piden recién cuando la primera pantalla ya está dibujada, no al abrir la
    página. Antes, en una máquina lenta como las del CI, llegaban antes de esa primera pintada y Lighthouse sumaba su
    bajada por 4G lento: el tag `v2.0.0` dio 86 y 88 de rendimiento con el mismo código que en `main` había dado más de
    90. Los informes del CI (que no se guardaban: su carpeta es oculta) mostraron además que el gráfico saltaba al
    llegar las fuentes (CLS 0,19). Las fuentes van con `display=optional`: si no están cuando se dibuja el texto, esa
    visita sigue con la letra del sistema y nada se mueve; las siguientes las encuentran en la caché del teléfono.
76. (J) 22/11/2026, trabajo 104: los íconos (`/iconos/*`) y el manifest de Rumbo se entregan sin iniciar sesión, con
    una aplicación de Access aparte («Rumbo iconos», política *Bypass*), porque el iPhone pide el ícono de la pantalla
    de inicio sin la sesión de Access. Solo tienen la brújula, el nombre y los colores; la página y la API siguen
    detrás de Access. Se descartó meter el ícono dentro de la página: no es seguro que el iPhone lo tome y no ayuda a
    Android.
