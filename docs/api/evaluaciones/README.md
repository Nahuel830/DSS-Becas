# API Evaluaciones

## Evaluar estudiante

Método:

POST

Endpoint:

/api/evaluaciones

## Descripción

Realiza la evaluación DSS considerando criterios académicos y socioeconómicos del estudiante.

## Datos enviados

```json
{
 "id_estudiante": 1,
 "criterios": {
   "academico": 90,
   "social": 80
 }
}
