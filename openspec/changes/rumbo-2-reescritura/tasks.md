# Tasks

Plan de la opción B de `design.md`. Nada se construye hasta que Joaquín apruebe este cambio y la opción. Cada grupo es
un trabajo de Foundry con su rama, su PR y su nivel; ninguno empieza antes de que 072 y 073 estén mergeados o
descartados, salvo el 075, que empezó antes por pedido de Joaquín (decisión 52). Las pruebas de dinero viven en Vitest,
nombradas con el ID del requirement; las de la v1 (`pruebas/verificar.mjs`) quedan como oráculo en `pruebas/v1/`.

## 1. Trabajo 075 · Base del proyecto y CI (Chispa)

- [x] 1.1 Workspaces de npm (`paquetes/dominio`, `paquetes/contratos`, `app`, `servidor`, `migracion`, `e2e`) con React 18.3.1, TypeScript 5.9.3, Vite 7.3.8, Vitest 4.1.12, Zod 4 y dependency-cruiser 17.4.3 en versiones exactas; `npm ci && npm run tipos` pasa.
- [x] 1.2 Reglas de capas de dependency-cruiser como las de Strata, con una prueba que falla si la presentación importa el dominio; `npm run capas` en verde y en rojo con un import prohibido de prueba.
- [x] 1.3 Mover la v1 congelada a `pruebas/v1/` con sus pruebas y un ayudante que carga su motor en Node; `npm run verificar` sigue en verde y la v1 de producción no cambia.
- [x] 1.4 `verificar.yml` con los trabajos `tipos`, `unitarias`, `servidor`, `e2e` (Playwright en Chromium y WebKit a 375 px, claro y oscuro, contra un servidor con Postgres y Access de mentira) y `lighthouse` (mínimos de PUB-06), sobre una página vacía de la v2; `production` exige los cinco. Verificado con un PR en verde y otro, de prueba, en rojo por Lighthouse.
- [x] 1.5 Actualizar `CLAUDE.md`, `openspec/config.yaml` (stack y reglas de pruebas y de publicar) y `docs/DECISIONES.md` con lo que aprobó Joaquín.

## 2. Trabajo 077 · Dominio en centavos (Crisol)

- [x] 2.1 Documento Crisol `trabajos/077-rumbo-2-dominio.md` en Foundry con el pedido, cada regla del inventario de `design.md` y su prueba.
- [x] 2.2 Módulo de dinero: `Centavos`, `Monto`, `leer`, `mostrar`, `porTasa`, `aBs`, `repartir`, con pruebas FMT-01 a FMT-05 (incluido «Usa hasta 2 decimales» y «12,345» como miles).
- [x] 2.3 Cuentas, tipo de cambio y patrimonio: pruebas CTA-02 a CTA-08 y AJU-04 con los números de sus escenarios en centavos.
- [x] 2.4 Deudas: amortización, pagos, cobros, préstamos, cuota saltada, cierre, gasto que te deben y devolverlo; pruebas DEU-01 a DEU-12.
- [x] 2.5 Fijos y ocurrencias, Hoy y metas; pruebas FIJ-01 a FIJ-07, HOY-01 a HOY-05 y MET-01 a MET-05.
- [x] 2.6 Movimientos, topes, Desglose e indicadores; pruebas MOV-02 a MOV-06, LIM-03, LIM-04, DES-01 a DES-04 e IND-01 a IND-04.
- [x] 2.7 Ritmo, proyección y «¿Y si…?»; pruebas AJU-01, PRO-01 a PRO-08.
- [x] 2.8 Función de conversión v1 → centavos y vuelta (DAT-08), con pruebas: los 12 campos, la tasa de una deuda intacta, rechazo de más de 2 decimales y ida y vuelta exacta.
- [x] 2.9 Comparación con la v1: generador de estados con semilla y comparación con las tolerancias de `design.md`; corre en `unitarias` y falla si una regla cambia.
- [ ] 2.10 Revisor Crisol en Opus; CI en verde; sí de Joaquín para el merge.

## 3. Trabajo 077 · Contratos y servidor en TypeScript (Crisol)

- [ ] 3.1 Esquemas Zod de cada documento y de la API en `paquetes/contratos`, con pruebas DAT-09 (monto decimal rechazado, gasto sin categoría, campos desconocidos conservados).
- [ ] 3.2 Servidor en TypeScript: Access (PUB-01), tablas `v2_*`, rutas `/api/v2`, validación con los contratos, `/salud` que exige la migración; las pruebas de `servidor.test.mjs` portadas y en verde contra Postgres.
- [ ] 3.3 Imagen de Docker de varias etapas sin root, sin el Access de mentira (prueba que lo comprueba); el compose y los topes de PUB-02 no cambian.
- [ ] 3.4 Revisor Crisol en Opus; CI en verde; sí de Joaquín para el merge.

## 4. Trabajo 078 · Pantallas I y ambiente de prueba (Crisol)

- [ ] 4.1 Aplicación e infraestructura: casos de uso de anotar, editar, borrar, transferir, confirmar y saltar un fijo; almacenes servidor (cola de DAT-07), artifact, navegador y memoria; pruebas de la cola (orden, reintento, 401).
- [ ] 4.2 Pantalla Rumbo (titular, gráfica, Hoy, Por confirmar, avisos, indicadores, ¿Y si…?) según los mockups de `docs/DISENO.md`; pruebas de componentes y Playwright a 375 px en claro y oscuro.
- [ ] 4.3 Anotar y Movimientos (MOV-01 a MOV-06) según los mockups, con el saldo de cada cuenta en dos decimales en los botones para elegirla (FMT-02, decisión 63); pruebas de componentes y Playwright: anotar y editar un gasto, transferir entre monedas, confirmar y saltar un fijo, sin señal y sesión vencida.
- [ ] 4.4 Ambiente de prueba (PUB-07): hostname y aplicación de Access (los crea Joaquín), contenedor y base aparte, carga de una copia migrada del respaldo; comprobar que `rumbo.jviscafe.com` no cambia y correr `deploy/aislamiento.sh`.
- [ ] 4.5 Revisor Crisol en Opus que ensaya en el ambiente de prueba; CI en verde; sí de Joaquín para el merge.

## 5. Trabajo 079 · Pantallas II (Crisol)

- [ ] 5.1 Desglose (DES-01 a DES-04) según los mockups; pruebas de componentes y Playwright a 375 px en claro y oscuro.
- [ ] 5.2 Plan, detalle del préstamo y de la meta, categorías y topes (PAN-03, PAN-07 a PAN-09) según los mockups, con el saldo de cada cuenta en dos decimales y los totales sin decimales (FMT-02, FMT-04, CTA-01, decisión 63); Playwright: pagar una cuota y apartar para una meta.
- [ ] 5.3 Ajustes, color principal, empezar con mis datos, ejemplo, borrar todo y respaldo versión 2 que carga los de versión 1 (AJU, DAT-01, DAT-02, DAT-04, DAT-06); Playwright: empezar, descargar y cargar un respaldo, cargar uno de la v1.
- [ ] 5.4 Lo que agreguen 072 y 073 a la v1, portado y probado igual que en la v1.
- [ ] 5.5 Revisor Crisol en Opus que ensaya en el ambiente de prueba; CI en verde; sí de Joaquín para el merge; Joaquín prueba en su teléfono (máximo 2 pruebas).

## 6. Trabajo 080 · Migración y corte (Crisol)

- [ ] 6.1 `migracion` con los modos «solo revisar», `--aplicar` (una transacción, verificación con los dos motores, fila en `v2_migracion`) y `--volver`; pruebas contra Postgres: migración que cuadra, monto con 3 decimales que no cambia nada, verificación que no cuadra que deshace todo, ida y vuelta con un gasto anotado después.
- [ ] 6.2 Ensayo en la Mac de Joaquín con el último respaldo de B2 en modo «solo revisar»; resultado sin montos. Si hay montos raros, Joaquín decide cada uno.
- [ ] 6.3 `docs/DESPLIEGUE.md` y `docs/DOMINIO.md` con el corte, la vuelta atrás y los montos en centavos.
- [ ] 6.4 Revisor Crisol en Opus; CI en verde; sí de Joaquín para el merge.
- [ ] 6.5 Sesión de publicar, con el sí de Joaquín: respaldo previo, `migracion --aplicar`, tag `v2.0.0`, comprobar en `rumbo.jviscafe.com` los saldos, el patrimonio y el libre, apagar y borrar el ambiente de prueba, y archivar este cambio (`openspec archive rumbo-2-reescritura`).
