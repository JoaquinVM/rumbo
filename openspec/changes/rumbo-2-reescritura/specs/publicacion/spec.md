## ADDED Requirements

### Requirement: PUB-06 Pruebas en navegador real y Lighthouse
El sistema SHALL correr en cada PR, además de las pruebas de hoy, pruebas de punta a punta en navegador real (Chromium y WebKit) contra el servidor de verdad con una base Postgres, a 375 px de ancho en modo claro y oscuro, y una medición de Lighthouse de la pantalla Rumbo en modo teléfono. Las pruebas de punta a punta SHALL cubrir al menos: empezar con mis datos, anotar y editar un gasto, transferir entre monedas, confirmar y saltar un fijo, pagar la cuota de un préstamo, apartar para una meta, descargar y cargar un respaldo, guardar sin señal y la sesión vencida. Lighthouse SHALL exigir al menos 90 en rendimiento y 95 en accesibilidad y en buenas prácticas. Un tag `vX.Y.Z` MUST NOT mover `production` si alguna de estas pruebas falla.

#### Scenario: Una pantalla se rompe en el iPhone
- **WHEN** un PR hace que el formulario de anotar tenga scroll horizontal a 375 px en WebKit
- **THEN** el CI de ese PR queda en rojo y dice qué prueba falló

#### Scenario: Rumbo se vuelve lento
- **WHEN** un cambio hace que Lighthouse dé 82 de rendimiento en la pantalla Rumbo
- **THEN** el CI queda en rojo y un tag sobre ese commit no se publica

### Requirement: PUB-07 Ambiente de prueba y corte a Rumbo 2
El sistema SHALL ofrecer, mientras se construye Rumbo 2, un ambiente de prueba en su propio hostname de `jviscafe.com`, detrás de Cloudflare Access con el mismo correo, con su propia base y una copia migrada de los datos (DAT-08), sin tocar la base ni la versión de `rumbo.jviscafe.com`. El corte SHALL hacerse con el sí de Joaquín: respaldo previo, migración y verificación de la base real, y despliegue de Rumbo 2 en `rumbo.jviscafe.com`. Si Rumbo 2 no queda sano o la verificación no cuadra, SHALL volver sola a la v1 con sus datos, como dice PUB-05. Al terminar el corte, el ambiente de prueba SHALL apagarse y su copia de los datos borrarse.

#### Scenario: Ensayo con una copia
- **WHEN** Joaquín abre el ambiente de prueba y anota un gasto de Bs 50
- **THEN** el gasto queda en la base de prueba y `rumbo.jviscafe.com` sigue sin ese gasto

#### Scenario: Corte que no queda sano
- **WHEN** en el corte Rumbo 2 no responde sano
- **THEN** `rumbo.jviscafe.com` vuelve a la v1 con los datos que tenía antes del corte y healthchecks.io avisa
