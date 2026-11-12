## ADDED Requirements

### Requirement: DES-03 Fuera de tus gastos
El sistema SHALL mostrar en el Desglose del mes lo que cambió el patrimonio sin ser ingreso ni gasto: cuadres, diferencia de cambio al comprar o vender dólares y deudas cerradas, de modo que quedó + esas líneas = cambio del patrimonio por movimientos.

#### Scenario: Compra de dólares y un cuadre
- **WHEN** con tipo de cambio 12,5 la persona compra US$ 50 por Bs 650 y cuadra Efectivo con −200
- **THEN** el Desglose muestra diferencia de cambio −Bs 25 y cuadres −Bs 200

### Requirement: DES-04 Promedio de Intereses
El sistema SHALL usar, en el promedio de la categoría Intereses, el interés de cada cuota y no la cuota entera.

#### Scenario: Cuota de 900
- **WHEN** la cuota es 900 y su interés este mes es 214,67
- **THEN** el promedio de Intereses usa 214,67
