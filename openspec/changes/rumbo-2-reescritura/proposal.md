# Proposal

## Why

Joaquín pidió (trabajo 074): «Rumbo 2, primero solo definirlo: propuesta de OpenSpec para reescribirlo con calidad.
Esto es: frontend React + TypeScript + Vite, como Strata; backend en TypeScript, con validaciones compartidas; dinero
en centavos enteros, en un módulo de dominio con migración de los datos; arquitectura por capas; pruebas unitarias, de
componentes y en navegador real (Playwright) en el CI. Mantener el CI/CD de hoy (pruebas en cada PR, despliegue por
tag con respaldo y vuelta atrás) y sumarle Lighthouse y las pruebas de punta a punta. Muéstrame opciones y costo antes
de construir; no construyas sin mi aprobación.»

La v1 funciona y está en `rumbo.jviscafe.com`, pero todo vive en un `index.html` de 1.667 líneas: los cálculos de
dinero usan decimales de JavaScript redondeados con `r2`, los montos se guardan como decimales (`12.5`), el servidor
guarda cualquier JSON sin mirarlo y las pruebas no abren un navegador. Cada regla nueva toca el mismo archivo y es más
fácil romper una vieja sin notarlo. Este cambio **solo define** Rumbo 2: no construye nada.

## What Changes

- **Lo que ve y hace la persona no cambia.** Las 15 capabilities de `openspec/specs` siguen igual, con sus mismos
  escenarios y los mismos números. Rumbo 2 se acepta cuando todos los escenarios de hoy dan lo mismo, al centavo.
  Hay una sola función nueva, que Joaquín pidió para Rumbo 2 y no llega a la v1 (trabajo 078, decisión 63): ver los
  movimientos de una categoría con su total (MOV-07), también tocándola en el Desglose (DES-05).
- **Dinero en centavos enteros.** Todo monto guardado y todo cálculo de hechos (saldos, deudas, patrimonio, Hoy,
  topes, Desglose) usa centavos enteros, en un módulo de dominio sin dependencias. El tipo de cambio, la inflación, los
  rendimientos y las tasas siguen siendo números con decimales: no son dinero.
- **Migración de los datos guardados** de montos decimales a centavos, con respaldo previo, ensayo con una copia,
  verificación cifra por cifra contra la v1 y vuelta atrás sin pérdida. **BREAKING** para los datos: los 12 campos de
  dinero cambian de tipo (de decimal a entero). Es **Crisol**: toca dinero, cantidades, datos guardados y migración.
- **Frontend** en React + TypeScript + Vite, con las mismas versiones y capas que Strata.
- **Backend** en TypeScript (Node 24), con la misma API y la misma entrada por Cloudflare Access. **Validaciones
  compartidas:** las mismas definiciones validan en la página antes de guardar y en el servidor antes de escribir; el
  servidor deja de guardar «cualquier JSON».
- **Arquitectura por capas** (dominio, aplicación, contratos, infraestructura, presentación, composición), con una
  prueba que impide que una dependencia apunte hacia afuera.
- **Pruebas:** unitarias (Vitest), de componentes (Vitest + Testing Library), del servidor contra Postgres, de
  equivalencia contra el motor de la v1, de punta a punta en navegador real (Playwright, Chromium y WebKit, a 375 px en
  claro y oscuro) y Lighthouse, todas en el CI de cada PR.
- **CI/CD:** se mantiene igual (pruebas en cada PR; un tag `vX.Y.Z` en `main` mueve `production` y el VPS despliega
  con respaldo previo y vuelta atrás) y se le suman Playwright y Lighthouse como condición para publicar.
- **Convivencia con la v1:** la v1 sigue en `rumbo.jviscafe.com` mientras se construye. Rumbo 2 se ensaya en un
  ambiente de prueba con una copia migrada de los datos y reemplaza a la v1 en un corte con su sí.
- **Opciones y costo** de cómo construirlo (de una vez, por etapas o pantalla por pantalla) están en `design.md`, con
  una recomendación: **por etapas**, en 6 trabajos.

## Capabilities

### New Capabilities

Ninguna. La única función nueva para la persona, ver los movimientos de una categoría, cabe en capabilities que ya
existen.

### Modified Capabilities

- `formato`: FMT-03 guarda centavos; nuevo FMT-05, dinero en centavos enteros y cómo se redondea.
- `datos`: DAT-04 respaldo en versión 2 que sigue cargando los de versión 1; nuevos DAT-08 (migración a centavos) y
  DAT-09 (validación compartida en página y servidor).
- `publicacion`: nuevos PUB-06 (Playwright y Lighthouse antes de publicar) y PUB-07 (ambiente de prueba y corte de la
  v1 a Rumbo 2).
- `movimientos`: nuevo MOV-07, ver los movimientos de una categoría con su total, igual al del Desglose.
- `desglose`: nuevo DES-05, tocar una categoría abre sus movimientos del mes.

## Impact

- **Código:** se reemplaza `index.html` por una app de Vite (`app/`) y `servidor/*.mjs` por TypeScript; nacen los
  paquetes compartidos de dominio y contratos. Las pruebas de `pruebas/` se conservan como oráculo de la v1.
- **Datos:** migración única de los documentos de la base de Rumbo (tablas `principal` y `docs`), del respaldo y del
  navegador.
- **Dependencias:** hoy hay una (`pg`). Rumbo 2 suma React, Zod y las herramientas de desarrollo (Vite, TypeScript,
  Vitest, Testing Library, Playwright, Lighthouse CI, dependency-cruiser). Rompe la regla «sin compilación ni
  librerías» de `CLAUDE.md` y `openspec/config.yaml`: al aprobar este cambio, esa regla se reemplaza.
- **Infraestructura:** mismo VPS, mismo túnel, mismo Access, mismo B2; un hostname de prueba más y un contenedor de
  256 MiB mientras dure el ensayo. Sin costo nuevo.
- **Docs:** `CLAUDE.md`, `openspec/config.yaml`, `docs/DOMINIO.md`, `docs/DECISIONES.md`, `docs/DESPLIEGUE.md`; en
  Foundry, la ficha de Rumbo.
- **Trabajos en curso:** 072 (entrar con Google) y 073 (PWA) cambian la v1 ahora; Rumbo 2 los porta y no empieza a
  construirse hasta que estén mergeados o descartados.
