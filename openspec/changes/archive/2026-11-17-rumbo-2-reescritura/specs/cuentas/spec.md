## MODIFIED Requirements

### Requirement: CTA-01 Crear y archivar cuentas
El sistema SHALL permitir crear cuentas con nombre, moneda (Bs o USD), saldo de hoy, rendimiento anual (0 si no rinde) y si es para el día a día (por defecto sí en Bs y no en USD). SHALL permitir editarlas y archivarlas; una cuenta archivada MUST NOT perder sus movimientos.

#### Scenario: Crear Banco
- **WHEN** la persona crea «Banco», Bs, saldo 3550, rendimiento 2 %
- **THEN** aparece en Plan con Bs 3.550,00 y marcada «Día a día»

#### Scenario: Archivar con movimientos
- **WHEN** la persona archiva una cuenta con 20 movimientos
- **THEN** la cuenta deja de ofrecerse al anotar y sus 20 movimientos siguen en Movimientos
