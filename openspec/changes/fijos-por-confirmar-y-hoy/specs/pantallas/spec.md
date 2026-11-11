# Spec Delta

## MODIFIED Requirements

### Requirement: PAN-02 Orden de la pantalla Rumbo
El sistema SHALL mostrar en Rumbo, en este orden: titular y gráfica, Hoy, Por confirmar (si hay pendientes), avisos (si hay), indicadores y ¿Y si…?

#### Scenario: Abrir la app
- **WHEN** la persona abre Rumbo con la Luz pendiente
- **THEN** ve el titular, luego Hoy con su monto al día y luego Por confirmar con la Luz
