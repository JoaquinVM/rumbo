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

### Requirement: AJU-05 Color principal
El sistema SHALL permitir elegir en Ajustes el color principal entre Azul, Cielo, Morado y Rosa pastel. El color elegido SHALL reemplazar al azul en todo lo que hoy se pinta de azul, en modo claro y oscuro, y SHALL guardarse en los Ajustes de la persona para verse igual en todos sus equipos. Si no hay color guardado, o el guardado no es uno de los cuatro, SHALL usarse Azul. Los colores de ámbar, verde, rojo, ladrillo y tinta MUST NOT cambiar.

#### Scenario: Elegir rosa
- **WHEN** la persona, con un patrimonio de Bs 25.000, toca «Rosa pastel» en Ajustes
- **THEN** el bloque de patrimonio con Bs 25.000, la pestaña activa y el monto de los formularios se ven rosa pastel al instante, con el texto del bloque en vino para que se lea, y el bloque de una meta sigue verde

#### Scenario: Se ve igual en otro equipo
- **WHEN** la persona eligió «Morado» en el teléfono y abre Rumbo en la computadora
- **THEN** Rumbo se ve morado en la computadora sin volver a elegirlo

#### Scenario: Sin color guardado
- **WHEN** los Ajustes guardados no tienen color, como los de hoy
- **THEN** Rumbo se ve azul, igual que antes del cambio, y los montos no cambian

#### Scenario: En el ejemplo
- **WHEN** la persona está viendo el ejemplo y toca «Cielo»
- **THEN** el ejemplo se ve cielo, pero no se guarda nada en su base

#### Scenario: Respaldo
- **WHEN** la persona eligió «Rosa pastel», descarga un respaldo y después lo carga
- **THEN** Rumbo vuelve a verse rosa pastel
