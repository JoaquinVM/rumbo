# Despliegue

Cómo corre Rumbo en `https://rumbo.jviscafe.com`, cómo se publica una versión y qué hacer si algo falla. Los
requerimientos están en `openspec/specs/publicacion` (PUB-01 a PUB-05) y `openspec/specs/datos` (DAT-03, DAT-07).

## Cómo está armado

```
Navegador ─► Cloudflare Access (Google o correo + código) ─► túnel «apps» ─► cloudflared ─► red apps ─► rumbo:8080 ─► red interna ─► Postgres
```

- **VPS:** el de Akhana Admin (Contabo, Ubuntu 24.04). Rumbo no comparte nada con Akhana: ni carpeta, ni proyecto de
  Docker, ni red, ni túnel, ni `.env`, ni clave de respaldo. Ningún contenedor publica puertos.
- **Contenedores:** `rumbo-db-1` (Postgres 17, 384 MiB), `rumbo-app-1` (Node 24, 256 MiB) y `apps-tunel-cloudflared-1`
  (128 MiB). Todos corren sin root, sin capacidades de Linux y sin `docker.sock`.
- **Entrada:** se entra con Google o con un código por correo. Cloudflare Access deja pasar solo los correos de su
  política. El servidor valida además el token de Access y la lista `CORREOS_PERMITIDOS`. Cada correo tiene sus propios
  datos.

| En el VPS | Qué es |
| --- | --- |
| `/opt/apps/rumbo/app` | Clon del repo (deploy key de solo lectura, `Host github-rumbo` en `/root/.ssh/config`) |
| `/opt/apps/rumbo/.env` | Secretos de Rumbo (`deploy/.env.example`), 600, root |
| `/opt/apps/rumbo/state` | Versión desplegada y resultado del último despliegue |
| `/opt/apps/tunel/.env` | Token del túnel de las apps (`deploy/tunel/.env.example`), 600, root |
| `/opt/apps/rclone.conf` | rclone propio de las apps: remoto `apps-b2` (clave `rumbo-vps`, `hard_delete`) y remoto cifrado `rumbo-crypt` |
| `/var/backups/apps/rumbo` | Respaldos locales (7 días) |
| `rumbo-deploy.timer` | Cada 2 minutos: despliega si `production` cambió y avisa si algo no está sano |
| `rumbo-backup.timer` | Todos los días a las 03:30 de La Paz, después de los de Akhana |
| `rumbo-restore-check.timer` | Los domingos a las 04:30: restaura el último respaldo en una base aparte |

Los secretos (`.env` de Rumbo y del túnel, y las dos claves de `rumbo-crypt`) se guardan también en el gestor de
contraseñas. Sin las claves de crypt, los respaldos de B2 no se pueden abrir.

## Publicar una versión

1. El cambio entra a `main` por PR, con el CI en verde.
2. Joaquín da el sí para publicar. Se crea el tag en `main`: `git tag v1.2.3 && git push origin v1.2.3`.
3. El CI vuelve a probar ese commit y, si pasa, mueve la rama `production` a él.
4. En 2 minutos o menos, `rumbo-deploy.timer` lo ve y corre `deploy/deploy.sh`. El script construye la imagen nueva
   mientras la actual sigue atendiendo, saca un respaldo previo, levanta la versión nueva y espera a que quede sana.
5. Si no queda sana, vuelve sola a la anterior y healthchecks.io avisa. La versión fallida no se reintenta.

Para seguirlo, la persona que tenga acceso de root corre `journalctl -u rumbo-deploy -f`.

## Volver atrás

- **A una versión anterior:** en GitHub, Actions > verificar > Run workflow, con el tag anterior. Se prueba de nuevo y
  se despliega como cualquier versión.
- **Si ni la anterior queda sana:** como root, `cd /opt/apps/rumbo/app && git checkout <tag> && deploy/deploy.sh
  --no-pull`, y leer `docker compose -p rumbo -f deploy/docker-compose.yml logs app`.
- **Datos:** el esquema solo crece (`servidor/esquema.sql`), así que volver de versión no necesita restaurar. Si hay
  que hacerlo: `deploy/restore.sh --replace /var/backups/apps/rumbo/<archivo> --yes`. Antes de reemplazar, saca un
  respaldo `pre-restore`.

## Respaldo y avisos

- `backup.sh` saca el respaldo con `pg_dump` y lo verifica con `pg_restore --list`. Después lo sube cifrado a
  `rumbo-crypt:`, que en B2 es la carpeta `rumbo/` del bucket `jviscafe-apps-respaldos`, y borra lo que tenga más de 60 días allá y más de 7 en el VPS.
- Las apps tienen **su propio bucket** (`jviscafe-apps-respaldos`, privado), aparte de `akhana-respaldos-jvm`: así sus
  archivos nunca aparecen en los listados de los scripts de Akhana. La clave `rumbo-vps` solo puede usar ese bucket y la
  carpeta `rumbo/`: no puede leer ni borrar los respaldos de Akhana ni los de otra app.
- Hay 3 chequeos en healthchecks.io: `rumbo-backup` (diario, 2 h de gracia), `rumbo-restore` (semanal, 1 día de gracia)
  y `rumbo-deploy` (2 minutos, 10 de gracia). `rumbo-deploy` se pone en rojo si falló el último despliegue, si Rumbo
  no está sano o si el túnel no está conectado. Si el VPS deja de mandar señales, también avisa.
- Para abrir un respaldo en la Mac, sin pasar por el VPS: configurar rclone con la clave de B2 y las dos claves de
  crypt del gestor, bajar el archivo y restaurarlo con `pg_restore` en un Postgres local.

## Aislamiento

`deploy/aislamiento.sh`, corrido como root, no cambia nada y termina con «todo bien» o con la lista de fallas.
Comprueba que:
- desde la red `apps` no se resuelven ni responden los contenedores de Akhana;
- el servidor no responde en los puertos de Akhana (8081, 443, 80, 5432 y 8080);
- los contenedores de Rumbo y del túnel cumplen sus límites.

Muestra también cuándo arrancaron los contenedores de Akhana, para comparar antes y después de tocar algo. Correrlo
después de cada cambio de infraestructura.

Nada de esto reinicia Docker ni toca `/opt/akhana`, ufw ni las unidades de Akhana. Si `aislamiento.sh` encuentra algo
alcanzable, se agrega una regla de firewall para el puente `br-apps`; la configuración de Docker no se toca, porque
reiniciarlo cortaría Akhana.

## Puesta en marcha (una sola vez)

Cada comando de root lo corre Joaquín, uno por uno.

1. **Cloudflare, Zero Trust:**
   - Elegir el nombre del equipo, que va en `ACCESS_TEAM`.
   - Activar el inicio con código por correo (*One-time PIN*) y con Google (ver «Entrar con Google»).
   - Crear la aplicación *self-hosted* `rumbo.jviscafe.com`, con una política *Allow* para los correos aprobados y
     una sesión de 1 mes. Su *AUD* va en `ACCESS_AUD`.
2. **Cloudflare, túnel `apps`:** en Networks > Tunnels, crear el túnel `apps`, con el hostname público
   `rumbo.jviscafe.com` → `http://rumbo:8080`. Su token va en `/opt/apps/tunel/.env`.
3. **B2:** crear el bucket privado `jviscafe-apps-respaldos` y la clave `rumbo-vps`, limitada a ese bucket, con lectura y
   escritura y el prefijo `rumbo/`. La clave secreta se muestra una sola vez: va directo al VPS en el paso 5.
4. **healthchecks.io:** crear los 3 chequeos de arriba.
5. **En el VPS:**
   1. Como el repo todavía no está en el VPS, copiar el script desde la Mac:
      `scp deploy/setup.sh root@akhana:/root/rumbo-setup.sh`.
   2. `bash /root/rumbo-setup.sh llave`. La llave que imprime va a GitHub > `JoaquinVM/rumbo` > Deploy keys, sin
      escritura.
   3. `bash /root/rumbo-setup.sh base`.
   4. Completar los dos `.env`.
   5. Configurar `/opt/apps/rclone.conf`: un remoto `apps-b2` (b2, la clave `rumbo-vps`, `hard_delete=true`) y un remoto
      `crypt` llamado `rumbo-crypt` sobre `apps-b2:jviscafe-apps-respaldos/rumbo`, con dos claves generadas en el VPS
      (`rclone config create … --obscure`). Las claves de crypt se guardan en el gestor de contraseñas y se borra
      cualquier copia suelta del VPS.
6. **Levantar el túnel:** `docker compose -p apps-tunel -f /opt/apps/rumbo/app/deploy/tunel/docker-compose.yml
   --env-file /opt/apps/tunel/.env up -d`.
7. **Primer despliegue:** `/opt/apps/rumbo/app/deploy/deploy.sh --ref production`, o `--ref <tag>`.
8. **Comprobar:**
   1. `deploy/aislamiento.sh`;
   2. `deploy/backup.sh` y `deploy/restore.sh --check latest`;
   3. abrir `https://rumbo.jviscafe.com`.
9. **Activar los timers:** `setup.sh activar`.
10. **Copiar los datos del artifact:**
    1. En el artifact, ir a Ajustes > Descargar respaldo.
    2. En `rumbo.jviscafe.com`, ir a Ajustes > Cargar respaldo, revisar los conteos y confirmar.
    3. Bajar el respaldo de la app nueva y compararlo con el primero, campo por campo.
    4. Desde ahí, el artifact se deja de usar.

## Entrar con Google

1. **Google Cloud** (console.cloud.google.com): en un proyecto propio, configurar la pantalla de consentimiento
   (externa) y crear un cliente OAuth de tipo *Aplicación web* con la redirección
   `https://empty-truth-cd43.cloudflareaccess.com/cdn-cgi/access/callback`.
2. **Zero Trust > Integrations > Identity providers:** agregar Google con el *Client ID* y el *Client secret* de ese
   cliente y probarlo con *Test*. El secreto se guarda en el gestor de contraseñas.
3. **Access > Applications > Rumbo > Authentication:** con *Accept all available identity providers* entran Google y
   el código; *Instant Auth* apagado, para que se pueda elegir.

La app de Google («Rumbo Access») queda en modo *Prueba*: solo entran las cuentas que estén en *Público > Usuarios de
prueba*. Cada correo nuevo se agrega también ahí.

El correo de Google es el mismo con el que se entra con código, así que se ven los mismos datos.

## Sumar o quitar un correo

Tiene que estar en los tres lados: si falta en uno, no entra.

1. **Google Cloud**, proyecto «Rumbo Access» > *Público > Usuarios de prueba*: agregar el correo (solo para entrar con
   Google).
2. **Access > Applications > Rumbo > Policies:** agregar el correo a la política *Allow*.
3. **En el VPS**, como root: agregarlo a `CORREOS_PERMITIDOS` en `/opt/apps/rumbo/.env` (separados por comas) y recrear
   solo el contenedor de la app, que no toca la base ni Akhana:
   `docker compose -p rumbo -f /opt/apps/rumbo/app/deploy/docker-compose.yml --env-file /opt/apps/rumbo/.env up -d --no-build app`.
4. Si la persona venía del artifact: ella baja su respaldo en el artifact (Ajustes > Descargar respaldo) y lo carga en
   `rumbo.jviscafe.com` (Ajustes > Cargar respaldo), revisando los conteos antes de confirmar.

## Ensayo en la Mac

Con Docker Desktop, sin tocar el VPS:
- `deploy/deploy.sh --no-pull`, desde un clon aparte y con `RUMBO_DIR`, `ENV_FILE`, `BACKUP_DIR` y `RCLONE_CONFIG`
  apuntando a una carpeta temporal y a un remoto `crypt` local.
- `pruebas/ensayo-servidor.mjs` levanta el servidor con un Access de mentira. Sirve para probar en el navegador la
  falta de señal y la sesión vencida.
- `aislamiento.sh` necesita bash 5: en la Mac se corre dentro de un contenedor `docker:cli`.
