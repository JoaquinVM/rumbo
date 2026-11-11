# Spec Delta

## ADDED Requirements

### Requirement: IND-04 Deuda total
El sistema SHALL mostrar la deuda total (préstamos y deudas con personas, en Bs) y el mes en que la persona queda libre de préstamos a este ritmo.

#### Scenario: Dos deudas
- **WHEN** debe 18400 al banco (termina en octubre de 2028) y 1500 a su hermano
- **THEN** el indicador dice Bs 19.900 y «sin préstamos en oct 2028»
