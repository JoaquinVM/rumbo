# proyeccion Specification

## Purpose

Responde la pregunta central de Rumbo, a dónde lleva el ritmo actual, y deja probar qué cambiaría ese rumbo.

## Requirements

### Requirement: PRO-01 Titular y gráfica del rumbo
El sistema SHALL decir en una frase cuánto tendrá la persona a este ritmo al horizonte elegido (1, 5, 10 o 20 años) y SHALL dibujar la proyección mes a mes.

#### Scenario: Horizonte de 5 años
- **WHEN** la persona elige 5 años
- **THEN** el titular dice «A este ritmo, en 5 años tendrás …» y la gráfica cubre 60 meses

### Requirement: PRO-02 Ritmo mensual
El sistema SHALL calcular el neto del ritmo como fijos de ingreso + ingreso irregular esperado (AJU-01) − fijos de gasto − promedio de los gastos variables por categoría de los últimos 90 días. El promedio cuenta desde el primer movimiento de esa ventana, con un mínimo de 1 mes y un máximo de 3. Los ingresos variables reales MUST NOT entrar en el ritmo.

#### Scenario: Variable de dos meses
- **WHEN** hay fijos de 10000 de ingreso y 3000 de gasto, 1200 de comida en los últimos 2 meses y el irregular esperado es 0
- **THEN** el gasto variable promedio de comida es 600 y el neto es 6400

#### Scenario: Movimientos viejos no cuentan
- **WHEN** hay un gasto de hace 200 días
- **THEN** no entra en el promedio

#### Scenario: Irregular esperado en vez del real
- **WHEN** el irregular esperado es 1500 y el promedio real de ingresos variables es 1740
- **THEN** el ritmo suma 1500

### Requirement: PRO-03 Punto de partida y rendimiento
El sistema SHALL partir del patrimonio de hoy (CTA-05) y, cada mes, SHALL hacer crecer cada cuenta con su propio rendimiento anual (dividido entre 12) solo si su saldo es positivo, y sumar el neto del ritmo.

#### Scenario: Rendimiento sobre saldo positivo
- **WHEN** Banco tiene 12000 al 12 % anual, Efectivo 1000 al 0 % y el neto es 0
- **THEN** el mes siguiente el patrimonio es 13120

#### Scenario: Una deuda no rinde
- **WHEN** el patrimonio es −5000 y el neto 0
- **THEN** sigue en −5000 al cabo de 12 meses

### Requirement: PRO-07 Aviso de que los ahorros se acaban
El sistema SHALL decir en el titular en qué mes llega a cero cuando, a este ritmo, la proyección cruza cero.

#### Scenario: Neto negativo
- **WHEN** tiene 1000 y el neto es −3000 al mes
- **THEN** el titular dice «A este ritmo, tus ahorros se acaban en» y el mes siguiente

### Requirement: PRO-08 ¿Y si…?
El sistema SHALL permitir recortar de 0 a 60 % las 4 categorías variables más grandes, sumar un ingreso extra al mes y adelantar un pago extra al mes a un préstamo, dibujando una segunda línea y la diferencia al horizonte. Al adelantar, SHALL decir cuántos meses antes termina el préstamo, cuánto interés se ahorra y a cuánto baja el libre al día.

#### Scenario: Recortar la mitad de comida
- **WHEN** comida promedia 600 al mes y la persona la recorta 50 % y suma 1000 de ingreso extra
- **THEN** el neto ajustado sube 1300

#### Scenario: Adelantar el préstamo
- **WHEN** la persona adelanta 300 al mes al préstamo de 18400 al 14 % con cuota 900, con el libre en 2360 por 15 días
- **THEN** el sistema dice que termina en marzo de 2028, 7 meses antes, con Bs 753 menos de interés, y que el libre baja a Bs 137 al día

### Requirement: PRO-05 Plata de hoy
El sistema SHALL mostrar la proyección, el titular y «¿Y si…?» en plata de hoy, dividiendo cada mes por (1 + inflación anual) elevado a los años transcurridos, y SHALL permitir cambiar a montos nominales con un toque.

#### Scenario: Cinco años al 8 %
- **WHEN** la proyección nominal a 5 años es Bs 146.933 y la inflación es 8 %
- **THEN** el titular dice Bs 100.000 en plata de hoy y, en nominal, Bs 146.933

### Requirement: PRO-06 Tipo de cambio constante
El sistema SHALL proyectar las cuentas en dólares con el tipo de cambio de hoy y SHALL decirlo debajo de la gráfica.

#### Scenario: Nota del tipo de cambio
- **WHEN** hay una cuenta en dólares y el tipo es 12,50
- **THEN** debajo de la gráfica dice «Tipo de cambio fijo en Bs 12,50»

### Requirement: PRO-04 Préstamos en la proyección
El sistema SHALL amortizar cada préstamo mes a mes en la proyección con su interés y su cuota. Cuando un préstamo termina, su cuota SHALL dejar de salir del ritmo y el sistema SHALL decir en qué mes termina y cuánto más se ahorra desde ahí.

#### Scenario: Fin del préstamo en la gráfica
- **WHEN** el préstamo termina en octubre de 2028 con cuota de 900
- **THEN** la gráfica marca «oct 2028 · terminas el préstamo» y desde noviembre de 2028 el neto sube 900
