# Proposal

## Why

El prototipo arranca en pesos mexicanos, no ofrece bolivianos y trata «lo que tienes hoy» como un número escrito a mano, que nunca cuadra con el banco. La v1 necesita una base real: dinero en cuentas, en Bs o US$, con saldos que se calculan de los movimientos. Va primero porque todo lo demás depende de ella, y lleva el respaldo para que exista antes de guardar datos reales.

## What Changes

- **BREAKING** Moneda base fija en bolivianos, formato «Bs 1.234,50»; se quita la elección de moneda.
- Nueva capability de cuentas: cuentas en Bs o US$ con saldo inicial, rendimiento y «para el día a día», saldo calculado, cuadrar con un ajuste visible, tipo de cambio con aviso a los 7 días y patrimonio calculado.
- Cada movimiento sale de una cuenta o entra a ella; nuevo tipo transferencia, con dos montos cuando cambia la moneda.
- El formulario de anotar recuerda la última cuenta, ordena las categorías por uso y sugiere notas.
- **BREAKING** «Lo que tienes hoy», el rendimiento único y el ahorro mensual salen de Ajustes: el punto de partida es el patrimonio, el rendimiento va por cuenta y el ahorro se planifica con metas (cambio siguiente).
- Categorías base: se suman Intereses y Negocio y sale Deudas.
- Empezar pide cuentas con su saldo de hoy; nuevo respaldo descargable y cargable.
- La pestaña Fijos pasa a Plan, con el patrimonio, las cuentas y los fijos.

## Capabilities

### New Capabilities
- `cuentas`: dónde está el dinero, sus saldos, el tipo de cambio y el patrimonio.

### Modified Capabilities
- `formato`: FMT-01 pasa a Bs fijo; se agregan FMT-02 (decimales) y FMT-04 (US$).
- `movimientos`: MOV-01 con cuenta y transferencia; MOV-04 con filtro por cuenta; se agregan MOV-02 y MOV-03.
- `proyeccion`: PRO-03 parte del patrimonio y usa el rendimiento de cada cuenta.
- `indicadores`: IND-02 usa el saldo de las cuentas.
- `ajustes`: se quita AJU-05 (moneda, «lo que tienes hoy», rendimiento único y ahorro mensual); se agrega AJU-04 (tipo de cambio).
- `hoy`: HOY-02 deja de restar el ahorro mensual, que pasan a cubrir las metas.
- `categorias`: LIM-02 cambia la lista base.
- `datos`: DAT-02 pide cuentas; se agrega DAT-04 (respaldo).
- `pantallas`: PAN-01 cambia Fijos por Plan; se agrega PAN-03.

## Impact

- `index.html`: modelo de datos nuevo (ver design.md), formulario de anotar, Plan, Ajustes y Empezar.
- Base del artifact: colecciones nuevas `cuentas`, `categorias` y campos nuevos en `movs`. No hay datos reales de v0 (DAT-05), así que no hay migración.
- Toca dinero y datos guardados: en Foundry es Crisol.
