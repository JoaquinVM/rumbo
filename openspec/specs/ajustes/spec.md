# ajustes Specification

## Purpose

Guarda los supuestos de la persona que Rumbo no puede saber solo y que alimentan los cálculos.

## Requirements

### Requirement: AJU-03 Horas de trabajo
El sistema SHALL permitir indicar las horas de trabajo al mes; vacío oculta las horas en el Desglose.

#### Scenario: Sin horas
- **WHEN** la persona deja las horas vacías
- **THEN** el Desglose no muestra horas de trabajo

### Requirement: AJU-04 Tipo de cambio en Ajustes
El sistema SHALL permitir ver y cambiar en Ajustes el tipo de cambio en uso (CTA-04), con la fecha en que se puso.

#### Scenario: Actualizar el tipo
- **WHEN** la persona cambia el tipo de 12,50 a 13,00
- **THEN** el patrimonio y los saldos en dólares se recalculan con 13,00 y la fecha pasa a hoy

### Requirement: AJU-01 Ingreso irregular esperado
El sistema SHALL permitir indicar cuánto ingreso irregular espera la persona al mes (puede ser 0) y SHALL mostrar al lado su promedio real de los últimos 3 meses como referencia.

#### Scenario: Referencia del promedio real
- **WHEN** la persona tuvo 1500, 2200 y 1520 de ingresos variables en los últimos 3 meses
- **THEN** Ajustes muestra «Tu promedio real de los últimos 3 meses: Bs 1.740»

### Requirement: AJU-02 Inflación anual
El sistema SHALL permitir indicar la inflación anual en porcentaje, que usa PRO-05.

#### Scenario: Cambiar la inflación
- **WHEN** la persona cambia la inflación de 8 % a 10 %
- **THEN** la proyección en plata de hoy baja y la nominal no cambia
