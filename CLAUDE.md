# Reglas para Claude en este repositorio

Este repositorio contiene **Rumbo**, la app de finanzas personales de Joaquín: muestra a dónde lo llevan sus ingresos y
gastos actuales. Es un sistema de Foundry (`/Users/joaquin/Proyectos/foundry`); sus trabajos se llevan con `/trabajo`.
Las reglas de este archivo mandan sobre las de Foundry dentro de este repo.

## Al empezar

1. `git pull`.
2. Correr `openspec list` y leer la spec o el cambio que toca (`openspec show <nombre>`), `docs/DOMINIO.md`,
   `docs/PENDIENTES.md` y, si el cambio es visual, `docs/DISENO.md`.
3. Si un cambio depende del panorama de otras apps, leer `docs/INVESTIGACION.md`.

## Fuente de verdad

- **OpenSpec** (`openspec/`): `specs/` dice qué hace Rumbo hoy y `changes/` lo aprobado por construir. Cada
  requirement tiene un ID estable (`HOY-02`) al que apuntan el código y las pruebas.
- Lo nuevo entra como cambio de OpenSpec (`/opsx:propose`) y se aprueba antes de construirse (`/opsx:apply`). Al
  terminarlo y publicarlo, se archiva (`openspec archive <cambio>`) en el mismo PR, así las specs quedan al día.
- La v1 ya está construida y archivada. Antes de decidir algo, revisar `docs/DECISIONES.md` y anotar ahí lo nuevo.
- Ensayo opcional en navegador real: `PLAYWRIGHT=<ruta a playwright-core> node pruebas/ensayo.cjs`.
- `openspec validate --all --strict` debe pasar antes de cada commit.

## Código

- Una sola página, `index.html`, sin compilación ni librerías. La sirve el servidor de `servidor/` (Node 24, PostgreSQL
  17, `pg` como única dependencia) en `rumbo.jviscafe.com`, detrás de Cloudflare Access. Dentro de un artifact
  seguiría usando su base; sin ninguna de las dos, el navegador.
- Pruebas: `npm run verificar` (modelo de dinero, que cada vista se dibuje y el guardado) y `npm run probar-servidor`
  (servidor contra un Postgres; variables `PG*`). Toda regla de dinero nueva lleva su prueba.

## Dinero y datos

- Todo cambio que toque cálculos de dinero, cantidades o datos guardados es **Crisol**.
- Los datos viven en la base de Rumbo en el VPS de Akhana, por correo de Access (`docs/DOMINIO.md`). Son privados:
  solo los lee la persona. El servidor guarda cada documento tal cual y no interpreta montos.
- Ningún campo guardado se renombra, borra ni cambia de tipo sin plan de migración, respaldo previo y verificación.
- No se inventan montos, categorías ni reglas: lo que no está escrito se pregunta.

## Publicar

- Producción: https://rumbo.jviscafe.com, en el VPS de Akhana, aislado de Akhana (`docs/DESPLIEGUE.md`).
- Se publica con el sí de Joaquín creando un tag `vX.Y.Z` en `main`: el CI mueve `production` y el VPS la despliega
  sola, con respaldo previo y vuelta atrás.
- En el VPS los agentes no entran como root: lo que requiera root lo corre Joaquín, cada comando con su sí. Nada de
  Rumbo toca `/opt/akhana` ni reinicia Docker.
- El artifact https://claude.ai/artifact/Pa47kuqzy96qmKqbB6Bc5z se dejó de usar; no se publica ahí.

## Estilo

- Textos en español claros y amables, sin tecnicismos. Código y commits en inglés.
- Diseño: seguir `docs/DISENO.md` (estilo Bloques sólidos). Un cambio visual se propone y se aprueba antes de hacerlo.
