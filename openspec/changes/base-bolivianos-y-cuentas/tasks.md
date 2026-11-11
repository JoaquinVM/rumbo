# Tasks

## 1. Formato en bolivianos

- [ ] 1.1 Cambiar el formateador de montos a Bs (es-BO) con 2 decimales en movimientos y sin decimales en resúmenes, y verificar con las pruebas FMT-01, FMT-02 y FMT-04 en `pruebas/verificar.mjs`
- [ ] 1.2 Quitar la elección de moneda de Ajustes y Empezar, y verificar que ninguna pantalla muestra «$» ni MXN

## 2. Cuentas y saldos

- [ ] 2.1 Agregar la colección `cuentas` y el formulario de cuenta (crear, editar, archivar), y verificar CTA-01 en el navegador
- [ ] 2.2 Implementar el saldo calculado por cuenta (gastos, ingresos, transferencias, ajustes) y verificar con la prueba CTA-02 del escenario de Banco = 3180
- [ ] 2.3 Implementar «Cuadrar» con movimiento de ajuste, y verificar con la prueba CTA-03 que el ajuste de −45 no cambia el gastado del mes
- [ ] 2.4 Implementar tipo de cambio con fecha, aviso a los 7 días y patrimonio en Bs y US$, y verificar con las pruebas CTA-04 y CTA-05 (patrimonio 19.200)

## 3. Movimientos con cuenta

- [ ] 3.1 Agregar cuenta a gastos e ingresos, el tipo transferencia con dos montos y la oferta de tipo de cambio, y verificar con las pruebas MOV-03 (Banco −1250, Dólares +100, gastado igual) y CTA-06
- [ ] 3.2 Recordar la última cuenta, ordenar categorías por uso y sugerir notas, y verificar MOV-02 en el mockup «2 · Anotar»
- [ ] 3.3 Agregar el filtro por cuenta en Movimientos, y verificar MOV-04 en el mockup «4 · Movimientos»

## 4. Ritmo, proyección y categorías

- [ ] 4.1 Hacer que la proyección parta del patrimonio con rendimiento por cuenta, y verificar con la prueba PRO-03 (13120)
- [ ] 4.2 Calcular el colchón con el saldo de las cuentas, y verificar con la prueba IND-02 (2,6 meses)
- [ ] 4.3 Sembrar las categorías base nuevas (con Intereses y Negocio, sin Deudas) con su ícono, y verificar LIM-02
- [ ] 4.4 Dejar en Ajustes solo horas y tipo de cambio, quitar el ahorro mensual del libre, y verificar AJU-04 y con la prueba HOY-02 (libre 3000)

## 5. Empezar, Plan y respaldo

- [ ] 5.1 Rehacer Empezar con cuentas, ingreso fijo con cuenta y gastos fijos, y verificar con la prueba DAT-02 (patrimonio 4.200)
- [ ] 5.2 Cambiar la pestaña Fijos por Plan con patrimonio, cuentas y fijos (mockup «6 · Plan»), y verificar PAN-01 y PAN-03 a 375 px
- [ ] 5.3 Implementar descargar y cargar respaldo con conteos y confirmación, y verificar con la prueba DAT-04 que un archivo ajeno no cambia nada

## 6. Publicar

- [ ] 6.1 Publicar el artifact con el sí de Joaquín y verificar en la versión publicada que una cuenta creada sobrevive a recargar
