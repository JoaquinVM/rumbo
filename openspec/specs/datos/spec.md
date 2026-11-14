# datos Specification

## Purpose

Garantiza que los datos de la persona sean privados, que no se guarde nada sin querer y que nunca se pierdan por un cambio.

## Requirements

### Requirement: DAT-01 Ejemplo antes de empezar
El sistema SHALL mostrar datos de ejemplo marcados como tales, sin guardar nada, hasta que la persona toque «Empezar con mis datos».

#### Scenario: Primera visita
- **WHEN** no hay datos guardados
- **THEN** se ve el ejemplo con su aviso y no se escribe nada en la base

### Requirement: DAT-02 Empezar con mis datos
El sistema SHALL pedir para empezar las cuentas con su saldo de hoy, el ingreso fijo mensual con la cuenta a la que entra y su día, el ingreso irregular que espera al mes y los gastos fijos principales con su día. Las deudas son opcionales.

#### Scenario: Empezar
- **WHEN** la persona escribe Efectivo 650, Banco 3550, sueldo 8000 al Banco el día 25 y renta 2500 el día 5
- **THEN** se crean las dos cuentas, el fijo «Sueldo» el día 25 y el fijo «Renta» el día 5, y Rumbo muestra el libre hasta el 25

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

### Requirement: DAT-05 Datos guardados no se rompen
El sistema MUST NOT renombrar, borrar ni cambiar de tipo un campo guardado sin plan de migración, respaldo previo y verificación.

#### Scenario: Cambio de forma de los datos
- **WHEN** una versión nueva cambia cómo se guarda algo
- **THEN** incluye su migración, se respalda antes y se verifica después

### Requirement: DAT-06 Borrar todo
El sistema SHALL borrar todos los datos solo después de un segundo toque y volver al ejemplo.

#### Scenario: Borrar todo
- **WHEN** la persona toca «Borrar todo» dos veces
- **THEN** sus datos se borran y vuelve a ver el ejemplo

### Requirement: DAT-04 Respaldo
El sistema SHALL permitir descargar un archivo con todos los datos de la persona y cargarlo de vuelta. Antes de reemplazar, SHALL mostrar qué trae (cuántas cuentas, movimientos y fijos) y pedir confirmación.

#### Scenario: Cargar un respaldo
- **WHEN** la persona carga un respaldo con 3 cuentas, 214 movimientos y 6 fijos
- **THEN** el sistema muestra esos conteos y solo reemplaza sus datos después de que confirme

#### Scenario: Archivo que no es de Rumbo
- **WHEN** la persona carga un archivo que no es un respaldo de Rumbo
- **THEN** el sistema no cambia nada y explica que el archivo no sirve

### Requirement: DAT-07 Guardado pendiente
En `rumbo.jviscafe.com`, el sistema SHALL guardar en el orden en que se anotó. Si una escritura no llega al servidor, SHALL reintentarla sin perder el orden y mostrar «Hay cambios sin guardar» hasta que todo llegue, y SHALL advertir antes de cerrar la página mientras quede algo pendiente. Si la sesión de Cloudflare Access venció, SHALL pedir volver a entrar en otra pestaña, sin recargar ni descartar lo pendiente, y guardarlo al volver.

#### Scenario: Sin señal un momento
- **WHEN** la persona anota un gasto de Bs 20 y luego lo borra mientras el teléfono no tiene señal
- **THEN** ve «Hay cambios sin guardar» y, al volver la señal, se guarda el gasto y después se borra, y el aviso desaparece

#### Scenario: Sesión vencida
- **WHEN** la sesión de Access venció y la persona anota un ingreso de Bs 500
- **THEN** Rumbo pide volver a entrar en otra pestaña y, al regresar, guarda el ingreso sin que se pierda
