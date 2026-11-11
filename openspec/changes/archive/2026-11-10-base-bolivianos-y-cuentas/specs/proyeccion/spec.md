# Spec Delta

## MODIFIED Requirements

### Requirement: PRO-03 Punto de partida y rendimiento
El sistema SHALL partir del patrimonio de hoy (CTA-05) y, cada mes, SHALL hacer crecer cada cuenta con su propio rendimiento anual (dividido entre 12) solo si su saldo es positivo, y sumar el neto del ritmo.

#### Scenario: Rendimiento sobre saldo positivo
- **WHEN** Banco tiene 12000 al 12 % anual, Efectivo 1000 al 0 % y el neto es 0
- **THEN** el mes siguiente el patrimonio es 13120

#### Scenario: Una deuda no rinde
- **WHEN** el patrimonio es −5000 y el neto 0
- **THEN** sigue en −5000 al cabo de 12 meses
