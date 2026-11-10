# Requisitos de Rumbo

Pedido de origen (Joaquín, 9/11/2026): «una app para administrar mi dinero, completa pero simple y que te dé gusto usar.
Que realmente te haga entender a dónde te llevan tus ingresos y gastos actuales».

Estado: **v0, prototipo.** Todo lo de abajo está construido y cubierto por `npm run verificar`, salvo lo marcado.

| ID | Requisito | Prueba |
| --- | --- | --- |
| RUM-01 | Sin datos guardados, la app muestra un ejemplo marcado como tal y no guarda nada hasta «Empezar con mis datos» (moneda, lo que tiene hoy, ingreso fijo y gastos fijos). | verificar |
| RUM-02 | Proyección mes a mes a 1, 5, 10 o 20 años desde «lo que tienes hoy». El rendimiento anual solo crece saldos positivos; una deuda no crece. | verificar |
| RUM-03 | El ritmo mensual son los fijos completos más el promedio de lo variable de los últimos 90 días (desde el primer movimiento de esa ventana, mínimo 1 mes y máximo 3). | verificar |
| RUM-04 | «¿Y si…?»: recortar 0–60 % de las 4 categorías variables más grandes y sumar un ingreso extra, con una segunda línea en la gráfica y la diferencia al horizonte. | verificar |
| RUM-05 | Si a este ritmo los ahorros se acaban, el titular dice en qué mes. | verificar |
| RUM-06 | Tres indicadores: tasa de ahorro, colchón en meses y neto al mes. | a mano |
| RUM-07 | «Este mes»: lo libre para lo variable (ingresos − fijos − ahorro apartado − variable gastado) y cuánto por día. | a mano |
| RUM-08 | Fijos (ingresos y gastos que se repiten cada mes): se anotan una vez y se cuentan solos. Solo se anota lo variable. | a mano |
| RUM-09 | Movimientos por mes, agrupados por día, con alta, edición y borrado en dos toques. | a mano |
| RUM-10 | Desglose del mes: por cada 100 que entran a dónde va cada categoría, horas de trabajo que cuesta y cuánto suma en 10 años. | a mano |
| RUM-11 | Datos privados por persona en la base del artifact; si no hay base, solo en el navegador, y lo dice. | a mano |
| RUM-12 | Los montos se leen como se escriben: punto o coma de miles (`1.500`, `1,500` = 1500) y decimales (`12,50`, `1.500,50`). | verificar |
