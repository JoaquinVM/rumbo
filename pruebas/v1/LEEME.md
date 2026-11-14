# La v1 congelada

Copia de Rumbo v1.0.0 (`index.html` y `verificar.mjs`) que usa Rumbo 2 como oráculo: sus pruebas comparan cada
cálculo de dinero con lo que da la v1 (`openspec/changes/rumbo-2-reescritura/design.md`, «Comparación con la v1»).

- `motor.mjs` carga el motor de esta copia en Node: `cargarMotor({hoy})` devuelve sus funciones (`saldoCuenta`,
  `amortizar`, `calcHoy`…), cada vez con su propio estado.
- `verificar.mjs` son las pruebas de la v1.0.0 corriendo sobre esta copia. Corren en `npm run unitarias`.
- Producción sigue sirviendo el `index.html` de la raíz hasta el corte (trabajo 080). Esta copia no se edita: si un
  arreglo de la v1 cambia una regla de dinero, se copia aquí en el mismo PR y se porta a la v2.
