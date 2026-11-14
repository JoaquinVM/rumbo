# pantallas Specification

## Purpose

Ordena la app en pocas pantallas que se usan bien en el teléfono, con la proyección siempre al frente.

## Requirements

### Requirement: PAN-01 Navegación
El sistema SHALL tener cuatro pestañas (Rumbo, Movimientos, Desglose y Plan), el botón + en todas y Ajustes desde el ícono de arriba.

#### Scenario: Cambiar de pestaña
- **WHEN** la persona toca la pestaña Plan
- **THEN** ve su patrimonio, sus cuentas y sus fijos

### Requirement: PAN-02 Orden de la pantalla Rumbo
El sistema SHALL mostrar en Rumbo, en este orden: titular y gráfica, Hoy, Por confirmar (si hay pendientes), avisos (si hay), indicadores y ¿Y si…?

#### Scenario: Abrir la app
- **WHEN** la persona abre Rumbo con la Luz pendiente
- **THEN** ve el titular, luego Hoy con su monto al día y luego Por confirmar con la Luz

### Requirement: PAN-04 Teléfono y temas
El sistema SHALL verse sin scroll horizontal a 375 px de ancho, en modo claro y oscuro.

#### Scenario: Teléfono angosto
- **WHEN** la pantalla mide 375 px
- **THEN** ninguna vista tiene scroll horizontal

### Requirement: PAN-05 Avisos dentro de la app
El sistema SHALL mostrar los avisos solo dentro de la app, porque un artifact no puede enviar notificaciones.

#### Scenario: Aviso
- **WHEN** hay algo que avisar
- **THEN** aparece en la pantalla, no como notificación del teléfono

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

### Requirement: PAN-03 Pantalla Plan
El sistema SHALL mostrar en Plan, en este orden: el patrimonio con su desglose (cuentas, te deben, deudas), las cuentas con su saldo y el botón cuadrar, y los fijos.

#### Scenario: Abrir Plan
- **WHEN** la persona abre Plan
- **THEN** lo primero es el patrimonio y debajo cada cuenta con su saldo y «Cuadrar»

### Requirement: PAN-08 Metas en Rumbo y Plan
El sistema SHALL mostrar las metas en un bloque verde en Rumbo (después de Por confirmar y los avisos) y en Plan (después de los fijos), y SHALL abrir el detalle de una meta al tocarla, con su avance, aporte sugerido, lo que falta este mes, dónde está lo apartado y los botones Apartar y Desapartar.

#### Scenario: Abrir una meta
- **WHEN** la persona toca el Fondo de emergencia en Plan
- **THEN** ve el detalle con Bs 4.000 de Bs 15.000, «Falta este mes Bs 300» y el botón «Apartar»

### Requirement: PAN-07 Deudas en Plan y detalle del préstamo
El sistema SHALL mostrar en Plan, después de los fijos, la sección Deudas con cada deuda, su tipo y su saldo, y SHALL abrir el detalle de un préstamo al tocarlo, con su saldo en un bloque ladrillo, cuándo termina, el interés por pagar, las próximas cuotas, la palanca de adelantar y el botón «Registrar un pago».

#### Scenario: Abrir el préstamo
- **WHEN** la persona toca el préstamo del banco en Plan
- **THEN** ve Bs 18.400 por pagar, «Terminas oct 2028» y las 3 próximas cuotas

### Requirement: PAN-09 Categorías y topes en Plan
El sistema SHALL mostrar en Plan, al final, una fila «Categorías y topes» con cuántas categorías hay y cuáles tienen tope, que abre el editor de categorías.

#### Scenario: Abrir categorías
- **WHEN** la persona toca «16 categorías · 3 con tope» en Plan
- **THEN** ve todas sus categorías con su ícono, su color y su tope, y puede editarlas

### Requirement: PAN-10 Instalable en el teléfono
El sistema SHALL poder agregarse a la pantalla de inicio de un iPhone y de un Android desde `rumbo.jviscafe.com`: con el nombre «Rumbo», el ícono de la brújula blanca sobre azul (180 px para iPhone, 192 y 512 px para Android, con versión maskable), el fondo de la app como color de tema y de pantalla de inicio, y abriéndose sin la barra del navegador. El servidor SHALL entregar el manifest y los íconos a quien Access deje pasar, y el manifest MUST pedirse con las credenciales de Access. No SHALL cambiar ningún cálculo ni dato guardado.

#### Scenario: Agregar a la pantalla de inicio
- **WHEN** Joaquín abre `rumbo.jviscafe.com` en su teléfono y elige «Agregar a pantalla de inicio»
- **THEN** aparece el ícono de la brújula con el nombre «Rumbo», y al tocarlo Rumbo se abre sin la barra del navegador, con sus datos

#### Scenario: Manifest e íconos
- **WHEN** la página pide `/manifest.webmanifest` y los íconos que nombra
- **THEN** el servidor los entrega con su tipo, y el manifest dice nombre «Rumbo», `display` `standalone` y los íconos de 192 y 512 px, uno de ellos maskable
