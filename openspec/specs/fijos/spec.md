# fijos Specification

## Purpose

Registra los ingresos y gastos que se repiten cada mes, para que la persona solo tenga que anotar lo variable.

## Requirements

### Requirement: FIJ-01 Definir un fijo
El sistema SHALL permitir crear, editar y quitar fijos mensuales con nombre, tipo (gasto o ingreso), monto y categoría.

#### Scenario: Crear la renta
- **WHEN** la persona agrega el fijo «Renta», gasto, 2500, categoría Casa
- **THEN** el fijo aparece en la pestaña Fijos y en el total mensual de gastos fijos

### Requirement: FIJ-03 Los fijos se cuentan solos
El sistema SHALL contar cada fijo completo en todos los meses, sin que la persona lo confirme.

#### Scenario: Fijo contado en el mes
- **WHEN** existe el fijo Renta de 2500 y no hay movimientos
- **THEN** el ritmo y el mes en curso incluyen 2500 de gasto
