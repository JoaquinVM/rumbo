## MODIFIED Requirements

### Requirement: FMT-02 Decimales según dónde se muestra
El sistema SHALL mostrar con 2 decimales los movimientos y el saldo de cada cuenta en su moneda, tanto en Plan como en los botones para elegir una cuenta (al anotar, transferir o pagar). SHALL mostrar sin decimales los resúmenes, los totales de cuentas, el patrimonio, la gráfica, los indicadores y el equivalente en Bs de una cuenta en dólares.

#### Scenario: Movimiento y resumen
- **WHEN** un gasto es de 35 y el gastado del mes es 3073,40
- **THEN** el movimiento dice «−Bs 35,00» y el resumen «Bs 3.073»

#### Scenario: Saldo de cada cuenta
- **WHEN** Banco tiene 3180,40 y Efectivo 650
- **THEN** Plan muestra «Bs 3.180,40» y «Bs 650,00», y el total de Cuentas «Bs 3.830»

#### Scenario: Elegir la cuenta al anotar
- **WHEN** la persona anota un gasto y Banco tiene 3180,40
- **THEN** el botón de Banco dice «Banco · Bs 3.180,40»

### Requirement: FMT-04 Montos en dólares
El sistema SHALL mostrar los montos de cuentas en dólares como «US$ 1.234,50».

#### Scenario: Cuenta en dólares
- **WHEN** la cuenta Dólares tiene 1200
- **THEN** su saldo dice «US$ 1.200,00»

### Requirement: FMT-03 Lectura de montos escritos
El sistema SHALL leer un monto tal como se escribe: punto o coma de miles y punto o coma decimal, y SHALL guardarlo en centavos enteros (FMT-05). Un monto con más de 2 decimales MUST NOT guardarse: el sistema SHALL decir que use hasta 2 decimales.

#### Scenario: Separador de miles
- **WHEN** la persona escribe «1.500» o «1,500»
- **THEN** el sistema guarda 150000 centavos y muestra «Bs 1.500»

#### Scenario: Decimales con coma
- **WHEN** la persona escribe «12,50» o «1.500,50»
- **THEN** el sistema guarda 1250 y 150050 centavos

#### Scenario: Más de dos decimales
- **WHEN** la persona escribe «0,125» o «1.500,125»
- **THEN** el sistema no guarda y dice «Usa hasta 2 decimales»

#### Scenario: Tres cifras después de la coma son miles
- **WHEN** la persona escribe «12,345»
- **THEN** el sistema lo lee como Bs 12.345, como hoy, y guarda 1234500 centavos

## ADDED Requirements

### Requirement: FMT-05 Dinero en centavos enteros
El sistema SHALL guardar todo monto de dinero como un número entero de centavos de su moneda (Bs o US$) y SHALL calcular saldos de cuentas y deudas, patrimonio, disponible, libre, topes y Desglose sumando centavos enteros, sin decimales intermedios. Cuando un cálculo produce fracciones de centavo (interés de un pago, conversión de dólares a Bs, aporte de una meta), SHALL redondear a centavo, la mitad hacia arriba en valor absoluto, en el mismo punto donde la v1 redondeaba. El tipo de cambio, la inflación, los rendimientos y las tasas de interés MUST NOT guardarse en centavos: no son dinero. Las estimaciones a futuro (ritmo, proyección, «¿Y si…?») SHALL partir de centavos y redondearse a centavo al mostrarse. Todo escenario de las specs SHALL dar el mismo resultado que en la v1.

#### Scenario: Interés de la cuota
- **WHEN** el préstamo tiene saldo 1840000 centavos (Bs 18.400) al 14 % y se paga la cuota de Bs 900
- **THEN** el interés es 21467 centavos, el capital 68533 y el saldo queda en 1771467 (Bs 17.714,67), como en DEU-02

#### Scenario: Suma sin errores de decimales
- **WHEN** Efectivo empieza en Bs 0,10 y recibe un ingreso de Bs 0,20
- **THEN** su saldo es exactamente 30 centavos y se muestra «Bs 0,30»

#### Scenario: Gasto en dólares
- **WHEN** en octubre se gastaron US$ 20 (2000 centavos de dólar) con tipo de cambio 12,5
- **THEN** el Desglose de octubre cuenta 25000 centavos de boliviano (Bs 250), como en MOV-06

#### Scenario: Tipo de cambio con decimales
- **WHEN** la persona pone el tipo de cambio en 12,47
- **THEN** se guarda 12,47 como tipo de cambio, sin pasarlo a centavos
