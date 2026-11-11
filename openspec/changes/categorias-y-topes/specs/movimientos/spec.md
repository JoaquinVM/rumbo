# Spec Delta

## ADDED Requirements

### Requirement: MOV-05 Aviso de tope al anotar
El sistema SHALL decir, al anotar o guardar un gasto de una categoría con tope, cuánto llevará del tope cuando ese gasto la deja en 80 % o más.

#### Scenario: Almuerzo cerca del tope
- **WHEN** Comida fuera lleva 850 de 1000 y la persona escribe un gasto de 35
- **THEN** el formulario dice «Comida fuera: después de esto llevas 89 % de tu tope»
