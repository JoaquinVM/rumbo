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
El sistema SHALL calcular el neto del ritmo como fijos de ingreso − fijos de gasto + promedio de los ingresos variables − promedio de los gastos variables por categoría de los últimos 90 días. El promedio cuenta desde el primer movimiento de esa ventana, con un mínimo de 1 mes y un máximo de 3.

#### Scenario: Variable de dos meses
- **WHEN** hay fijos de 10000 de ingreso y 3000 de gasto, y 1200 de comida en los últimos 2 meses
- **THEN** el gasto variable promedio de comida es 600 y el neto es 6400

#### Scenario: Movimientos viejos no cuentan
- **WHEN** hay un gasto de hace 200 días
- **THEN** no entra en el promedio

### Requirement: PRO-03 Punto de partida y rendimiento
El sistema SHALL partir de «lo que tienes hoy» escrito en Ajustes y, cada mes, SHALL sumar el neto y aplicar el rendimiento anual (dividido entre 12) solo si el saldo es positivo.

#### Scenario: Rendimiento sobre saldo positivo
- **WHEN** el saldo es 12000, el rendimiento 12 % y el neto 0
- **THEN** el mes siguiente es 12120

#### Scenario: Una deuda no rinde
- **WHEN** el saldo es −5000 y el neto 0
- **THEN** sigue en −5000 al cabo de 12 meses

### Requirement: PRO-07 Aviso de que los ahorros se acaban
El sistema SHALL decir en el titular en qué mes llega a cero cuando, a este ritmo, la proyección cruza cero.

#### Scenario: Neto negativo
- **WHEN** tiene 1000 y el neto es −3000 al mes
- **THEN** el titular dice «A este ritmo, tus ahorros se acaban en» y el mes siguiente

### Requirement: PRO-08 ¿Y si…?
El sistema SHALL permitir recortar de 0 a 60 % las 4 categorías variables más grandes y sumar un ingreso extra al mes, dibujando una segunda línea y la diferencia al horizonte.

#### Scenario: Recortar la mitad de comida
- **WHEN** comida promedia 600 al mes y la persona la recorta 50 % y suma 1000 de ingreso extra
- **THEN** el neto ajustado sube 1300
