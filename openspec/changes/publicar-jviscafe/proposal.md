# Proposal

## Why

Joaquín quiere usar Rumbo en su dominio: «quiero deployar Rumbo y Strata en mi dominio `jviscafe.com`, reutilizando
el VPS de Akhana» y «primero deploya rumbo nomas» (trabajo 068). Fuera de claude.ai no existe la base del artifact,
así que Rumbo necesita un servidor y una base propios. Aprobó `rumbo.jviscafe.com`, la entrada con Cloudflare Access y
la copia de los datos del artifact.

## What Changes

- **Dirección nueva:** `https://rumbo.jviscafe.com`. El VPS de Akhana la sirve por un túnel de Cloudflare propio de las
  apps, sin abrir puertos.
- **Entrada:** Cloudflare Access pide el correo y un código. Solo entran los correos que Joaquín apruebe, y Rumbo no
  construye inicio de sesión. Cada correo tiene sus propios datos.
- **Servidor propio** (`servidor/`): Node, que entrega `index.html` y una API de guardado. La base es PostgreSQL,
  propia de Rumbo. Es lo primero de Rumbo que no es solo la página: cambia el stack del `config.yaml` («nunca hay
  servidor propio») y suma una dependencia de npm (`pg`), solo en el servidor. La página sigue sin librerías ni
  compilación.
- **La página elige dónde guardar:** en el artifact, la base del artifact, como hoy; servida por el servidor, la API;
  sin ninguna de las dos, el navegador, como hoy. El artifact sigue funcionando, pero se deja de usar.
- **Guardado pendiente:** si una escritura no llega, se reintenta en orden, la pantalla lo avisa y no se puede cerrar
  sin advertencia. Si venció la sesión de Access, se pide recargar.
- **Aislado de Akhana:** proyecto y redes de Docker aparte, sin root, sin `docker.sock` y con topes de memoria y CPU.
  Se usa un segundo túnel solo para las apps. No se toca nada de `/opt/akhana`.
- **Respaldo** diario cifrado en B2 con clave y ruta propias, una prueba semanal de restauración y avisos en
  healthchecks.io si falla el respaldo, el despliegue o la salud de Rumbo.
- **Publicar:** un tag `vX.Y.Z` en `main` con el CI en verde mueve la rama `production`, y el VPS la despliega con un
  respaldo previo y vuelta atrás.
- **Datos:** no se renombra, borra ni cambia de tipo ningún campo. Cada documento se guarda tal cual, como JSON. La
  copia desde el artifact usa el respaldo de hoy (DAT-04) y se verifica campo por campo. Es **Crisol** por datos.

## Capabilities

### New Capabilities

- `publicacion`: PUB-01 a PUB-05, dónde corre Rumbo, quién entra, aislamiento, respaldo, avisos y cómo se publica.

### Modified Capabilities

- `datos`: DAT-03 suma el servidor propio; nuevo DAT-07, guardado pendiente.

## Impact

- `index.html`: un tercer almacén (`storeServidor`) en la sección 5 y el aviso de guardado pendiente. No cambia ningún
  cálculo.
- Nuevo `servidor/`: servidor, esquema, Dockerfile y pruebas con Postgres.
- Nuevo `deploy/`: compose de Rumbo y del túnel de las apps, scripts de despliegue, respaldo, restauración y
  aislamiento, unidades de systemd y `.env` de ejemplo.
- `.github/workflows/verificar.yml`: pruebas del servidor y paso que mueve `production` con un tag.
- `CLAUDE.md`, `openspec/config.yaml`, `docs/DOMINIO.md`, `docs/DECISIONES.md`, nuevo `docs/DESPLIEGUE.md`; en
  Foundry, la ficha de Rumbo.
