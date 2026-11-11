# Spec Delta

## ADDED Requirements

### Requirement: AJU-04 Tipo de cambio en Ajustes
El sistema SHALL permitir ver y cambiar en Ajustes el tipo de cambio en uso (CTA-04), con la fecha en que se puso.

#### Scenario: Actualizar el tipo
- **WHEN** la persona cambia el tipo de 12,50 a 13,00
- **THEN** el patrimonio y los saldos en dólares se recalculan con 13,00 y la fecha pasa a hoy

## REMOVED Requirements

### Requirement: AJU-05 Supuestos del prototipo
**Reason**: La moneda pasa a ser siempre Bs (FMT-01), «lo que tienes hoy» se reemplaza por el patrimonio calculado de las cuentas (CTA-05), el rendimiento va en cada cuenta (CTA-01) y el ahorro mensual se reemplaza por las metas.
**Migration**: El ahorro se planifica con metas (cambio `metas`). No hay datos reales de v0 que migrar (DAT-05).
