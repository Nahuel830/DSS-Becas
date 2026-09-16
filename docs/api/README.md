# Documentación API DSS-Becas

Esta carpeta contiene la documentación de los servicios principales del sistema DSS-Becas.

## Objetivo

Definir los servicios que permiten gestionar la información de estudiantes, evaluaciones y asignación de becas.

Consulta la especificación completa en:
- [OpenAPI Specification](./openapi.yaml)

---

# Servicios principales

## 1. Gestión de estudiantes

### Registrar estudiante

Método:

POST

Endpoint:

/estudiantes

Descripción:

Permite registrar la información académica y socioeconómica de un estudiante.

Respuesta esperada:

201 Created

# API Resultados

## Consultar resultados DSS

Método:

GET

Endpoint:

/api/resultados

## Descripción

Permite consultar los resultados generados después de la evaluación del estudiante.

## Respuesta esperada

```json
{
 "estudiante": "Juan Perez",
 "puntaje": 85,
 "beca": "Beca Excelencia"
}
