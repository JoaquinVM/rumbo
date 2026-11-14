## MODIFIED Requirements

### Requirement: DAT-03 Privacidad y dónde se guarda
El sistema SHALL guardar los datos de cada persona en su espacio privado: en `rumbo.jviscafe.com`, en la base propia de Rumbo, bajo el correo con el que entró por Cloudflare Access; dentro del artifact, en la base del artifact; y sin ninguna de las dos, solo en ese navegador, diciéndolo en pantalla. Una persona MUST NOT poder leer ni cambiar los datos de otra.

#### Scenario: Sin base
- **WHEN** la página no está en el artifact ni la sirve el servidor de Rumbo
- **THEN** guarda en el navegador y muestra «Tus datos se guardan solo en este navegador»

#### Scenario: En rumbo.jviscafe.com
- **WHEN** Joaquín entra a `rumbo.jviscafe.com` con su correo y anota un gasto de Bs 35
- **THEN** el gasto queda en la base de Rumbo bajo su correo y lo ve al abrir Rumbo en otro equipo con el mismo correo

#### Scenario: Otra persona
- **WHEN** otro correo aprobado entra a Rumbo
- **THEN** ve el ejemplo o sus propios datos, nunca los de Joaquín

## ADDED Requirements

### Requirement: DAT-07 Guardado pendiente
En `rumbo.jviscafe.com`, el sistema SHALL guardar en el orden en que se anotó. Si una escritura no llega al servidor, SHALL reintentarla sin perder el orden y mostrar «Hay cambios sin guardar» hasta que todo llegue, y SHALL advertir antes de cerrar la página mientras quede algo pendiente. Si la sesión de Cloudflare Access venció, SHALL pedir recargar la página sin descartar lo pendiente.

#### Scenario: Sin señal un momento
- **WHEN** la persona anota un gasto de Bs 20 y luego lo borra mientras el teléfono no tiene señal
- **THEN** ve «Hay cambios sin guardar» y, al volver la señal, se guarda el gasto y después se borra, y el aviso desaparece

#### Scenario: Sesión vencida
- **WHEN** la sesión de Access venció y la persona anota un ingreso de Bs 500
- **THEN** Rumbo pide recargar la página para volver a entrar y el ingreso sigue pendiente, sin perderse
