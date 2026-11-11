# ajustes Specification

## Purpose

Guarda los supuestos de la persona que Rumbo no puede saber solo y que alimentan los cálculos.

## Requirements

### Requirement: AJU-03 Horas de trabajo
El sistema SHALL permitir indicar las horas de trabajo al mes; vacío oculta las horas en el Desglose.

#### Scenario: Sin horas
- **WHEN** la persona deja las horas vacías
- **THEN** el Desglose no muestra horas de trabajo

### Requirement: AJU-05 Supuestos del prototipo
El sistema SHALL permitir indicar en Ajustes la moneda, «lo que tienes hoy» (con signo menos si debe más de lo que tiene), el ahorro que aparta al mes y el rendimiento anual de sus ahorros.

#### Scenario: Lo que tienes hoy negativo
- **WHEN** la persona escribe «-500» en «lo que tienes hoy»
- **THEN** la proyección parte de −500
