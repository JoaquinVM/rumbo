# Tasks

## 1. Dominio y vista

- [x] 1.1 `resumenMes` agrupa los ingresos del mes por categoría, en Bs con el tipo de cambio de cada uno; pruebas DES-06 (la suma es «Entró», un ingreso en dólares).
- [x] 1.2 `VistaDesglose` lleva `ingresos` (categoría, total y de cada 100), de mayor a menor; prueba DES-06 del orden y de cada 100.

## 2. Pantalla

- [x] 2.1 `Desglose.tsx` muestra «De dónde entró» debajo de «Te quedas tú», con filas que abren Movimientos de esa categoría; sin ingresos, no aparece.
- [x] 2.2 e2e: tocar un ingreso abre Movimientos con su total.

## 3. Cierre

- [x] 3.1 `docs/DECISIONES.md` y `openspec validate --all --strict`.
- [ ] 3.2 `npm run tipos`, `npm run capas`, `npm run unitarias` y `npm run e2e` pasan.
