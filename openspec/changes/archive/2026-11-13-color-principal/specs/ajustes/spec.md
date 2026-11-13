## ADDED Requirements

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
