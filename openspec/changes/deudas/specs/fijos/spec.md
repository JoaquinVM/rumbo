# Spec Delta

## ADDED Requirements

### Requirement: FIJ-04 Cuota de una deuda
El sistema SHALL permitir que un fijo sea la cuota de un préstamo; al confirmarlo, SHALL registrar un pago de deuda (DEU-02) en lugar de un gasto simple.

#### Scenario: Confirmar la cuota
- **WHEN** la persona confirma la cuota del préstamo de 900 el día 20
- **THEN** se registra un pago con 214,67 de interés y 685,33 de capital, y el préstamo baja a 17714,67
