# Spec Delta

## ADDED Requirements

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
