# Design

- **Dónde va lo de instalar:** en `armarPagina` del servidor, no en `index.html`, porque solo tiene sentido en
  `rumbo.jviscafe.com`; la página no cambia.
- **Access:** el manifest se pide con `crossorigin="use-credentials"` para que lleve la cookie de Access; el ícono del
  iPhone y los del manifest se piden desde el mismo origen, con la sesión abierta. Los archivos fijos no pasan por la
  verificación del token: son públicos dentro de lo que Access ya deja pasar, como la página.
- **Ícono fijo:** la brújula del encabezado, blanca sobre `#2B47E0`. No sigue el color de Ajustes: el manifest y los
  íconos instalados no pueden cambiar por persona. La brújula queda dentro del 80 % central, así que el mismo PNG de 512
  sirve de maskable.
- **Color de tema:** `#EDF0EA` en claro y `#0E1411` en oscuro, el fondo de la app; la pantalla de inicio usa `#EDF0EA`.
  En el iPhone, la barra de estado queda en `default`: el texto negro se lee sobre el fondo claro.
- **Sin service worker:** Chrome ya ofrece instalar sin él y la decisión 48 dice que Rumbo se usa con internet.
- **Íconos:** PNG hechos una vez desde `iconos/icono.svg` y guardados en el repo; se sirven con caché de un día.
