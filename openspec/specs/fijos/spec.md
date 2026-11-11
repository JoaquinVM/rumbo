# fijos Specification

## Purpose

Registra los ingresos y gastos que se repiten cada mes, para que la persona solo tenga que anotar lo variable.

## Requirements

### Requirement: FIJ-01 Definir un fijo
El sistema SHALL permitir crear, editar y quitar fijos mensuales con nombre, tipo (gasto o ingreso), monto, cuenta, categoría y día del mes (1 a 31). Si un mes no tiene ese día, el fijo cae el último día del mes.

#### Scenario: Crear la renta
- **WHEN** la persona agrega el fijo «Renta», gasto, 2500, desde Banco, categoría Casa, día 5
- **THEN** el fijo aparece en Plan con «Casa · Banco · día 5»

#### Scenario: Día 31 en febrero
- **WHEN** un fijo es el día 31 y el mes es febrero de 2027
- **THEN** su día en ese mes es el 28

### Requirement: FIJ-02 Por confirmar
El sistema SHALL mostrar en «Por confirmar» cada fijo cuyo día ya llegó en el mes y que no está confirmado ni saltado, con su monto editable. «Confirmar» SHALL crear el movimiento en su cuenta; «No este mes» SHALL saltarlo. El fijo sigue pendiente hasta que se elija una de las dos.

#### Scenario: Confirmar la luz con otro monto
- **WHEN** la Luz de 180 venció el 8 y la persona la confirma por 195
- **THEN** se crea un gasto de 195 en Banco en Casa y la Luz sale de Por confirmar

#### Scenario: Saltar un mes
- **WHEN** la persona elige «No este mes» en el Streaming de 60
- **THEN** no se crea ningún movimiento y el Streaming sale de Por confirmar hasta el mes siguiente

### Requirement: FIJ-05 Un fijo pendiente no cuenta como pagado
El sistema MUST NOT registrar un fijo por su cuenta. Un fijo sin confirmar MUST NOT cambiar el saldo de su cuenta ni contar como gasto o ingreso del mes.

#### Scenario: Renta sin confirmar
- **WHEN** la Renta de 2500 venció y no se confirmó
- **THEN** el saldo del Banco no baja y el Desglose del mes no incluye esa renta

### Requirement: FIJ-04 Cuota de una deuda
El sistema SHALL permitir que un fijo sea la cuota de un préstamo; al confirmarlo, SHALL registrar un pago de deuda (DEU-02) en lugar de un gasto simple.

#### Scenario: Confirmar la cuota
- **WHEN** la persona confirma la cuota del préstamo de 900 el día 20
- **THEN** se registra un pago con 214,67 de interés y 685,33 de capital, y el préstamo baja a 17714,67
