## ADDED Requirements

### Requirement: DES-05 De una categoría a sus movimientos
El sistema SHALL abrir, al tocar una categoría del Desglose, también una en ámbar o en rojo por su tope, Movimientos del mismo mes con esa categoría elegida (MOV-07) y sin filtro de cuenta, para que el total sea el mismo del Desglose. Cada categoría del Desglose SHALL mostrar que se puede tocar.

#### Scenario: Súper cerca del tope
- **WHEN** Súper suma 1300 en el Desglose de octubre, con un tope de 1400
- **THEN** al tocarla la persona ve Movimientos de octubre solo con Súper y arriba su total, Bs 1.300

#### Scenario: Venía con una cuenta elegida
- **WHEN** en Movimientos estaba elegida la cuenta Efectivo y la persona toca Casa en el Desglose
- **THEN** ve Casa en todas las cuentas y el total es el mismo del Desglose
