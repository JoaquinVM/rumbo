# Spec Delta

## MODIFIED Requirements

### Requirement: PRO-08 ¿Y si…?
El sistema SHALL permitir recortar de 0 a 60 % las 4 categorías variables más grandes, sumar un ingreso extra al mes y adelantar un pago extra al mes a un préstamo, dibujando una segunda línea y la diferencia al horizonte. Al adelantar, SHALL decir cuántos meses antes termina el préstamo, cuánto interés se ahorra y a cuánto baja el libre al día.

#### Scenario: Recortar la mitad de comida
- **WHEN** comida promedia 600 al mes y la persona la recorta 50 % y suma 1000 de ingreso extra
- **THEN** el neto ajustado sube 1300

#### Scenario: Adelantar el préstamo
- **WHEN** la persona adelanta 300 al mes al préstamo de 18400 al 14 % con cuota 900, con el libre en 2360 por 15 días
- **THEN** el sistema dice que termina en marzo de 2028, 7 meses antes, con Bs 753 menos de interés, y que el libre baja a Bs 137 al día

## ADDED Requirements

### Requirement: PRO-04 Préstamos en la proyección
El sistema SHALL amortizar cada préstamo mes a mes en la proyección con su interés y su cuota. Cuando un préstamo termina, su cuota SHALL dejar de salir del ritmo y el sistema SHALL decir en qué mes termina y cuánto más se ahorra desde ahí.

#### Scenario: Fin del préstamo en la gráfica
- **WHEN** el préstamo termina en octubre de 2028 con cuota de 900
- **THEN** la gráfica marca «oct 2028 · terminas el préstamo» y desde noviembre de 2028 el neto sube 900
