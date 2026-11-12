## MODIFIED Requirements

### Requirement: HOY-02 Libre del mes
El sistema SHALL calcular el libre como disponible (HOY-01) − fijos de gasto de cuentas para el día a día que vencen antes del próximo ingreso fijo y no están confirmados ni saltados (incluidos los vencidos) − lo que falta apartar este mes para las metas (MET-03).

#### Scenario: Libre calculado
- **WHEN** el disponible es 4200, faltan pagar Luz 180, Streaming 60, Internet 200 y Cuota 900 antes del sueldo del 25, y falta apartar 500
- **THEN** el libre es 2360

#### Scenario: Fijo de una cuenta que no es del día a día
- **WHEN** un curso de US$ 50 se paga desde Dólares, que no es del día a día
- **THEN** el libre no lo resta
