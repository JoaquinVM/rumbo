# Requisitos de Rumbo

Desde el 10/11/2026 los requisitos viven en **OpenSpec**:

- `openspec/specs/`: lo que Rumbo hace hoy, una spec por capability (formato, movimientos, fijos, hoy, proyeccion,
  indicadores, desglose, ajustes, categorias, pantallas, datos).
- `openspec/changes/`: lo aprobado por construir, como cambios con propuesta, deltas de requisitos, diseño y tareas.
  Orden de la v1: `estilo-bloques-solidos`, `base-bolivianos-y-cuentas`, `metas`, `fijos-por-confirmar-y-hoy`,
  `proyeccion-v1`, `deudas`, `categorias-y-topes`.
- Al terminar un cambio, `openspec archive <cambio>` lo pasa a las specs.

Cada requirement conserva su ID (por ejemplo `HOY-02`); el código y las pruebas apuntan a él.

Comandos útiles:

```bash
openspec list
openspec list --specs
openspec show hoy --type spec
openspec validate --all --strict
```

**Pedido de origen** (Joaquín, 9/11/2026): «una app para administrar mi dinero, completa pero simple y que te dé gusto
usar. Que realmente te haga entender a dónde te llevan tus ingresos y gastos actuales».

La versión anterior de este archivo (v1.1, una tabla de requisitos) está en el historial de git (commit `b368ee1`).
