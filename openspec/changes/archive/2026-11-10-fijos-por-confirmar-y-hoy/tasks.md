# Tasks

## 1. Fijos con cuenta y día

- [x] 1.1 Agregar cuenta y día al formulario y a los fijos guardados, con la regla del último día del mes, y verificar con la prueba FIJ-01 (día 31 en febrero = 28)
- [x] 1.2 Mostrar el día en Plan («Casa · Banco · día 5») según el mockup «6 · Plan» y verificar a 375 px

## 2. Por confirmar

- [x] 2.1 Agregar la colección `ocurrencias` con id `<fijoId>_<AAAA-MM>` y el cálculo de pendientes, y verificar con la prueba FIJ-05 que un fijo sin confirmar no cambia el saldo
- [x] 2.2 Implementar «Confirmar» (con monto editable) y «No este mes», y verificar con la prueba FIJ-02 (Luz confirmada por 195 crea un gasto de 195)
- [x] 2.3 Dibujar el bloque ámbar Por confirmar y los próximos fijos según el mockup «1 · Rumbo», y verificar con dos pestañas abiertas que confirmar dos veces crea un solo movimiento

## 3. Hoy

- [x] 3.1 Implementar disponible, próximo ingreso fijo, libre y monto al día, y verificar con las pruebas HOY-01 (4200 y 3700 con apartado), HOY-02 (2360), HOY-03 (157 por 15 días y 100 por 6 días) y HOY-04 (3560)
- [x] 3.2 Dibujar el bloque azul Hoy con su desglose y poner Rumbo en el orden de PAN-02, y verificar con el mockup «1 · Rumbo»

## 4. Empezar

- [x] 4.1 Pedir el día del sueldo y de cada gasto fijo, y el ingreso irregular esperado, y verificar con la prueba DAT-02

## 5. Publicar

- [ ] 5.1 Publicar el artifact con el sí de Joaquín y verificar en la versión publicada que confirmar un fijo cambia el saldo de su cuenta
