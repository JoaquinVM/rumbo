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
El sistema SHALL pedir para empezar la moneda, «lo que tienes hoy», el ingreso fijo mensual y el total de gastos fijos.

#### Scenario: Empezar
- **WHEN** la persona escribe ingreso fijo 8000 y gastos fijos 3000
- **THEN** se crean los fijos «Sueldo» de 8000 y «Gastos fijos» de 3000

### Requirement: DAT-03 Privacidad y dónde se guarda
El sistema SHALL guardar los datos de cada persona en su espacio privado de la base del artifact y, sin base, solo en ese navegador, diciéndolo en pantalla.

#### Scenario: Sin base
- **WHEN** la base no está disponible
- **THEN** guarda en el navegador y muestra «Tus datos se guardan solo en este navegador»

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
