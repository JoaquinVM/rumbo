# Design

## Context

Motivación en `proposal.md`. Lo que hay hoy (v1.0.0, 14/11/2026):

- `index.html` (1.667 líneas): estilos, íconos, utilidades, dominio (funciones puras `saldoCuenta`, `saldoDeuda`,
  `ritmo`, `amortizar`, `proyectar`, `calcHoy`, `resumenMes`…), ejemplo, almacenes (artifact, servidor, navegador) y
  pantallas, todo en un archivo. Los montos son decimales de JavaScript y se redondean con `r2` en algunos puntos.
- `servidor/` (Node 24, `pg`): valida el token de Access y guarda cada documento JSON tal cual en `principal` y `docs`.
  Solo comprueba que sea un objeto con un `id` válido.
- Pruebas: `pruebas/verificar.mjs` carga el script de `index.html` en Node y prueba los escenarios de las specs;
  `nube.mjs` y `servidor-pagina.mjs` el guardado; `servidor.test.mjs` el servidor contra Postgres. Ninguna abre un
  navegador.
- CI (`verificar.yml`): pruebas en cada PR; un tag `v*` en `main` mueve `production`; el VPS la despliega cada 2
  minutos con respaldo previo y vuelta atrás (`docs/DESPLIEGUE.md`).
- Strata (`~/Proyectos/life-project`, sin git): React 18.3.1, TypeScript 5.9.3, Vite 7.3.8, Vitest 4.1.12,
  dependency-cruiser 17.4.3; seis capas con una regla de dependencias comprobada en las pruebas; resultados tipados
  en lugar de excepciones. No tiene backend ni Playwright.
- En curso en la v1: 072 (entrar con Google y una segunda persona) y 073 (PWA instalable).

## Goals / Non-Goals

**Goals:**
- Los mismos escenarios de las 15 specs, con los mismos números, sobre una base de código por capas y en centavos.
- Que una regla de dinero rota se vea en el CI antes del merge: por su prueba, por la comparación con la v1 o en el
  navegador.
- Migrar los datos reales sin perder ni cambiar un centavo, con vuelta atrás.

**Non-Goals:**
- Funciones nuevas para la persona, cambios visuales o de textos. Lo que pida Joaquín mientras tanto entra en la v1 o
  espera al corte.
- Mover los cálculos al servidor. Siguen en el teléfono, como hoy: son instantáneos y funcionan con la señal cortada.
- Cambiar de VPS, de base, de túnel, de Access o de respaldo.
- Trabajar sin conexión más allá de lo que haga 073.

## Opciones y costo

Base para estimar: la Medición de Foundry. Rumbo v1 entera costó 10,8 M de tokens (059); el color principal, 13,4 M
(066); volver un gasto deuda, 10,0 M (063); publicarlo en `jviscafe.com`, 121,7 M (068). Una reescritura por capas
crece entre dos y tres veces en código (lo midió Strata) y aquí cada trabajo de dinero lleva revisor en Opus.

| | A. De una vez | **B. Por etapas (recomendada)** | C. Pantalla por pantalla |
| --- | --- | --- | --- |
| Cómo | Un solo trabajo construye todo y hace el corte | Dominio y pruebas primero, luego servidor, pantallas y corte, cada uno con su PR | Cada pantalla de React reemplaza a la de la v1 en producción, una por una |
| Trabajos | 1 Crisol | 6 (1 Chispa, 5 Crisol) | 9 a 11 |
| Sesiones | 4 a 6, seguidas | 8 a 10 | 12 a 15 |
| Tokens | 120 a 200 M | 155 a 240 M | 250 a 350 M |
| Riesgo | Alto: un PR de miles de líneas que el revisor no alcanza a ensayar en 2 vueltas; nada se usa hasta el final; si se corta la sesión, se pierde el hilo | Bajo a medio: cada PR se revisa entero; el dominio se compara con la v1 antes de dibujar una pantalla; la v1 sigue en producción hasta el corte | Medio a alto: v1 y v2 tocan los mismos datos a la vez, así que hay que pasar a centavos al principio y cambiar el dinero de la v1 para que los lea, o traducir en cada pantalla; dos interfaces conviviendo |
| Tu tiempo | 1 sí de merge, 1 de corte; muchas pruebas al final | 6 sí de merge, 1 de corte, 2 pruebas en el teléfono | 10 o más sí de merge y de publicar |
| Infraestructura | Igual | Igual + ambiente de prueba (256 MiB) mientras dure | Igual |
| Cuándo ves algo | Al final | En el ambiente de prueba desde el trabajo 078 | Desde la primera pantalla |

Costo de infraestructura en las tres: **0 USD**. El VPS, Cloudflare (túnel y Access hasta 50 personas), B2 (dentro de
los 10 GB gratis) y healthchecks.io no cambian. El repo es privado: GitHub da 2.000 minutos de Actions al mes; hoy se
usan unos 3 por PR y con Playwright y Lighthouse serán unos 12, así que con 80 corridas al mes se gastan unos 1.000
minutos. Si algún mes se pasa, el minuto extra cuesta menos de 1 centavo de dólar.

Referencia, sin cumplir el pedido: mejorar la v1 en su lugar (centavos, Playwright y Lighthouse, sin React ni
TypeScript ni capas) serían 2 o 3 trabajos y 50 a 80 M. Se descarta porque no es lo que se pidió.

**Recomendación: B.** Es la única en la que el riesgo de dinero queda aislado en un PR que se puede revisar entero
(076) y probar contra la v1 antes de que exista una pantalla nueva. Cuesta poco más que A y bastante menos que C.

## Trabajos de la opción B

Van uno tras otro: cada uno usa lo del anterior, y Foundry permite un solo Crisol a la vez por repo. Empiezan cuando
072 y 073 estén mergeados o descartados.

| Nº | Trabajo | Nivel | Por qué ese nivel | Sesiones | Tokens |
| --- | --- | --- | --- | --- | --- |
| 075 | Base del proyecto: monorepo, capas, CI con Playwright y Lighthouse sobre una página vacía | Chispa | Cambia cómo se prueba y publica, no el dinero ni los datos | 1 | 10–15 M |
| 076 | Dominio en centavos: todas las reglas, sus pruebas y la comparación con la v1 | **Crisol** | Dinero | 2 | 35–50 M |
| 077 | Contratos y servidor en TypeScript con validación compartida | **Crisol** | Datos guardados y permisos | 1 | 20–30 M |
| 078 | Pantallas I: Rumbo, Hoy, Por confirmar, anotar y Movimientos; ambiente de prueba | **Crisol** | Pantallas críticas (Hoy, anotar) | 2 | 35–55 M |
| 079 | Pantallas II: Desglose, Plan, deudas, metas, categorías, Ajustes, empezar y respaldo | **Crisol** | Pantallas de dinero y respaldo | 2 | 35–55 M |
| 080 | Migración a centavos y corte en `rumbo.jviscafe.com` | **Crisol** | Migración de datos | 1 + publicar | 20–35 M |

## Decisions

### Stack

- **Frontend:** React 18.3.1, TypeScript 5.9.3 y Vite 7.3.8, las versiones de Strata, para que lo aprendido en uno
  sirva en el otro. Se descartó Preact (menos herramientas) y seguir sin compilar (las capas dependerían de
  disciplina). La gráfica sigue siendo SVG propio, sin librería de gráficos: hoy es poco código y así se ve igual.
- **Validación:** Zod 4, en el paquete de contratos, que usan la página y el servidor. Se eligió frente a escribir los
  validadores a mano (dos copias que se separan) y frente a JSON Schema con Ajv (los tipos de TypeScript saldrían de
  otro paso). Costo: unos 15 KB comprimidos más en la página.
- **Servidor:** TypeScript sobre `node:http`, como hoy, sin framework: son 6 rutas y ya están probadas. Se compila con
  `tsc` en la imagen de Docker; no se usa el borrado de tipos de Node porque todavía tiene partes experimentales (mismo
  motivo que descartó `node:sqlite`, decisión 45). Sigue con `pg` y Postgres 17.
- **Pruebas:** Vitest para dominio, aplicación y servidor; Vitest con Testing Library y jsdom para componentes;
  Playwright (Chromium y WebKit, porque Joaquín usa iPhone) para punta a punta; Lighthouse CI para rendimiento y
  accesibilidad; dependency-cruiser para las capas.
- **Monorepo con workspaces de npm**, sin herramientas extra:

```
paquetes/dominio/      1 · Dominio: dinero (centavos), fechas, entidades y reglas puras. Sin dependencias.
paquetes/contratos/    3 · Contratos: esquemas Zod de cada documento y de la API, tipos y códigos de error.
app/src/aplicacion/    2 · Casos de uso (anotar, confirmar un fijo, pagar…), consultas (Hoy, Desglose…) y puertos.
app/src/infraestructura/ 4 · Almacenes: servidor (cola de DAT-07), artifact, navegador y memoria para pruebas.
app/src/presentacion/  5 · Modelos de vista sin React y, aparte, los componentes de React.
app/src/composicion/   6 · El único lugar que conecta todo y elige el almacén.
servidor/src/          Servidor: Access, rutas, base. Usa contratos para validar.
migracion/             Paso de v1 a centavos y de vuelta, y el verificador.
pruebas/v1/            La v1 congelada (index.html y sus pruebas): el oráculo contra el que se compara.
e2e/                   Playwright y Lighthouse.
```

### Capas

Las seis de Strata, con la misma regla: las dependencias apuntan solo hacia adentro, la presentación solo conoce los
contratos, los modelos de vista no importan React y nadie importa la composición. dependency-cruiser lo comprueba en
el CI. Los casos de uso devuelven un resultado tipado (`{ok: true, datos}` o `{ok: false, codigo}`) y la pantalla elige
el texto de cada código, así TypeScript obliga a atender cada error (por ejemplo `mas-que-el-saldo` de DEU-10).

### Módulo de dinero

- `Centavos` es un entero con marca de tipo (`number & {__centavos}`): TypeScript no deja sumar centavos con una tasa ni
  con un decimal suelto. Un `Monto` lleva centavos y moneda (`BOB` o `USD`); sumar montos de monedas distintas no
  compila.
- Se usa `number` y no `bigint`: los enteros son exactos hasta 9 billones de bolivianos, y `number` pasa a JSON sin
  traducir. Cada operación comprueba `Number.isSafeInteger`.
- Operaciones: sumar, restar, multiplicar por una tasa con redondeo (`porTasa(c, tasa)`), convertir con un tipo de
  cambio (`aBs(m, tc)`), dividir en partes (`repartir`) y leer y mostrar (`leer('1.500,50')`, `mostrar(c, decimales)`).
  Solo `porTasa`, `aBs` y las divisiones redondean, y lo hacen como la v1: a centavo, la mitad hacia arriba en valor
  absoluto (FMT-05).
- Hechos exactos y estimaciones aparte: saldos, deudas, patrimonio, Hoy, topes y Desglose son centavos exactos; ritmo,
  proyección y «¿Y si…?» son estimaciones que parten de centavos, calculan con decimales y se redondean al mostrar.
  Así la proyección (interés compuesto e inflación) da los mismos números que hoy.

### Inventario de reglas de dinero

Cada requirement se vuelve una prueba de Vitest nombrada con su ID, con los números de sus escenarios en centavos, y
entra en la comparación con la v1. «Exacto» quiere decir que la v2 da el mismo número al centavo; «≤ 1 c» que puede
diferir en un centavo por cada redondeo, que no cambia lo que se muestra.

| ID | Regla | En centavos | Comparación con v1 |
| --- | --- | --- | --- |
| FMT-01, 02, 04 | «Bs 1.234,50», «US$ 1.234,50», decimales según dónde | `mostrar(c, 2)` y `mostrar(c, 0)` | Mismo texto, salvo el saldo de cada cuenta, que la v2 muestra con 2 decimales (decisión 63) |
| FMT-03 | Leer lo escrito | `leer` devuelve centavos o el error `mas-de-2-decimales` | Mismo valor × 100 |
| FMT-05 | Dinero en centavos | Tipo `Centavos` en todo el dominio | — |
| CTA-02 | Saldo = inicial + movimientos | Suma de enteros | Exacto |
| CTA-03 | Cuadrar | Ajuste = real − calculado, en centavos | Exacto |
| CTA-04, 06, AJU-04 | Tipo de cambio | Sigue decimal; el del cambio real = Bs ÷ US$ redondeado a 2 decimales | Exacto |
| CTA-05 | Patrimonio | Cuentas en Bs (USD con `aBs`) + te deben − deudas | ≤ 1 c por cuenta o deuda en US$ |
| CTA-07 | Movimiento antes de la apertura | Igual que hoy, sin dinero nuevo | Exacto |
| CTA-08 | Archivar en cero | Saldo `=== 0` (hoy compara un decimal redondeado) | Exacto |
| DEU-02, 05 | Interés y capital de un pago | Interés = `porTasa(saldo, tasa ÷ 12)`; capital = pago − interés | Exacto (21467 / 68533) |
| DEU-03, 07, 09 | Pagar, cobrar, prestar, recibir, cerrar | Sumas y restas de enteros | Exacto |
| DEU-04 | Fin del préstamo e interés total | `amortizar` en centavos fila por fila | Exacto (oct 2028, Bs 2.744) |
| DEU-06 | Misma moneda | Monto con moneda: no compila mezclar | — |
| DEU-08 | Interés de una cuota saltada | `porTasa` | Exacto |
| DEU-10 | Pago hasta saldo + interés | Comparación de enteros | Exacto |
| DEU-11, 12 | Gasto que te deben y devolverlo | `repartir` sin perder un centavo: gasto + préstamo = original | Exacto |
| FIJ-01, 02, 04 a 07 | Fijos, confirmar, cuota | Monto del fijo en centavos; la cuota usa DEU-02 | Exacto |
| HOY-01 | Disponible | Saldos − apartado, USD con `aBs` | ≤ 1 c por cuenta en US$ |
| HOY-02, 04, 05 | Libre | Disponible − fijos por pagar − falta apartar | ≤ 1 c por meta |
| HOY-03 | Monto al día | Libre ÷ días, estimación | Mismo texto |
| MET-02 | Apartado ≤ saldo | Enteros | Exacto |
| MET-03 | Aporte sugerido y lo que falta | (monto − apartado) ÷ meses, redondeado a centavo | ≤ 1 c |
| MET-05 | Vas bien o no alcanza | Neto del ritmo ≥ suma de aportes | Mismo resultado |
| LIM-03, 04, MOV-05 | Topes y avisos | Gastado del mes en centavos; porcentaje como estimación | Exacto / mismo color |
| MOV-03 | Transferencia entre monedas | Dos montos, cada uno en su moneda | Exacto |
| MOV-06 | Tipo de cambio del movimiento | `aBs(monto, m.tc)` | ≤ 1 c por movimiento en US$ |
| DES-01 a 04 | Resumen del mes, cada 100, fuera de tus gastos, intereses | Sumas de centavos; «de cada 100», horas y 10 años como estimación | Exacto / mismo texto |
| IND-01 a 04 | Tasa de ahorro, colchón, neto, deuda total | Estimaciones sobre centavos | Mismo texto |
| AJU-01 | Promedio irregular | Estimación | Mismo texto |
| PRO-01 a 08 | Ritmo, proyección, plata de hoy, préstamos, ¿Y si…? | Estimaciones que parten de centavos | Mismo texto del titular; puntos de la gráfica a menos de Bs 1 |

**Comparación con la v1 (pruebas de equivalencia).** `pruebas/v1/` guarda la v1 congelada. Una prueba genera cientos de
estados al azar (con semilla fija, para repetirlos), con montos de hasta 2 decimales, cuentas en Bs y US$, préstamos,
metas y fijos; los pasa a centavos con la misma función de la migración; calcula todo con la v1 y con la v2, y compara
con las tolerancias de la tabla. Esta misma comparación es la verificación de la migración real (DAT-08).

### Validaciones compartidas

`paquetes/contratos` define con Zod un esquema por documento: cuenta, categoría, cada tipo de movimiento (unión por
`tipo`), fijo, ocurrencia, deuda (unión por `tipo`), meta, apartado y Ajustes. Los montos son `Centavos` (entero
seguro), las fechas `AAAA-MM-DD`, las monedas `BOB | USD`. De ahí salen los tipos de TypeScript. La página valida antes
de encolar una escritura; el servidor valida antes de escribir y responde 400 con el código (`monto-no-entero`,
`falta-categoria`…). Las reglas que necesitan todos los datos (pago hasta el saldo, apartado hasta el saldo) quedan en
el dominio de la página, porque el servidor no calcula saldos. Los esquemas aceptan campos desconocidos y los guardan,
para no perder lo que agregue una versión futura (DAT-05).

### Datos y API

- Tablas nuevas `v2_principal` y `v2_docs`, iguales a las de hoy. Las de la v1 no se tocan: así la v1 nunca ve
  centavos (leería 3550 como Bs 3.550, cien veces más) y volver atrás no depende de deshacer un cambio en su lugar.
  `esquema.sql` sigue solo creciendo.
- API en `/api/v2/…`, con la misma forma que hoy (`docs/<col>/<id>`, `ajustes`, `datos`). El servidor de la v2 no
  responde las rutas de la v1.
- `/salud` de la v2 responde sano solo si la migración de esa base está hecha y verificada (una fila en
  `v2_migracion`). Si no, el despliegue no queda sano y vuelve a la v1 solo (PUB-05).
- Respaldo versión 2 (centavos). Cargar uno de versión 1 lo convierte con la función de la migración (DAT-04).
- En el navegador (sin servidor), la clave de `localStorage` cambia a `rumbo-v2` y la primera carga convierte la de la
  v1 con la misma función.

### CI/CD

`verificar.yml` sigue siendo el único flujo. Trabajos en cada PR:

1. `tipos`: `tsc --noEmit` en todos los paquetes y dependency-cruiser.
2. `unitarias`: Vitest de dominio, contratos, aplicación y componentes, y la comparación con la v1.
3. `servidor`: Vitest del servidor contra un Postgres de servicio, como hoy, y que la imagen de Docker compile.
4. `e2e`: construye la app, levanta el servidor con Postgres y un Access de mentira (un punto de entrada solo para
   pruebas, que no entra en la imagen de producción), y corre Playwright en Chromium y WebKit a 375 px en claro y
   oscuro. Guarda el video y la traza de lo que falle.
5. `lighthouse`: Lighthouse CI sobre la pantalla Rumbo con el ejemplo, en modo teléfono, con los mínimos de PUB-06.
6. `production`: solo con un tag `v*` en `main` y los cinco anteriores en verde, mueve `production`, como hoy.

El despliegue no cambia: el VPS ve `production`, construye la imagen (ahora con un paso que compila la app y el
servidor), saca un respaldo previo, levanta y vuelve atrás si no queda sana.

### Convivencia con la v1

- Hasta el corte, `rumbo.jviscafe.com` es la v1 y recibe solo arreglos. Lo nuevo que se agregue a la v1 se porta a la
  v2 en el trabajo de su pantalla.
- Desde el trabajo 078, un ambiente de prueba en `rumbo-prueba.jviscafe.com` (otro hostname del mismo túnel y otra
  aplicación de Access con el mismo correo), con su propio contenedor de 256 MiB y su propia base en el mismo Postgres,
  cargada con una copia migrada del último respaldo. Con él, los contenedores de las apps suman 1 GiB, el tope de
  PUB-02. Se apaga y se borra al terminar el corte.
- El corte (trabajo 080) es una sesión de publicar: respaldo, migración y verificación de la base real, tag de la v2.

## Risks / Trade-offs

- [Un centavo distinto que nadie nota y se acumula] → La comparación con la v1 corre en cada PR con cientos de estados,
  y la verificación de la migración compara cada saldo antes de usar la v2.
- [Hay montos guardados con más de 2 decimales] → La migración lo detecta y no cambia nada; se decide caso por caso
  con Joaquín. Se puede saber antes con un ensayo sobre el respaldo, sin tocar producción.
- [La v1 recibe cambios mientras se reescribe (072, 073, arreglos)] → La v2 empieza con 072 y 073 terminados; durante
  la reescritura la v1 solo recibe arreglos, y cada arreglo se porta en el mismo PR o en el trabajo de su pantalla.
- [El Access de mentira llega a producción] → Vive en un archivo de entrada aparte que la imagen no copia, y una
  prueba del CI comprueba que la imagen no lo tiene.
- [La página pesa más (React y Zod) y abre más lento en el teléfono] → Lighthouse lo mide en cada PR con un mínimo de
  90; hoy la v1 pesa 161 KB (44 KB comprimida) y la v2 no debería pasar de 100 KB comprimida sin fuentes.
- [Más dependencias que vigilar] → Versiones exactas en `package-lock.json` y `npm ci`; ninguna dependencia nueva en
  el servidor salvo Zod.
- [Rumbo 2 tarda más de lo previsto] → La v1 sigue funcionando; cada trabajo deja algo terminado y probado aunque los
  siguientes se pospongan.
- [Joaquín vuelve a la v1 días después del corte] → La vuelta a decimales es exacta (centavos ÷ 100) y se mantiene
  30 días después del corte; pasado ese plazo, retirar las tablas de la v1 es otro trabajo, con su sí.

## Migration Plan

Lo corre el trabajo 080, con Joaquín corriendo como root cada comando que lo pida.

1. **Ensayo sin producción:** bajar el último respaldo cifrado de B2 a la Mac de Joaquín, restaurarlo en un Postgres
   local y correr `migracion` en modo «solo revisar». Dice cuántos documentos hay por colección, si alguno tiene montos
   con más de 2 decimales o que no son números, y si la verificación cuadra. No muestra montos ni los sube a ningún
   lado: los datos son de Joaquín.
2. **Ambiente de prueba:** cargar esa copia migrada en `rumbo-prueba.jviscafe.com`. Joaquín lo usa unos días y lo
   compara con la v1 (máximo 2 pruebas en el teléfono).
3. **Corte, con su sí:**
   1. Respaldo previo con `deploy/backup.sh` y comprobación con `restore.sh --check`.
   2. `migracion --aplicar`: en una sola transacción lee `principal` y `docs`, convierte, escribe `v2_principal` y
      `v2_docs`, corre la verificación con los dos motores y, si cuadra, anota la fila en `v2_migracion`. Si algo no
      cuadra, la transacción se deshace y no queda nada escrito.
   3. Tag `v2.0.0`: el CI mueve `production` y el VPS despliega la v2. Si no queda sana, vuelve a la v1, que sigue
      leyendo sus tablas intactas.
   4. Comprobar en `rumbo.jviscafe.com` que los saldos, el patrimonio y el libre son los de la v1, y apagar el ambiente
      de prueba.
4. **Vuelta atrás después del corte:** `migracion --volver` escribe en las tablas de la v1 lo que hay en las de la v2
   pasado a decimales (con un respaldo `pre-volver` antes) y se publica el último tag de la v1. Lo anotado en la v2 se
   conserva.

## Open Questions

- El nombre exacto del ambiente de prueba (`rumbo-prueba.jviscafe.com` u otro) se decide en el trabajo 078; no cambia
  nada más.
- Si el ensayo del paso 1 encuentra montos con más de 2 decimales, qué hacer con cada uno lo decide Joaquín en el
  trabajo 080, con la lista a la vista.
