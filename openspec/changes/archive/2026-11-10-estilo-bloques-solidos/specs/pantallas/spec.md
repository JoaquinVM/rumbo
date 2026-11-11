# Spec Delta

## MODIFIED Requirements

### Requirement: PAN-06 Estilo visual
El sistema SHALL seguir el estilo Bloques sólidos de `docs/DISENO.md`: cada color tiene un solo significado (azul dinero de hoy, ámbar pendiente y avisos, verde metas y ahorro, rojo solo al pasarse de un tope, ladrillo deudas, tinta oscura solo para acciones), las listas usan íconos SVG y nunca letras ni emojis, y los botones se distinguen de las tarjetas y de las opciones.

#### Scenario: Estilo
- **WHEN** se abre cualquier pantalla
- **THEN** usa el fondo verde grisáceo, los colores con significado y las piezas de `docs/DISENO.md`

#### Scenario: Botón principal
- **WHEN** una pantalla tiene una acción principal, como «Confirmar Bs 180»
- **THEN** es un botón tinta oscura con esquinas de 12 px y sombra inferior, también dentro de un bloque de color

#### Scenario: Ícono de un movimiento
- **WHEN** se muestra un gasto de Transporte
- **THEN** lleva el ícono del auto en un cuadrito del color de Transporte, sin letras

#### Scenario: Opción elegida
- **WHEN** la persona elige la cuenta Efectivo al anotar
- **THEN** la pastilla de Efectivo se vuelve azul y las demás quedan blancas con borde fino
