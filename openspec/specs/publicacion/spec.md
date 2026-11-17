# publicacion Specification

## Purpose
Dónde corre Rumbo, quién entra, cómo se aísla de Akhana en el mismo VPS, cómo se respalda, cuándo avisa y cómo se publica una versión (`docs/DESPLIEGUE.md`).

## Requirements

### Requirement: PUB-01 Dirección y entrada
El sistema SHALL responder en `https://rumbo.jviscafe.com` a través del túnel de Cloudflare de las apps, sin publicar puertos en el VPS. Solo SHALL entrar quien Cloudflare Access apruebe, con su cuenta de Google o con el código que le llega al correo, y solo los correos aprobados en la política de Access y en `CORREOS_PERMITIDOS`. El servidor MUST rechazar con 401 toda petición a la API sin un token de Access válido (firma, audiencia, emisor y vencimiento) y con 403 la de un correo que no está aprobado.

#### Scenario: Entrar con Google
- **WHEN** Joaquín abre `rumbo.jviscafe.com` y elige entrar con su cuenta de Google
- **THEN** ve Rumbo con sus datos, los mismos que ve cuando entra con el código

#### Scenario: Correo aprobado
- **WHEN** Joaquín abre `rumbo.jviscafe.com` y escribe el código que le llegó a su correo
- **THEN** ve Rumbo con sus datos

#### Scenario: Correo no aprobado
- **WHEN** alguien entra con una cuenta de Google que no está en la lista
- **THEN** Access no lo deja pasar, y si llegara al servidor, este responde 403 sin leer ni escribir nada

#### Scenario: Sin pasar por Access
- **WHEN** una petición llega a la API sin token de Access, o con uno vencido o de otra aplicación
- **THEN** el servidor responde 401 y no lee ni escribe nada

### Requirement: PUB-02 Aislado de Akhana
El sistema SHALL correr en el VPS de Akhana en un proyecto y redes de Docker aparte, con su base solo en una red interna, contenedores sin root, sin acceso a `docker.sock`, sin capacidades de Linux y con topes de memoria y CPU que sumen 1 GiB o menos. Desde la red de las apps MUST NOT poder alcanzarse los contenedores de Akhana ni sus puertos en el servidor, y desplegar, respaldar o fallar Rumbo MUST NOT reiniciar ni cambiar nada de Akhana.

#### Scenario: Probar el aislamiento
- **WHEN** se corre `deploy/aislamiento.sh` en el VPS
- **THEN** desde la red de las apps no se resuelve ni se conecta a ningún contenedor de Akhana ni a sus puertos, y los contenedores de Rumbo muestran usuario sin root, sin `docker.sock` y sus topes

### Requirement: PUB-03 Respaldo
El sistema SHALL respaldar cada día la base de Rumbo, verificar el archivo y subirlo cifrado fuera del VPS, con su propia clave y su propia ruta, distintas de las de Akhana. Una vez por semana SHALL restaurar el último respaldo en una base aparte para comprobar que sirve.

#### Scenario: Respaldo diario
- **WHEN** corre el respaldo de las 03:30 (hora de La Paz)
- **THEN** queda un archivo verificado y cifrado en B2, en la carpeta `rumbo/` del bucket propio de las apps, y healthchecks.io recibe la señal de que salió bien

### Requirement: PUB-04 Avisos
El sistema SHALL avisar por correo, a través de healthchecks.io, si falla el respaldo o la prueba de restauración, si falla un despliegue o si Rumbo no está sano. También SHALL avisar si el VPS deja de mandar señales.

#### Scenario: Rumbo caído
- **WHEN** el servidor de Rumbo deja de responder
- **THEN** en menos de 10 minutos healthchecks.io marca el chequeo en rojo y manda un correo a Joaquín

### Requirement: PUB-05 Publicar una versión
El sistema SHALL publicarse con un tag `vX.Y.Z` en `main`: si el CI pasa, mueve la rama `production`, y el VPS la despliega con un respaldo previo. Si la versión nueva no queda sana, SHALL volver sola a la anterior y avisar. Los pasos SHALL estar en `docs/DESPLIEGUE.md`.

#### Scenario: Versión que no arranca
- **WHEN** se despliega una versión cuyo servidor no queda sano
- **THEN** Rumbo vuelve a la versión anterior con sus datos y healthchecks.io avisa del despliegue fallido

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
