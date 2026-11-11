# Spec Delta

## MODIFIED Requirements

### Requirement: FIJ-01 Definir un fijo
El sistema SHALL permitir crear, editar y quitar fijos mensuales con nombre, tipo (gasto o ingreso), monto, cuenta, categoría y día del mes (1 a 31). Si un mes no tiene ese día, el fijo cae el último día del mes.

#### Scenario: Crear la renta
- **WHEN** la persona agrega el fijo «Renta», gasto, 2500, desde Banco, categoría Casa, día 5
- **THEN** el fijo aparece en Plan con «Casa · Banco · día 5»

#### Scenario: Día 31 en febrero
- **WHEN** un fijo es el día 31 y el mes es febrero de 2027
- **THEN** su día en ese mes es el 28

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: FIJ-03 Los fijos se cuentan solos
**Reason**: Con cuentas reales, contar fijos sin confirmar hace que los saldos no cuadren con el banco.
**Migration**: Reemplazado por FIJ-02 (Por confirmar) y FIJ-05. Los fijos existentes reciben cuenta y día al editarse; no hay datos reales de v0 (DAT-05).
