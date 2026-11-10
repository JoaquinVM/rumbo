# Reglas para Claude en este repositorio

Este repositorio contiene **Rumbo**, la app de finanzas personales de Joaquín: muestra a dónde lo llevan sus ingresos y
gastos actuales. Es un sistema de Foundry (`/Users/joaquin/Proyectos/foundry`); sus trabajos se llevan con `/trabajo`.
Las reglas de este archivo mandan sobre las de Foundry dentro de este repo.

## Al empezar

1. `git pull`.
2. Leer `docs/REQUISITOS.md`, `docs/PENDIENTES.md` y, si el cambio es visual, `docs/DISENO.md`.
3. Si un cambio depende del panorama de otras apps, leer `docs/INVESTIGACION.md`.

## Fuente de verdad

- `docs/REQUISITOS.md` dice qué hace Rumbo. Cada función apunta a un ID (`PRO-02`).
- Si Joaquín pide algo que no está en los requisitos, se propone el requisito primero.
- Si un cambio altera lo que hace Rumbo, el requisito se actualiza en el mismo commit.

## Código

- Una sola página, `index.html`, sin compilación. Se publica como artifact privado de claude.ai con las capacidades
  `db` y `user`.
- Pruebas: `npm run verificar` (modelo de dinero y que cada vista se dibuje). Toda regla de dinero nueva lleva su prueba.

## Dinero y datos

- Todo cambio que toque cálculos de dinero, cantidades o datos guardados es **Crisol**.
- Los datos viven en la base del artifact, en `data/users/<id>/rumbo` y su subcolección `movs`. Son privados: solo los
  lee la persona.
- Ningún campo guardado se renombra, borra ni cambia de tipo sin plan de migración, respaldo previo y verificación.
- No se inventan montos, categorías ni reglas: lo que no está escrito se pregunta.

## Publicar

- Producción: https://claude.ai/artifact/Pa47kuqzy96qmKqbB6Bc5z
- Se publica con el sí de Joaquín y con la herramienta Artifact, siempre a esa misma URL.

## Estilo

- Textos en español claros y amables, sin tecnicismos. Código y commits en inglés.
- Diseño: seguir `docs/DISENO.md` (estilo Bloques sólidos). Un cambio visual se propone y se aprueba antes de hacerlo.
