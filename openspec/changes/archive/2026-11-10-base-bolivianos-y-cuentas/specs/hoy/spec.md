# Spec Delta

## MODIFIED Requirements

### Requirement: HOY-02 Libre del mes
El sistema SHALL calcular el libre del mes de calendario como ingresos del mes (fijos + variables del mes) − fijos de gasto − gastos variables del mes. El ahorro mensual de Ajustes ya no existe.

#### Scenario: Libre calculado
- **WHEN** entran 8000 de fijos, salen 3000 de fijos y van 2000 de gastos variables
- **THEN** el libre del mes es 3000
