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
- La v1 se construye en el orden de `openspec/config.yaml`, un cambio a la vez.
- `openspec validate --all --strict` debe pasar antes de cada commit.

## Código

- Una sola página, `index.html`, sin compilación. Se publica como artifact privado de claude.ai con las capacidades
  `db` y `user`.
- Pruebas: `npm run verificar` (modelo de dinero y que cada vista se dibuje). Toda regla de dinero nueva lleva su prueba.

## Dinero y datos

- Todo cambio que toque cálculos de dinero, cantidades o datos guardados es **Crisol**.
- Los datos viven en la base del artifact, en `data/users/<id>/rumbo` y sus subcolecciones (`docs/DOMINIO.md`). Son privados: solo los
  lee la persona.
- Ningún campo guardado se renombra, borra ni cambia de tipo sin plan de migración, respaldo previo y verificación.
- No se inventan montos, categorías ni reglas: lo que no está escrito se pregunta.

## Publicar

- Producción: https://claude.ai/artifact/Pa47kuqzy96qmKqbB6Bc5z
- Se publica con el sí de Joaquín y con la herramienta Artifact, siempre a esa misma URL.

## Estilo

- Textos en español claros y amables, sin tecnicismos. Código y commits en inglés.
- Diseño: seguir `docs/DISENO.md` (estilo Bloques sólidos). Un cambio visual se propone y se aprueba antes de hacerlo.
