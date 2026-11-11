# Spec Delta

## Purpose

Registra lo que la persona debe y lo que le deben, cómo baja cada deuda con sus pagos y cuánto interés le cuesta, para que el patrimonio y la proyección digan la verdad.

## ADDED Requirements

### Requirement: DEU-01 Tipos de deuda
El sistema SHALL permitir registrar tres tipos de deuda, en Bs o US$: préstamo (saldo, interés anual, cuota mensual y día de pago), deuda con una persona (saldo sin interés y fecha esperada opcional) y dinero que te deben (saldo y fecha esperada opcional).

#### Scenario: Préstamo del banco
- **WHEN** la persona registra un préstamo de Bs 18.400 al 14 % anual con cuota de Bs 900 el día 20
- **THEN** aparece en Plan con «14 % · cuota Bs 900» y su saldo resta del patrimonio

### Requirement: DEU-02 Interés y capital de cada pago
El sistema SHALL dividir cada pago de un préstamo en interés (saldo × interés anual ÷ 12, redondeado a centavos) y capital (el resto). El interés SHALL contar como gasto en la categoría Intereses; el capital MUST NOT contar como gasto.

#### Scenario: Cuota de noviembre
- **WHEN** el préstamo tiene saldo 18400 al 14 % y se paga la cuota de 900
- **THEN** el interés es 214,67 (gasto en Intereses), el capital 685,33 y el saldo queda en 17714,67

### Requirement: DEU-03 Pagar, cobrar y prestar
El sistema SHALL registrar como movimientos de una cuenta el pago de una deuda (baja su saldo), el cobro de lo que te deben (baja lo pendiente) y el préstamo dado (crea o sube un «te deben»). Una deuda con una persona y un cobro MUST NOT tener interés.

#### Scenario: El amigo paga
- **WHEN** el amigo que debía 400 paga 400 en efectivo
- **THEN** Efectivo sube 400, «te deben» queda en 0 y el patrimonio no cambia

### Requirement: DEU-04 Estado de cada deuda
El sistema SHALL mostrar el saldo de cada deuda y, en un préstamo, cuándo termina y cuánto interés pagará en total a la cuota actual. Si la cuota no cubre el interés del mes, SHALL avisar que la deuda crece.

#### Scenario: Fin del préstamo
- **WHEN** el préstamo tiene saldo 18400 al 14 % con cuota 900 desde noviembre de 2026
- **THEN** dice que termina en octubre de 2028, en 24 cuotas, con Bs 2.744 de interés

### Requirement: DEU-05 Próximas cuotas
El sistema SHALL mostrar en el detalle de un préstamo las próximas 3 cuotas con su interés, su capital y el saldo que queda.

#### Scenario: Tres cuotas
- **WHEN** se abre el préstamo de 18400 al 14 % con cuota 900
- **THEN** muestra noviembre 214,67 / 685,33 / 17714,67, diciembre 206,67 / 693,33 / 17021,34 y enero 198,58 / 701,42 / 16319,92
