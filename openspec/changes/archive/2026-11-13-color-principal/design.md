# Design

## Context

Todo el azul de la página sale de tres variables CSS: `--azul` (bloque), `--azul-s` (suave) y `--azul-t` (texto sobre
suave). Se definen tres veces: modo claro, modo oscuro por sistema y modo oscuro forzado. Los Ajustes (`S.aj`) se
guardan enteros con `guardarAj()` en `data/users/<id>/rumbo` y se leen mezclados con `AJ_BASE`.

## Goals / Non-Goals

**Goals:** cambiar el color principal sin tocar cada regla de CSS y sin migrar datos.

**Non-Goals:** color libre, cambiar los colores con significado (ámbar, verde, rojo, ladrillo, tinta), colores de
categorías, ícono de la app.

## Decisions

- **Paleta fija en el código** (`PALETA`). Cada color tiene, por modo: bloque, suave, texto sobre suave, texto sobre
  el bloque y línea (para textos y trazos sobre el fondo: pestaña activa, monto de la proyección, gráfica, logo, foco).

  Modo claro:

  | Color | Bloque | Suave | Texto | Sobre bloque | Línea |
  | --- | --- | --- | --- | --- | --- |
  | Azul | `#2B47E0` | `#DDE3FF` | `#1C2E95` | `#FFFFFF` | `#2B47E0` |
  | Cielo | `#1A6FB8` | `#D6E8F7` | `#0E3F6B` | `#FFFFFF` | `#1A6FB8` |
  | Morado | `#6A3FCF` | `#E6DDFB` | `#3B1F86` | `#FFFFFF` | `#6A3FCF` |
  | Rosa pastel | `#F4A6C8` | `#FBDDEB` | `#7D1655` | `#5C1239` | `#A3366B` |

  Modo oscuro:

  | Color | Bloque | Suave | Texto | Sobre bloque | Línea |
  | --- | --- | --- | --- | --- | --- |
  | Azul | `#3F5BEA` | `#232C55` | `#C9D1FF` | `#FFFFFF` | `#3F5BEA` |
  | Cielo | `#2474B8` | `#1B3550` | `#C4E0F7` | `#FFFFFF` | `#2474B8` |
  | Morado | `#7550DA` | `#2E2550` | `#DCCFFF` | `#FFFFFF` | `#7550DA` |
  | Rosa pastel | `#F4A6C8` | `#4C1F3D` | `#FFCCEB` | `#5C1239` | `#F4A6C8` |

  Texto sobre el bloque: al menos 4,5 a 1 en los dos modos (Azul 6,8; Cielo 5,2; Morado 6,5; Rosa pastel 7,0 con
  texto vino). La línea del Rosa pastel en claro (`#A3366B`) da 5,5 a 1 sobre el fondo. Azul conserva exactamente los
  valores de hoy. Alternativa descartada: calcular los tonos desde un color libre, porque no garantiza que se lea ni
  que no se confunda con el verde o el rojo.
- **Dos variables nuevas** porque el pastel no admite texto blanco ni se ve sobre el fondo claro: `--azul-on` (texto
  sobre el bloque, hoy `#fff` fijo en `.blk.b`, `.montoblk`, `.chip` y `.seg` elegidos) y `--azul-l` (hoy `var(--azul)`
  donde se usa como texto o trazo sobre el fondo). Para los otros tres colores valen lo mismo que hoy.
- **Se aplica con un `<style id="tema">`** que redefine las tres variables con los mismos tres selectores del CSS
  actual. Así modo claro y oscuro siguen funcionando sin JavaScript extra. Redefine las cinco variables. Se reescribe al cargar los datos, al elegir,
  al cargar un respaldo y al borrar todo.
- **Se guarda como `aj.color`** con el nombre (`'azul'`, `'cielo'`, `'morado'`, `'rosa'`; Rosa pastel se guarda como `'rosa'`). No es hex, así se puede
  ajustar un tono sin migrar. Un valor desconocido o ausente se lee como `'azul'`. `AJ_BASE` no lo agrega, para no
  escribir el campo en bases que nunca lo eligieron.
- **Sección propia en Ajustes** («Apariencia»), fuera del formulario con «Guardar»: cuatro círculos que se eligen con un
  toque, con el nombre debajo y la opción elegida marcada como el resto de opciones (`aria-pressed`).

## Risks / Trade-offs

- Rosa pastel es el único color con texto oscuro en los bloques: se ve distinto a los demás a propósito. Si una pieza
  nueva pone `#fff` fijo sobre `--azul`, con el pastel no se leería; la prueba del tema lo cuida en las piezas de hoy.
- Antes de que lleguen los datos, la página se dibuja un instante en azul. Es el mismo arranque de hoy.
