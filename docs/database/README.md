# Diseño de Base de Datos DSS-Becas

Esta carpeta contiene la documentación del modelo de datos del sistema DSS-Becas.

## Entidades principales

### Estudiante

Almacena información del estudiante:

- Código estudiante
- Nombre
- Carrera
- Datos académicos
- Información socioeconómica

### Evaluación

Registra los resultados obtenidos durante el proceso DSS.

Atributos:

- ID evaluación
- Puntaje académico
- Puntaje socioeconómico
- Puntaje final

### Beca

Gestiona la información relacionada con las becas disponibles.

Atributos:

- Código beca
- Tipo de beca
- Estado
- Beneficiario

### Usuario

Administra los accesos al sistema.

## Relaciones principales
## Modelo Entidad Relación

El modelo representa las entidades principales del sistema DSS-Becas y sus relaciones.

![Modelo Entidad Relación](modelo_entidad.png)

- Un estudiante puede tener evaluaciones.
- Una evaluación genera un resultado.
- Un estudiante puede recibir una beca.
