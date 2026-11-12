## MODIFIED Requirements

### Requirement: PRO-05 Plata de hoy
El sistema SHALL mostrar la proyección, el titular y «¿Y si…?» en plata de hoy, dividiendo cada mes por (1 + inflación anual) elevado a los años transcurridos, y SHALL permitir cambiar a montos nominales con un toque. La proyección SHALL suponer que ingresos y gastos suben con la inflación; las cuotas de los préstamos MUST NOT subir.

#### Scenario: Cinco años al 8 %
- **WHEN** la proyección nominal a 5 años es Bs 146.933 y la inflación es 8 %
- **THEN** el titular dice Bs 100.000 en plata de hoy y, en nominal, Bs 146.933

#### Scenario: Ahorro que sigue a la inflación
- **WHEN** el neto es 1000 al mes, sin cuentas, sin rendimiento y con 8 % de inflación
- **THEN** a 10 años la proyección en plata de hoy es cerca de Bs 83.400 (lo ahorrado sin rendimiento pierde valor), y no Bs 55.600 como con un neto congelado
