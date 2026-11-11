# Spec Delta

## MODIFIED Requirements

### Requirement: DAT-02 Empezar con mis datos
El sistema SHALL pedir para empezar las cuentas con su saldo de hoy, el ingreso fijo mensual con la cuenta a la que entra y los gastos fijos principales.

#### Scenario: Empezar
- **WHEN** la persona escribe Efectivo 650, Banco 3550, ingreso fijo 8000 al Banco y renta 2500
- **THEN** se crean las dos cuentas con esos saldos, el fijo «Sueldo» y el fijo «Renta», y Rumbo muestra un patrimonio de Bs 4.200

## ADDED Requirements

### Requirement: DAT-04 Respaldo
El sistema SHALL permitir descargar un archivo con todos los datos de la persona y cargarlo de vuelta. Antes de reemplazar, SHALL mostrar qué trae (cuántas cuentas, movimientos y fijos) y pedir confirmación.

#### Scenario: Cargar un respaldo
- **WHEN** la persona carga un respaldo con 3 cuentas, 214 movimientos y 6 fijos
- **THEN** el sistema muestra esos conteos y solo reemplaza sus datos después de que confirme

#### Scenario: Archivo que no es de Rumbo
- **WHEN** la persona carga un archivo que no es un respaldo de Rumbo
- **THEN** el sistema no cambia nada y explica que el archivo no sirve
