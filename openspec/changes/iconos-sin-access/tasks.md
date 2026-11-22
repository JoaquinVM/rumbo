# Tasks

## 1. Access

- [ ] 1.1 Crear en Zero Trust la aplicación *self-hosted* «Rumbo íconos» con los destinos `rumbo.jviscafe.com/iconos/*` y `rumbo.jviscafe.com/manifest.webmanifest`, y una política *Bypass* para *Everyone*.
- [ ] 1.2 Sin cookies, los tres íconos y el manifest dan 200; `/`, `/index.html`, `/api/v2/datos`, `/iconos`, `/iconosx/a.png`, `/iconos/../api/v2/datos` y `/manifest.webmanifest.bak` siguen yendo a Access.
- [ ] 1.3 La aplicación «Rumbo» y su política siguen iguales.
- [ ] 1.4 Joaquín borra Rumbo de la pantalla de inicio del iPhone, lo vuelve a agregar y ve la brújula.

## 2. Documentos

- [x] 2.1 `docs/DESPLIEGUE.md` (la aplicación «Rumbo íconos») y `docs/DECISIONES.md`.
- [x] 2.2 `openspec validate --all --strict` pasa.
