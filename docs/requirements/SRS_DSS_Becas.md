# Documento de Requisitos de Software (SRS) - DSS Becas

## Requisitos Funcionales

- **RF-01**: El sistema debe permitir el registro de estudiantes con datos personales, académicos y socioeconómicos.
- **RF-02**: El sistema debe permitir actualizar la información de los estudiantes.
- **RF-03**: El sistema debe calcular un puntaje académico en base al promedio y otros indicadores.
- **RF-04**: El sistema debe calcular un puntaje social en base a ingresos familiares y contexto.
- **RF-05**: El sistema debe generar un puntaje final DSS combinando los puntajes previos.
- **RF-06**: El sistema debe sugerir si un estudiante es apto o no para recibir una beca.
- **RF-07**: El sistema debe permitir la asignación formal de becas a estudiantes seleccionados.
- **RF-08**: El sistema debe proveer reportes sobre estudiantes evaluados y becas asignadas.

## Requisitos No Funcionales

- **RNF-01**: El sistema debe responder en menos de 2 segundos a las consultas.
- **RNF-02**: La API debe seguir el estándar REST y usar formato JSON.
- **RNF-03**: La base de datos debe ser relacional y garantizar la integridad referencial.
- **RNF-04**: La interfaz de usuario debe ser responsiva e intuitiva.

## Restricciones

- El sistema será utilizado exclusivamente por personal autorizado (Administradores/Estratégicos).
- Se requiere conexión a la red de la universidad para el acceso al sistema.

## Criterios de Aceptación

- Los cálculos de los puntajes deben ser validados contra casos de prueba estandarizados.
- Todo endpoint de la API debe estar documentado (OpenAPI) y funcional.
