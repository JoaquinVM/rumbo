# Design

## Context

Hoy `index.html` guarda un documento `data/users/<id>/rumbo` con ajustes y fijos, y una subcolección `movs` con gastos e ingresos sin cuenta. Los cálculos viven en funciones puras (`baseline`, `project`, `monthData`) que `pruebas/verificar.mjs` prueba en Node. El modelo completo está en `docs/DOMINIO.md`.

## Goals / Non-Goals

**Goals:**
- Dejar el modelo de datos de v1 (cuentas, categorías y movimientos con cuenta) para que los demás cambios solo agreguen colecciones.
- Que saldos y patrimonio salgan siempre de calcular, nunca de un número guardado.

**Non-Goals:**
- Fijos con día, deudas, metas y topes: van en sus propios cambios.

## Decisions

- **Una colección por entidad bajo `data/users/<id>/rumbo`** (`cuentas`, `categorias`, `movs`). Alternativa descartada: un solo documento con todo; la base limita cada documento a 256 KiB y los movimientos crecen sin fin.
- **Monto siempre positivo y el tipo dice el sentido.** Evita errores de signo; el saldo suma o resta según `tipo` y, en transferencias, según si la cuenta es origen o destino.
- **Transferencia como un solo movimiento** con `cuentaId`, `monto`, `cuentaDestinoId` y `montoDestino`. Alternativa descartada: dos movimientos enlazados, que pueden quedar desparejados si falla una escritura.
- **Ajuste como movimiento de tipo `ajuste`** con signo implícito por el saldo real escrito (se guarda `monto` y `sentido`), para que quede visible en Movimientos.
- **Tipo de cambio en Ajustes con su fecha**; los saldos en USD se convierten al vuelo, nunca se guardan convertidos.
- **Categorías base sembradas al empezar** en la colección `categorias` con `base: true`, para que el cambio de topes solo agregue campos.
- **Respaldo:** un JSON con versión de formato y todas las colecciones, descargado con la capacidad `downloads`; cargar valida la versión y muestra conteos antes de reemplazar.

## Risks / Trade-offs

- [Muchos movimientos hacen lento el saldo] → Se calcula una vez por render y se memoriza por cuenta; a la escala de una persona son pocos miles.
- [Tipo de cambio viejo distorsiona el patrimonio] → Aviso a los 7 días (CTA-04) y sugerencia desde cambios reales (CTA-06, en este mismo cambio).
- [La capacidad `downloads` no está en todas las vistas] → Si no está, el botón de respaldo se oculta y se dice por qué.
