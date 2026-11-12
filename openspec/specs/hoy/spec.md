# hoy Specification

## Purpose

Dice cuánto le queda a la persona para lo variable y cuánto puede gastar por día, para que las decisiones de hoy no rompan el rumbo.

## Requirements

### Requirement: HOY-02 Libre del mes
El sistema SHALL calcular el libre como disponible (HOY-01) − fijos de gasto de cuentas para el día a día que vencen antes del próximo ingreso fijo y no están confirmados ni saltados (incluidos los vencidos) − lo que falta apartar este mes para las metas (MET-03).

#### Scenario: Libre calculado
- **WHEN** el disponible es 4200, faltan pagar Luz 180, Streaming 60, Internet 200 y Cuota 900 antes del sueldo del 25, y falta apartar 500
- **THEN** el libre es 2360

#### Scenario: Fijo de una cuenta que no es del día a día
- **WHEN** un curso de US$ 50 se paga desde Dólares, que no es del día a día
- **THEN** el libre no lo resta

### Requirement: HOY-03 Monto al día
El sistema SHALL dividir el libre entre los días desde hoy hasta el día anterior al próximo ingreso fijo, contando hoy. Sin ingresos fijos, SHALL contar hasta fin de mes.

#### Scenario: Monto al día
- **WHEN** el libre es 2360, hoy es 10 y el sueldo llega el 25
- **THEN** el sistema muestra Bs 157 al día por 15 días

#### Scenario: Sin ingresos fijos
- **WHEN** no hay ningún fijo de ingreso, el libre es 600 y hoy es 25 de un mes de 30 días
- **THEN** el sistema muestra Bs 100 al día por 6 días

### Requirement: HOY-05 Libre negativo
El sistema SHALL decir que ya se gastó más de lo disponible, en lugar de un monto por día, cuando el libre es negativo.

#### Scenario: Pasarse
- **WHEN** el libre es −300
- **THEN** el sistema muestra −Bs 300 y «te pasaste Bs 300 de lo disponible»

### Requirement: HOY-01 Disponible
El sistema SHALL calcular el disponible como la suma de los saldos de las cuentas marcadas «para el día a día», en Bs, menos lo apartado para metas en esas cuentas (MET-02).

#### Scenario: Dos cuentas del día a día
- **WHEN** Efectivo tiene 650, Banco 3550 y Dólares (no es del día a día) US$ 1.200, sin nada apartado en Efectivo ni Banco
- **THEN** el disponible es 4200

#### Scenario: Apartado en una cuenta del día a día
- **WHEN** Banco tiene 3550 con 500 apartados para una meta y Efectivo 650
- **THEN** el disponible es 3700

### Requirement: HOY-04 Ingreso irregular sube el libre
El sistema SHALL sumar al disponible, en el momento en que se anota, un ingreso variable que entra a una cuenta del día a día.

#### Scenario: Retiro del negocio
- **WHEN** el libre es 2360 y la persona anota un ingreso de 1200 en Banco
- **THEN** el libre pasa a 3560
