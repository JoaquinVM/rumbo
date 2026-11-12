## ADDED Requirements

### Requirement: MOV-06 Tipo de cambio de cada movimiento en dólares
El sistema SHALL guardar en cada movimiento de una cuenta en dólares el tipo de cambio del día en que se anota, y SHALL usarlo para pasarlo a Bs en el Desglose, el ritmo y los topes.

#### Scenario: Cambia el tipo de cambio
- **WHEN** en octubre se gastaron US$ 20 con tipo de cambio 12,5 y hoy la persona pone 14
- **THEN** el Desglose de octubre sigue mostrando Bs 250
