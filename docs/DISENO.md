# Diseño de Rumbo

Estilo **Bloques sólidos**, elegido por Joaquín el 10/11/2026. Mockups de referencia (privados):
https://claude.ai/artifact/JYRHrYcp9M72Tp22bMvnCy

Un cambio visual se propone y se aprueba antes de hacerlo; si cambia el estilo, se actualizan este archivo y los mockups.

## Idea

Mismo esqueleto en todas las pantallas: fondo verde grisáceo, tarjetas redondeadas y una sola columna de teléfono. Lo
que importa en cada momento va en un **bloque de color sólido con texto blanco**; lo demás, en filas blancas. El color
siempre significa lo mismo.

## Color

| Uso | Color | Dónde |
| --- | --- | --- |
| Fondo | `#EDF0EA` | Toda la app |
| Texto | `#13201A` (principal), `#5D6B63` (secundario) | |
| **Azul · tu dinero y lo de hoy** (se elige en Ajustes) | `#2B47E0` | Bloque Hoy, patrimonio, resumen del mes, monto en formularios, opción elegida, pestaña activa, botón principal |
| **Ámbar · pendiente y avisos** | `#A86410` (bloque), `#F8E7D0` (suave) | Por confirmar, avisos, topes desde el 80 %, tipo de cambio viejo |
| **Verde · metas y ahorro** | `#1E7A55` (bloque), `#D7EFE3` (suave), `#0F7A56` (texto de ingresos) | Metas, «te quedas tú», resultado de «¿Y si…?», lo que entra en un cambio |
| **Rojo · te pasaste** | `#B03A22` | Solo una categoría que pasó su tope |
| **Tinta · solo acciones** | `#13201A` | Botones principales y botón +. Ningún otro elemento grande usa este color: lo oscuro se toca |
| **Ladrillo · lo que debes** | `#6B2E21` | Bloque de un préstamo |
| Azul suave | `#DDE3FF` | Baldosa de colchón, etiqueta «Fijo», «Día a día» |

**Color principal.** El azul se puede cambiar en Ajustes por Cielo `#1A6FB8`, Morado `#6A3FCF` o Rosa pastel `#F4A6C8`;
cada uno trae su suave y su versión oscura (tabla completa en `index.html`, `PALETA`). El Rosa pastel es el único con
texto vino (`#5C1239`) sobre sus bloques y un rosa fuerte (`#A3366B`) para textos y trazos sobre el fondo claro. Nunca
se ofrece un verde, ámbar ni rojo como color principal: esos tienen su propio significado. Sobre el color principal el
texto usa `--azul-on` y, sobre el fondo, `--azul-l`; nunca `#fff` fijo.

Categorías: Comida fuera `#E0703A`, Súper `#3E9B5C`, Casa `#5A6CD8`, Transporte `#2F93B5`, Salud `#D04F78`, Ocio
`#9A5BD0`, Compras `#C08A1F`, Suscripciones `#6B7F8C`, Educación `#2E8F86`, Intereses `#B5482E`, Otros `#808A84`.
Ingresos en verdes.

## Tipografía

- Títulos y cifras grandes: **Bricolage Grotesque** 700–800.
- Texto y montos de listas: **Instrument Sans** 400–600, con números tabulares.
- Etiquetas de bloque: 12 px, mayúsculas, espaciado 0,12 em, 85 % de opacidad.

## Piezas

- **Bloque:** radio 18 px, relleno 18 px, texto blanco. Dentro, la línea clave (por ejemplo «Libre») va resaltada en
  una franja blanca; los botones son uno blanco sólido y otro con borde blanco.
- **Baldosa:** radio 16 px, tono suave del color con su texto oscuro. Para los indicadores.
- **Fila:** blanca, radio 14 px, alto mínimo 56 px, sin borde, con un cuadrito de 40 px (radio 12) del color de su
  categoría a la izquierda y un ícono blanco adentro.
- **Íconos:** SVG de trazo, 20 px, grosor 2, puntas redondeadas, en blanco sobre el cuadrito. Nunca letras ni emojis.
  Cada categoría, cuenta y tipo tiene el suyo: comida fuera (tenedor y cuchillo), transporte (auto), súper (carrito),
  casa (casa), negocio (maletín), transferencia (dos flechas, cuadrito gris pizarra `#4F5D66`), ajuste (balanza, cuadrito gris),
  efectivo (billete), banco (edificio), dólares (signo $), sueldo (bandeja con flecha), luz (rayo), suscripciones
  (pantalla con play), internet (wifi), préstamo y cuotas (porcentaje), deuda con una persona (persona), te deben
  (persona con flecha). En los fijos, el día va en el texto («día 25»), no en el cuadrito.
- **Botón +:** oscuro, 58 px, radio 20, sobre la barra de pestañas.
- **Botones:** estilo propio, igual en toda la app y sobre cualquier fondo, también dentro de los bloques de color.
  - Principal: tinta `#13201A` sólida, texto blanco en negrita, esquinas de 12 px (no pastilla), alto 48–52 px y sombra
    inferior marcada (`0 4px 0 rgba(0,0,0,.28)`) que lo hace ver presionable. Uno por grupo.
  - Secundario: solo texto subrayado, sin caja (blanco sobre un bloque, tinta sobre fondo claro).
  - Agregar: borde tinta punteado de 1,5 px, esquinas de 12 px, con «+».
  - Las opciones que se eligen (cuentas, categorías, filtros, horizonte) son pastillas redondas con borde fino que se
    vuelven azules al elegirse: nunca se ven como un botón.
- **Formulario:** el monto va en un bloque azul grande; las entradas son blancas sin borde y las opciones son pastillas
  blancas que se vuelven azules al elegirlas.
- **Toques:** nada menor a 44 px.

## Reglas

- Un color no se usa fuera de su significado: el rojo nunca decora y el azul nunca avisa.
- Un bloque sólido por idea; si todo es bloque, nada destaca.
- Textos claros y amables, en español de Bolivia; montos «Bs 1.234,50».
