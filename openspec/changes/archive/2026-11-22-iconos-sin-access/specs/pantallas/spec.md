## MODIFIED Requirements

### Requirement: PAN-10 Instalable en el teléfono
El sistema SHALL poder agregarse a la pantalla de inicio de un iPhone y de un Android desde `rumbo.jviscafe.com`: con el nombre «Rumbo», el ícono de la brújula blanca sobre azul (180 px para iPhone, 192 y 512 px para Android, con versión maskable), el fondo de la app como color de tema y de pantalla de inicio, y abriéndose sin la barra del navegador. El manifest (`/manifest.webmanifest`) y los íconos (`/iconos/*`) SHALL entregarse sin iniciar sesión, porque el teléfono los pide sin la sesión de Access; todo lo demás MUST seguir pidiendo Access. No SHALL cambiar ningún cálculo ni dato guardado.

#### Scenario: Agregar a la pantalla de inicio
- **WHEN** Joaquín abre `rumbo.jviscafe.com` en su teléfono y elige «Agregar a pantalla de inicio»
- **THEN** aparece el ícono de la brújula con el nombre «Rumbo», y al tocarlo Rumbo se abre sin la barra del navegador, con sus datos

#### Scenario: Manifest e íconos
- **WHEN** la página pide `/manifest.webmanifest` y los íconos que nombra
- **THEN** el servidor los entrega con su tipo, y el manifest dice nombre «Rumbo», `display` `standalone` y los íconos de 192 y 512 px, uno de ellos maskable

#### Scenario: Sin iniciar sesión
- **WHEN** alguien sin sesión de Access pide `/iconos/icono-180.png`, `/manifest.webmanifest`, la página o `/api/v2/datos`
- **THEN** recibe el ícono y el manifest, y para la página y la API lo manda a la pantalla de entrada de Access
