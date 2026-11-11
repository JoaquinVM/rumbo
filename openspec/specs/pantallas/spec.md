# pantallas Specification

## Purpose

Ordena la app en pocas pantallas que se usan bien en el teléfono, con la proyección siempre al frente.

## Requirements

### Requirement: PAN-01 Navegación
El sistema SHALL tener cuatro pestañas (Rumbo, Movimientos, Desglose y Fijos), el botón + en todas y Ajustes desde el ícono de arriba.

#### Scenario: Cambiar de pestaña
- **WHEN** la persona toca la pestaña Fijos
- **THEN** ve sus ingresos y gastos fijos

### Requirement: PAN-02 Orden de la pantalla Rumbo
El sistema SHALL mostrar en Rumbo, en este orden: titular y gráfica, indicadores, Este mes y ¿Y si…?

#### Scenario: Abrir la app
- **WHEN** la persona abre Rumbo
- **THEN** lo primero que ve es el titular con su proyección

### Requirement: PAN-04 Teléfono y temas
El sistema SHALL verse sin scroll horizontal a 375 px de ancho, en modo claro y oscuro.

#### Scenario: Teléfono angosto
- **WHEN** la pantalla mide 375 px
- **THEN** ninguna vista tiene scroll horizontal

### Requirement: PAN-05 Avisos dentro de la app
El sistema SHALL mostrar los avisos solo dentro de la app, porque un artifact no puede enviar notificaciones.

#### Scenario: Aviso
- **WHEN** hay algo que avisar
- **THEN** aparece en la pantalla, no como notificación del teléfono

### Requirement: PAN-06 Estilo visual
El sistema SHALL usar el estilo del prototipo: fondo verde grisáceo, acento azul cobalto y tarjetas blancas con borde.

#### Scenario: Estilo
- **WHEN** se abre cualquier pantalla
- **THEN** usa ese fondo, ese acento y esas tarjetas
