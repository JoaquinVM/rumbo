# Spec Delta

## MODIFIED Requirements

### Requirement: DAT-02 Empezar con mis datos
El sistema SHALL pedir para empezar las cuentas con su saldo de hoy, el ingreso fijo mensual con la cuenta a la que entra y su día, el ingreso irregular que espera al mes y los gastos fijos principales con su día. Las deudas son opcionales.

#### Scenario: Empezar
- **WHEN** la persona escribe Efectivo 650, Banco 3550, sueldo 8000 al Banco el día 25 y renta 2500 el día 5
- **THEN** se crean las dos cuentas, el fijo «Sueldo» el día 25 y el fijo «Renta» el día 5, y Rumbo muestra el libre hasta el 25
