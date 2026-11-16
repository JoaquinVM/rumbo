# Tasks

## 1. Google en Access

- [x] 1.1 Joaquín crea en Google Cloud un cliente OAuth («Aplicación web») con la redirección `https://empty-truth-cd43.cloudflareaccess.com/cdn-cgi/access/callback`.
- [x] 1.2 Joaquín agrega Google en Zero Trust > Settings > Authentication con ese cliente, lo prueba con «Test» y lo activa en la aplicación «Rumbo» junto al código por correo.
- [ ] 1.3 Joaquín entra con Google y ve sus datos de siempre.

## 2. La otra persona

- [x] 2.0 Agregar su correo como usuario de prueba en Google Cloud (proyecto «Rumbo Access»).
- [x] 2.1 Sumar su correo a la política *Allow* de la aplicación «Rumbo».
- [ ] 2.2 Joaquín suma su correo a `CORREOS_PERMITIDOS` en `/opt/apps/rumbo/.env` y recrea solo el contenedor `app` del proyecto `rumbo`; `akhana-lectura estado` antes y después.
- [ ] 2.3 Ella baja su respaldo del artifact, lo carga en `rumbo.jviscafe.com` y compara los conteos.
- [ ] 2.4 Cada correo ve solo sus datos; una cuenta de Google fuera de la lista no pasa.

## 3. Documentos

- [x] 3.1 `docs/DESPLIEGUE.md` (cómo se entra y cómo sumar un correo) y `docs/DECISIONES.md`.
- [x] 3.2 `openspec validate --all --strict` pasa.
