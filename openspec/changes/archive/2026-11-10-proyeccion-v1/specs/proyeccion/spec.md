# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
