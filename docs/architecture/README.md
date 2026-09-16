# Arquitectura del Sistema DSS-Becas

Esta carpeta contiene la documentación relacionada con la arquitectura del Sistema de Soporte a Decisiones para la Asignación y Seguimiento de Becas Universitarias.

## Documentos de Arquitectura

- [Componentes del Sistema](./componentes_sistema.md)
- [Decisiones de Arquitectura](./decisiones_arquitectura.md)
- [Diagrama de Componentes (PlantUML)](./diagrama_componentes.puml)

## Arquitectura general

El sistema está diseñado con una arquitectura por capas que permite separar responsabilidades y facilitar el mantenimiento del sistema.

## Capas del sistema

### Capa de Presentación

Responsable de la interacción con los usuarios mediante interfaces web.

Funciones principales:

- Registro de estudiantes.
- Consulta de información.
- Visualización de resultados.
- Gestión de becas.

### Capa de Lógica de Negocio

Contiene las reglas y procesos principales del sistema DSS.

Funciones:

- Evaluación de criterios académicos.
- Análisis socioeconómico.
- Cálculo de puntajes.
- Clasificación de candidatos.
- Generación de recomendaciones.

### Capa de Datos

Administra el almacenamiento de información.

Incluye:

- Datos personales de estudiantes.
- Información académica.
- Información socioeconómica.
- Historial de becas.
- Resultados de evaluación.

### Módulo de Reportes

Permite generar información para la toma de decisiones:

- Ranking de estudiantes.
- Reportes de evaluación.
- Estado de asignaciones.

## Diagrama de arquitectura

![Arquitectura DSS-Becas](../diagrams/arquitectura_sistema.png.drawio.png)
