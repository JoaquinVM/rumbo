# Spec Delta

## Purpose

Deja planificar para qué se ahorra, reservar ese dinero sin moverlo y saber a tiempo si el ritmo alcanza para llegar.

## ADDED Requirements

### Requirement: MET-01 Crear una meta
El sistema SHALL permitir crear, editar y archivar metas con nombre, monto y fecha.

#### Scenario: Fondo de emergencia
- **WHEN** la persona crea «Fondo de emergencia», Bs 15.000, para diciembre de 2027
- **THEN** la meta aparece en Plan y en Rumbo con Bs 0 de Bs 15.000

### Requirement: MET-02 Apartar sin mover
El sistema SHALL permitir apartar dinero de una cuenta para una meta sin moverlo de esa cuenta, y desapartarlo. Lo apartado MUST NOT contar como disponible para gastar y la suma de lo apartado en una cuenta MUST NOT superar su saldo.

#### Scenario: Apartar en dólares
- **WHEN** la persona aparta US$ 320 de Dólares para el Fondo de emergencia con el tipo en 12,50
- **THEN** la meta lleva Bs 4.000, el saldo de Dólares sigue en US$ 1.200 y Dólares muestra US$ 320 apartados

#### Scenario: Apartar más que el saldo
- **WHEN** Efectivo tiene 650 y la persona intenta apartar 800
- **THEN** el sistema no lo permite y dice cuánto se puede apartar

### Requirement: MET-03 Aporte sugerido y lo que falta este mes
El sistema SHALL calcular el aporte sugerido al mes como (monto − apartado) ÷ meses que faltan, contando el mes actual y hasta el mes anterior a la fecha de la meta. Lo que falta apartar este mes SHALL ser el aporte sugerido menos lo apartado en el mes, nunca menos de cero.

#### Scenario: Fondo de emergencia en noviembre
- **WHEN** en noviembre de 2026 el Fondo de Bs 15.000 para diciembre de 2027 lleva Bs 4.000, de los cuales Bs 546 se apartaron este mes
- **THEN** el aporte sugerido es Bs 846 al mes y falta apartar Bs 300 este mes

### Requirement: MET-04 Avance de cada meta
El sistema SHALL mostrar en cada meta cuánto lleva, su fecha y su aporte sugerido, y SHALL marcar cada meta en la gráfica de la proyección en su fecha.

#### Scenario: Meta en la gráfica
- **WHEN** existe la meta Viaje para julio de 2027
- **THEN** la gráfica muestra una marca en julio de 2027 y la leyenda la nombra

### Requirement: MET-05 Vas bien o no alcanza
El sistema SHALL decir «Vas bien» cuando el neto del ritmo cubre la suma de los aportes sugeridos de todas las metas, y «No alcanza» con cuánto falta al mes en total cuando no la cubre.

#### Scenario: Alcanza
- **WHEN** el neto del ritmo es 2060 y las metas piden 846 + 975 = 1821
- **THEN** cada meta dice «Vas bien»

#### Scenario: No alcanza
- **WHEN** el neto del ritmo es 1500 y las metas piden 1821
- **THEN** las metas dicen «No alcanza» y «faltan Bs 321 al mes»
