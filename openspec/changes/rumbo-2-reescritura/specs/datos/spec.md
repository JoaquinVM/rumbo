## MODIFIED Requirements

### Requirement: DAT-04 Respaldo
El sistema SHALL permitir descargar un archivo con todos los datos de la persona y cargarlo de vuelta. El archivo SHALL guardar los montos en centavos (versión 2). Al cargar un respaldo de versión 1, con montos decimales, SHALL convertirlo a centavos con las reglas de DAT-08 antes de mostrarlo. Antes de reemplazar, SHALL mostrar qué trae (cuántas cuentas, movimientos y fijos) y pedir confirmación.

#### Scenario: Cargar un respaldo
- **WHEN** la persona carga un respaldo con 3 cuentas, 214 movimientos y 6 fijos
- **THEN** el sistema muestra esos conteos y solo reemplaza sus datos después de que confirme

#### Scenario: Archivo que no es de Rumbo
- **WHEN** la persona carga un archivo que no es un respaldo de Rumbo
- **THEN** el sistema no cambia nada y explica que el archivo no sirve

#### Scenario: Respaldo de la v1
- **WHEN** la persona carga un respaldo de versión 1 con Banco en 3550,5 y un gasto de 35
- **THEN** después de confirmar, Banco tiene saldo inicial 355050 centavos, el gasto 3500, y Rumbo muestra los mismos saldos que la v1

#### Scenario: Respaldo de la v1 con montos raros
- **WHEN** el respaldo de versión 1 trae un gasto de 12,555
- **THEN** el sistema no carga nada y dice qué movimiento tiene más de 2 decimales

## ADDED Requirements

### Requirement: DAT-08 Migración a centavos
El sistema SHALL pasar los datos guardados de la v1 a centavos una sola vez, con este orden: respaldo previo verificado; conversión de cada campo de dinero (monto × 100, que debe dar un entero); verificación; y solo entonces Rumbo 2 los usa. Los campos de dinero son: en Ajustes, `irregular`; en cuentas, `saldoInicial`; en categorías, `tope`; en movimientos, `monto`, `montoDestino`, `interes` y `capital`; en fijos, `monto`; en deudas, `saldoInicial` y `cuota`; en metas, `monto`; y en apartados, `monto`. Ningún otro campo SHALL cambiar; en particular el `interes` de una deuda es una tasa y MUST NOT cambiar. Si un monto tiene más de 2 decimales o no es un número, la migración MUST NOT cambiar nada y SHALL listar esos documentos para que la persona decida. La verificación SHALL comprobar que los conteos de documentos son iguales y que cada saldo de cuenta y de deuda, el patrimonio, el disponible, el libre y el Desglose de cada mes dan lo mismo que en la v1. La migración SHALL poder deshacerse sin perder lo anotado después: los centavos ÷ 100 vuelven a los decimales de la v1.

#### Scenario: Migrar los datos de Joaquín
- **WHEN** se migra una base con Banco en saldo inicial 3550, un gasto de 35,50 y un préstamo al 14 % con cuota 900
- **THEN** Banco queda en 355000 centavos, el gasto en 3550, la cuota en 90000, la tasa sigue en 14, y Rumbo 2 muestra los mismos saldos, patrimonio y libre que la v1

#### Scenario: Un monto que no se puede pasar a centavos
- **WHEN** un movimiento guardado tiene monto 12,555
- **THEN** la migración no cambia ningún documento y lista ese movimiento

#### Scenario: Verificación que no cuadra
- **WHEN** después de convertir, el saldo de Banco en Rumbo 2 no da lo mismo que en la v1
- **THEN** la migración se detiene, Rumbo 2 no se usa con esos datos y la v1 sigue funcionando con los suyos

#### Scenario: Volver a la v1 después del corte
- **WHEN** Rumbo 2 ya está en uso, la persona anotó un gasto de Bs 20 y hay que volver a la v1
- **THEN** los datos vuelven a decimales, la v1 muestra el gasto de 20 y los saldos de antes más ese gasto

### Requirement: DAT-09 Validación compartida
El sistema SHALL validar cada documento con las mismas reglas en la página, antes de guardar, y en el servidor, antes de escribir: que cada monto sea un entero de centavos, que el tipo y la moneda sean de los conocidos, que las fechas tengan la forma AAAA-MM-DD y que estén los campos que su tipo pide. El servidor SHALL rechazar con 400, sin escribir nada, un documento que no las cumple, y la página SHALL avisar que no se pudo guardar sin perder lo anotado.

#### Scenario: Monto decimal al servidor
- **WHEN** llega al servidor un movimiento con monto 35,5 en lugar de 3550 centavos
- **THEN** el servidor responde 400 y no lo guarda

#### Scenario: Gasto sin categoría
- **WHEN** la persona intenta guardar un gasto de Bs 35 sin categoría
- **THEN** la página no lo envía y dice que elija una categoría, con la misma regla que usa el servidor
