# Design

## Context

Después de `base-bolivianos-y-cuentas` existen cuentas con saldo calculado y fijos sin día. Ver `docs/DOMINIO.md` (Fijo y Ocurrencia de fijo).

## Goals / Non-Goals

**Goals:**
- Saber, para cada fijo y mes, si está pendiente, confirmado o saltado, sin guardar nada calculado.
- Un único cálculo del libre que usen Rumbo, Deuda y «¿Y si…?».

**Non-Goals:**
- Fijos semanales o anuales (quedan en PENDIENTES).
- Crear o editar metas y apartados: vienen de `metas`, que va antes; aquí solo se leen para el disponible y el libre.

## Decisions

- **Ocurrencia como documento con id `<fijoId>_<AAAA-MM>`** en la colección `ocurrencias`. El id determinista impide confirmar dos veces el mismo mes, también con dos pestañas abiertas. Alternativa descartada: marcar el mes en el propio fijo, que mezcla historia con definición.
- **Confirmar crea el movimiento y la ocurrencia**; si la escritura del movimiento falla, no se escribe la ocurrencia y el fijo sigue pendiente.
- **Próximo ingreso fijo** = la fecha más cercana de hoy en adelante entre los fijos de ingreso activos sin ocurrencia del mes. Sin ingresos fijos, fin de mes.
- **Pendiente** = fijo activo cuyo día ya llegó (o llega antes del próximo ingreso) y sin ocurrencia para ese mes. Un pendiente de un mes anterior sigue en Por confirmar hasta resolverse.

## Risks / Trade-offs

- [La persona no confirma nunca] → El fijo sigue restando del libre como comprometido y Por confirmar lo muestra con «venció hace N días».
- [El sueldo llega un día antes del día fijado] → Confirmarlo antes es válido; la ocurrencia del mes queda resuelta y el próximo ingreso pasa al mes siguiente.
