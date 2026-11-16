## ADDED Requirements

### Requirement: PUB-06 Pruebas en navegador real y Lighthouse
El sistema SHALL correr en cada PR, además de las pruebas de hoy, pruebas de punta a punta en navegador real (Chromium y WebKit) contra el servidor de verdad con una base Postgres, a 375 px de ancho en modo claro y oscuro, y una medición de Lighthouse de la pantalla Rumbo en modo teléfono. Las pruebas de punta a punta SHALL cubrir al menos: empezar con mis datos, anotar y editar un gasto, transferir entre monedas, confirmar y saltar un fijo, pagar la cuota de un préstamo, apartar para una meta, descargar y cargar un respaldo, guardar sin señal y la sesión vencida. Lighthouse SHALL exigir al menos 90 en rendimiento y 95 en accesibilidad y en buenas prácticas. Un tag `vX.Y.Z` MUST NOT mover `production` si alguna de estas pruebas falla.

#### Scenario: Una pantalla se rompe en el iPhone
- **WHEN** un PR hace que el formulario de anotar tenga scroll horizontal a 375 px en WebKit
- **THEN** el CI de ese PR queda en rojo y dice qué prueba falló

#### Scenario: Rumbo se vuelve lento
- **WHEN** un cambio hace que Lighthouse dé 82 de rendimiento en la pantalla Rumbo
- **THEN** el CI queda en rojo y un tag sobre ese commit no se publica

### Requirement: PUB-07 Ensayo local y corte a Rumbo 2
El sistema SHALL probarse entero antes del corte sin tocar producción: cada trabajo en el CI, y la migración en la Mac de Joaquín con una copia del último respaldo (DAT-08), sin mostrar montos ni subirlos a ningún lado. Mientras se construye, `rumbo.jviscafe.com` SHALL seguir siendo la v1. El corte SHALL hacerse con el sí de Joaquín: respaldo previo, migración y verificación de la base real, y despliegue de Rumbo 2 en `rumbo.jviscafe.com`. Si Rumbo 2 no queda sano o la verificación no cuadra, SHALL volver sola a la v1 con sus datos, como dice PUB-05.

#### Scenario: Ensayo con una copia
- **WHEN** se migra en la Mac de Joaquín una copia del último respaldo
- **THEN** dice cuántos documentos hay y si la verificación cuadra, sin mostrar montos, y `rumbo.jviscafe.com` no cambia

#### Scenario: Corte que no queda sano
- **WHEN** en el corte Rumbo 2 no responde sano
- **THEN** `rumbo.jviscafe.com` vuelve a la v1 con los datos que tenía antes del corte y healthchecks.io avisa
