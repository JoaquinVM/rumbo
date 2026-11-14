# Design

## Context

Rumbo es una sola página que guarda con un almacén (`store`): `put`, `del`, `setAj`, `clear` y `reemplazar`. Hoy hay
dos almacenes, la base del artifact y el navegador. El VPS de Akhana (Contabo, 7,8 GiB, sin swap) tiene 6,5 GiB libres.
Akhana es un sistema de dinero en producción y no se toca: `/opt/akhana`, su compose, su túnel, su `.env` y sus scripts
quedan igual.

## Goals / Non-Goals

**Goals:** Rumbo en `rumbo.jviscafe.com`, con datos por correo, respaldo y avisos, aislado de Akhana, publicado por
tag. Copiar los datos del artifact sin perder nada.

**Non-Goals:** inicio de sesión propio, Strata, trabajar sin conexión al abrir la página, tiempo real entre equipos,
cambiar cálculos o la forma de los datos, tocar el artifact.

## Decisions

- **Cloudflare Access en lugar de un inicio de sesión propio.** Access pide el correo y un código de un solo uso. El
  servidor valida el token `Cf-Access-Jwt-Assertion` con las llaves públicas del equipo de Access: firma RS256,
  audiencia de la aplicación, emisor y vencimiento. Así, aunque alguien quite Access por error, la API no responde sin
  token. La persona es el correo del token, en minúsculas. Se descartó un login propio: más código y más riesgo para
  una sola persona.
- **Node 24 sin framework, y `pg` como única dependencia.** Un solo proceso entrega `index.html` (con
  `<meta name="rumbo-api">`, que le dice a la página que use la API) y atiende `/api`. Se descartó SQLite con
  `node:sqlite`, todavía experimental, y se eligió PostgreSQL 17, como en Akhana, porque su respaldo (`pg_dump` y
  `pg_restore --list`) ya está probado en este VPS.
- **Documentos tal cual.** La tabla `docs(persona, col, id, datos jsonb)` guarda cada cuenta, movimiento, etc. Los
  Ajustes van en `principal(persona, datos jsonb)`, con la forma `{aj}` del documento principal del artifact. El servidor solo acepta las colecciones de `COLS`, ids de 1 a 100
  caracteres seguros y cuerpos de hasta 1 MB (10 MB al reemplazar todo). No interpreta montos: la página sigue haciendo
  todas las cuentas. Reemplazar y borrar todo corren en una transacción.
- **API:** `GET /api/datos` (todo), `PUT|DELETE /api/docs/<col>/<id>`, `PUT /api/ajustes`, `PUT /api/datos`
  (reemplazar) y `DELETE /api/datos` (borrar todo). `GET /salud`, sin token, dice si la base contesta:
  lo usa la revisión de salud de Docker y, desde fuera, Access lo protege como al resto.
- **Cola de escrituras en la página.** Las escrituras salen una por una, en orden. Si falla la red o el servidor
  responde 5xx, se reintenta con espera creciente (hasta 30 s) y al volver la conexión. Mientras quede algo, se
  muestra «Hay cambios sin guardar» y `beforeunload` advierte. Un 401, un 403 o una redirección de Access significan
  sesión vencida: la cola se detiene y se pide volver a entrar en otra pestaña (recargar perdería lo pendiente); al
  volver, sigue sola. Cada petición se corta a los 20 s (60 s si lleva o trae todo) para que una red colgada no trabe la
  cola. Al volver a la pestaña, si no hay nada pendiente, se recargan los
  datos para ver lo anotado en otro equipo. Un 4xx distinto no se reintenta, porque repetirlo no lo arregla: se avisa.
- **Red y aislamiento.** La red `apps` (puente `br-apps`) es externa y compartida por las apps y su `cloudflared`. Rumbo
  suma su red `rumbo-interna` (`internal: true`), donde está sola su base. Ningún servicio publica puertos. Todos
  corren sin root (`node`, `postgres`, `nonroot`), con `cap_drop: ALL`, `no-new-privileges` y sin `docker.sock`.
  Topes: base 384 MiB y 0,5 CPU, servidor 256 MiB y 0,5 CPU, túnel 128 MiB y 0,25 CPU, en total 768 MiB. Desde un
  contenedor, el host solo se alcanza por su INPUT, que hoy filtra ufw; `aislamiento.sh` lo comprueba en vez de darlo
  por hecho. Si algo queda alcanzable, se agrega una regla para `br-apps` y no se toca la configuración de Docker,
  porque reiniciarlo cortaría Akhana.
- **Túnel de las apps** con su propio token, en `/opt/apps/tunel`. Su hostname `rumbo.jviscafe.com` apunta a
  `http://rumbo:8080`, el alias del servidor en la red `apps`. La versión de `cloudflared` es la misma de Akhana
  (2026.10.7).
- **En el VPS:** `/opt/apps/rumbo/app` (clon con una deploy key de solo lectura), `/opt/apps/rumbo/.env`, `state/` y
  `/var/backups/apps/rumbo`. Los scripts siguen el patrón de Akhana sin compartir código con él. Las unidades de
  systemd se llaman `rumbo-*`. El despliegue revisa `production` cada 2 minutos y, en cada vuelta, avisa si Rumbo no
  está sano.
- **Respaldo:** `rclone` con su propio archivo de configuración (`/opt/apps/rclone.conf`). Usa una clave de B2 nueva,
  limitada al bucket y al prefijo `apps/`, y un remoto `crypt` propio sobre `apps/rumbo`. Así, aunque se filtre la
  clave de Rumbo, no se pueden leer ni borrar los respaldos de Akhana. Corre a las 03:30 de La Paz, después de los de
  Akhana. Guarda 7 días en el VPS y 60 días en B2.
- **Copia del artifact:** en el artifact se baja el respaldo (DAT-04) y en `rumbo.jviscafe.com` se carga, con la
  confirmación de los conteos. Después se baja el respaldo de la app nueva y se compara campo por campo con el
  primero.

## Risks / Trade-offs

- **Dos lugares con datos:** si Joaquín sigue usando el artifact por costumbre, lo anotado ahí no llega a la base
  nueva. Mitigación: el artifact se deja de usar desde la copia. Poner en el artifact un aviso de «Rumbo se mudó» sería
  otro cambio, que no se hace sin su pedido.
- **Sin conexión al abrir:** si no hay señal, la página no carga (lo mismo pasa con el artifact).
- **Dependencia de Cloudflare:** si Access o el túnel fallan, Rumbo no abre. Los datos siguen en el VPS y en B2.
- **Mismo VPS:** si el VPS cae, caen los dos. Los topes evitan que Rumbo le quite memoria a Akhana.
