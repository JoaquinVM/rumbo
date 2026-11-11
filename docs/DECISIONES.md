# Decisiones

Registro de las decisiones tomadas al construir Rumbo, con su motivo. Las de producto que tomó Joaquín van marcadas
(J); las que tomó Claude al implementar, (C). Una decisión se cambia agregando otra que la reemplace.

## Producto (antes de implementar)

1. (J) Rumbo es un sistema propio, independiente de Steady, en `~/Proyectos/rumbo`. (9/11/2026)
2. (J) Bs y dólares, con un tipo de cambio que pone la persona; arranca con efectivo y banco en Bs.
3. (J) Anotar a mano rápido; frase, voz, foto, extracto y pareja quedan fuera de v1.
4. (J) Cuentas con saldo; fijos mensuales que preguntan antes de registrarse.
5. (J) Deudas de 3 tipos, metas como apartado virtual, categorías editables sin subcategorías, topes mensuales simples.
6. (J) Mes «mixto»: el día a día hasta el próximo ingreso; reportes y topes por mes de calendario.
7. (J) Ingresos: base fija más irregulares; la proyección usa un irregular esperado que pone la persona.
8. (J) Proyección en plata de hoy con inflación propia; rendimiento por cuenta; respaldo descargable.
9. (J) Estilo Bloques sólidos; íconos SVG, nunca letras; botones con estilo propio en tinta oscura.
10. (J) Requisitos en OpenSpec, con el mismo stack (una página, artifact, sin librerías). (10/11/2026)
11. (J) Construir todo v1 sin preguntas intermedias; las specs que redacte Claude quedan aprobadas. (10/11/2026)

## Implementación

12. (C) Metas se construye antes que Fijos y Hoy, porque el libre resta lo que falta apartar.
13. (C) Interés de un pago = saldo × tasa ÷ 12 redondeado a centavos; se guarda interés y capital en el movimiento.
14. (C) Ejemplo del préstamo con números exactos: adelantando Bs 300 termina en mar 2028, 7 meses antes, Bs 753 menos.
16. (C) El modelo de datos de v1 se escribe completo desde el primer cambio (las 9 colecciones de `docs/DOMINIO.md`),
    porque los 7 cambios lo comparten; cada cambio suma sus pantallas y reglas encima.
17. (C) El saldo de una cuenta suma todos sus movimientos sin mirar la fecha: el saldo inicial es «el de hoy» al crearla
    y se asume que los movimientos se anotan después.
18. (C) Un fijo guarda el mes en que se creó (`desde`) y solo genera pendientes desde ese mes; «Por confirmar» mira el mes
    actual y el anterior, para no acumular meses viejos.
19. (C) El ícono de un fijo sale de su nombre cuando es reconocible (luz, internet, streaming, cuota, sueldo) y si no, de
    su categoría.
20. (C) Proyección: las cuentas crecen con un rendimiento ponderado por saldo (igual al de cada cuenta en el primer mes);
    cada préstamo se amortiza aparte y, al terminar, su cuota deja de salir.
21. (C) En modo oscuro el color de acción se invierte (botón claro con texto oscuro) para que «lo oscuro se toca» siga
    siendo «lo que contrasta se toca».
22. (C) Los 7 cambios se implementaron en un solo pase de código sobre el mismo `index.html` (comparten modelo y
    pantallas) y se archivan juntos en OpenSpec; cada uno conserva su propuesta, deltas y tareas en el archivo.
23. (C) El movimiento de un fijo confirmado usa el id `m_<fijo>_<mes>`: dos pestañas que confirman a la vez escriben el
    mismo documento y no duplican el gasto.
24. (C) Pagar una deuda propone la cuenta del fijo de su cuota; si no hay, la última cuenta usada en la misma moneda.
25. (C) El Desglose abre en el mes en curso aunque el sueldo todavía no haya llegado; por eso «de cada Bs 100» puede
    pasar de 100 a principio de mes. Se deja así para no esconder el mes actual.
26. (C) El ejemplo usa un irregular esperado de Bs 2.000 para mostrar metas que «van bien».
27. (C) Un fijo quitado queda inactivo (no se borra) para conservar su historia; una meta archivada libera lo apartado.
28. (C) Las tareas de publicar quedan sin marcar en cada cambio hasta que Joaquín dé el sí; los cambios se archivan
    igual, porque el código ya cumple sus specs en la rama.
29. (C) Trabajo en la rama `v1`, un commit por cambio; publicar el artifact y mergear a main quedan para el sí de
    Joaquín al final, como piden `CLAUDE.md` y Foundry.
30. (C) 10/11/2026, prueba en pantalla con la sesión de Joaquín: al empezar, la app volvía unos segundos al ejemplo porque
    reemplazar los datos borraba primero el documento principal. Ahora reemplazar borra solo lo que sobra y escribe el
    principal al final, «Borrar todo» borra primero el principal, y mientras dura cualquiera de los dos la app no toma
    las fotos a medias de la base. Lo cubre `pruebas/nube.mjs`, con una base falsa.
