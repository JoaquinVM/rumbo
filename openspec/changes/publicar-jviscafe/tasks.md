# Tasks

## 1. Servidor

- [x] 1.1 `servidor/`: esquema, validación del token de Access, API y entrega de `index.html` con `rumbo-api`; Dockerfile sin root.
- [x] 1.2 Pruebas con Postgres: token (firma, `aud`, emisor, vencido, sin token), datos por persona, ida y vuelta de un respaldo, reemplazo que falla a la mitad, límites de colección, id y tamaño.

## 2. Página

- [x] 2.1 `storeServidor` con cola en orden, reintentos, corte a los 20 s, aviso «Hay cambios sin guardar», `beforeunload`, sesión vencida (volver a entrar en otra pestaña) y recarga al volver a la pestaña; «Descargar respaldo» fuera del artifact.
- [x] 2.2 Pruebas en `pruebas/servidor-pagina.mjs` (red falsa que falla y vuelve, orden, 401) y ensayo en navegador con la red cortada.

## 3. Despliegue

- [x] 3.1 `deploy/`: compose de Rumbo y del túnel, `deploy.sh`, `deploy-watch.sh`, `backup.sh`, `restore.sh`, `aislamiento.sh`, `setup.sh`, unidades de systemd y `.env.example`.
- [x] 3.2 CI: pruebas del servidor con Postgres y paso que mueve `production` con un tag `v*`.
- [x] 3.3 Ensayo en la Mac: compose completo, un respaldo y una restauración, y una versión que no arranca vuelve a la anterior.

## 4. En Cloudflare, B2, healthchecks.io y GitHub (lo hace Joaquín)

- [ ] 4.1 Zero Trust: equipo, inicio con código por correo y la aplicación `rumbo.jviscafe.com` con su correo; anotar el AUD.
- [ ] 4.2 Túnel `apps` y su hostname `rumbo.jviscafe.com` → `http://rumbo:8080`; anotar el token.
- [ ] 4.3 B2: clave nueva limitada al bucket y al prefijo `apps/`.
- [ ] 4.4 healthchecks.io: `rumbo-backup` (diario), `rumbo-restore` (semanal) y `rumbo-deploy` (2 min).
- [ ] 4.5 GitHub: deploy key de solo lectura del VPS en `JoaquinVM/rumbo`.

## 5. En el VPS (comandos de root que corre Joaquín, uno a uno con su sí)

- [ ] 5.1 `setup.sh`: carpetas, clon, red `apps`, unidades, rclone propio; `.env` completado por Joaquín.
- [ ] 5.2 Túnel y primer despliegue; `aislamiento.sh`; Akhana igual antes y después.
- [ ] 5.3 Primer respaldo, restauración de prueba y aviso de falla.

## 6. Datos y cierre

- [ ] 6.1 Respaldo del artifact → cargarlo en `rumbo.jviscafe.com` → comparar campo por campo.
- [x] 6.2 `CLAUDE.md`, `openspec/config.yaml`, `docs/DOMINIO.md`, `docs/DECISIONES.md`, `docs/DESPLIEGUE.md` y la ficha de Foundry.
- [x] 6.3 `openspec validate --all --strict` pasa.
