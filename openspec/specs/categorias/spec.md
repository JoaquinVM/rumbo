# categorias Specification

## Purpose

Da nombre al «para qué» de cada gasto y al «de dónde» de cada ingreso, para agrupar y comparar.

## Requirements

### Requirement: LIM-02 Categorías base
El sistema SHALL ofrecer estas categorías base. De gasto: Comida fuera, Súper, Casa, Transporte, Salud, Ocio, Compras, Suscripciones, Educación, Intereses y Otros. De ingreso: Sueldo, Negocio, Ventas, Extra y Otros. Cada una tiene su color y su ícono.

#### Scenario: Elegir categoría
- **WHEN** la persona anota un gasto
- **THEN** puede elegir entre las 11 categorías de gasto, y Deudas ya no aparece

### Requirement: LIM-01 Categorías editables
El sistema SHALL permitir crear categorías propias y renombrar, cambiar el color, cambiar el ícono y archivar cualquier categoría. No hay subcategorías. Una categoría archivada MUST NOT perder sus movimientos ni sus fijos.

#### Scenario: Archivar una categoría usada
- **WHEN** la persona archiva Educación, que tiene 6 movimientos
- **THEN** Educación deja de ofrecerse al anotar y sus 6 movimientos siguen en Movimientos y en el Desglose de sus meses

### Requirement: LIM-03 Tope mensual
El sistema SHALL permitir poner un tope mensual a una categoría de gasto. El avance SHALL contar los gastos de esa categoría en el mes de calendario, incluidos los fijos confirmados; lo que sobra MUST NOT pasar al mes siguiente.

#### Scenario: Comida fuera en octubre
- **WHEN** Comida fuera tiene tope 1000 y en octubre se gastaron 1150
- **THEN** el avance es 115 % y en noviembre el tope vuelve a empezar en 0 de 1000

### Requirement: LIM-04 Avisos de tope
El sistema SHALL avisar en Rumbo y en el Desglose cuando una categoría llega al 80 % de su tope (ámbar) y cuando lo pasa (rojo), con cuánto lleva o cuánto se pasó.

#### Scenario: Cerca del tope
- **WHEN** Comida fuera lleva 850 de un tope de 1000
- **THEN** Rumbo muestra en ámbar «Comida fuera: llevas Bs 850 de tu tope de Bs 1.000 (85 %)»

#### Scenario: Pasado del tope
- **WHEN** Comida fuera lleva 1150 de un tope de 1000
- **THEN** el Desglose la muestra en rojo con «Te pasaste Bs 150»
