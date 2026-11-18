---
name: ver-en-local
description: Levanta Rumbo 2 de esta rama en local, con una base de prueba propia, y se lo deja abierto a Joaquín en el navegador de la app a tamaño de teléfono. Úsala cuando diga «mostrame en local», «muéstramelo», «quiero verlo antes de aprobar» o pida ver un cambio con datos de prueba.
---

Todo lo pesado lo hace el script. No investigues cómo arranca la app ni armes copias de la página: córrelo.

## 1. Levantar

Desde la carpeta del trabajo (la principal o su worktree):

    python3 -I .claude/skills/ver-en-local/ver_en_local.py

Construye la app y el servidor de esta rama y arranca el servidor de prueba de los e2e (`e2e/servidor-prueba.mjs`). Ese
servidor usa el Access de prueba abierto: todo lo que pide es de la persona `e2e@rumbo.test`. Lo hace contra la base
`rumbo_local_<rama>` del contenedor `rumbo-pg-prueba`. Tarda unos segundos (más la primera vez, por `npm ci`) e
imprime un JSON con `url`, `api`, `base` y `logs`. Cada vez reconstruye, así lo que se ve es el código actual de la
rama. No toca producción, los datos de Joaquín ni el ensayo de otra sesión.

Si falla, el script muestra las últimas líneas del log. Arregla eso, no lo rodees.

## 2. Datos de prueba

- Sin nada guardado, Rumbo muestra **sus datos de ejemplo**. Casi siempre alcanzan.
- Si el cambio necesita un caso que el ejemplo no tiene (centavos, una deuda, otra moneda), cárgalo como los e2e:
  `curl -X PUT <api> -H 'Content-Type: application/json' -d '{"main": …, "cols": …}'` con la forma de
  `e2e/pruebas/persona.ts`. Pocos datos, solo los del caso.
- `--vaciar` borra lo de la persona de prueba y vuelve al ejemplo.
- Nunca uses un respaldo real de Joaquín ni datos de producción.

## 3. Abrir

1. `mcp__Claude_Browser__resize_window` con `mobile`: Joaquín usa Rumbo en el iPhone.
2. Abre la `url` en el navegador de la app y ve a la pantalla del trabajo, en el estado que muestra el cambio.
3. Comprueba tú que se ve lo que se pidió antes de pasárselo.

## 4. Pasárselo a Joaquín

En dos o tres líneas: qué pantalla dejaste abierta, con qué datos y qué puede tocar. Es una base de prueba: nada de lo
que haga llega a su Rumbo real.

## Al terminar

- Al cerrar el trabajo: `--parar` (la base queda) o `--borrar` (también borra la base).
- No dejes servidores corriendo de un trabajo ya mergeado.
