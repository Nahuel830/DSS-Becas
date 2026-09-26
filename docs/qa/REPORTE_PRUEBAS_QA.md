# Reporte de Pruebas QA — DSS-Becas

> Tablero GitHub Projects: https://github.com/users/Nahuel830/projects/4 ("DSS-Becas – Backlog", columna Backlog). Issues #1–#9 ya creados.

Proyecto: DSS-Becas — Sistema de Soporte a Decisiones para Asignación de Becas | Squad: [COMPLETAR] | Sprint Auditado: Sprint [COMPLETAR] – Release MVP | Fecha de Ejecución: 26/09/2026.

## 1. Alcance de las Pruebas

Auditoría funcional y UX del sistema completo (frontend React + backend Express/Prisma/SQLite) intentando romperlo con datos inválidos, límites, integridad y reglas DSS. Nota de trazabilidad: `docs/requirements` no contiene historias HU-xx, solo RF-xx/RNF-xx; los casos se vinculan a RF-xx.

Módulos Evaluados: Estudiantes (CRUD), Evaluaciones y motor DSS, Asignaciones, Dashboard, Catálogos, Documentos, API/integración.
Herramientas Utilizadas: Vitest, Supertest, Prisma Studio, Postman/Thunder Client, pruebas manuales UI, Node (contrastes WCAG).

## 2. Matriz de Casos de Prueba

### Casos críticos (primero)

| ID Test | ID Historia | Descripción (Escenario) | Pasos | Resultado Esperado | Resultado Obtenido | Estado | Evidencia |
|---------|-------------|-------------------------|-------|--------------------|--------------------|--------|-----------|
| CP-17 | RF-07 (sin HU) | Rechazar evaluación sin observaciones debe bloquearse | 1. Crear estudiante, evaluación y asignación. 2. PUT `/api/asignaciones/:id` `{estado:"Rechazada"}` sin observaciones | 400 (observaciones obligatorias) | 200: no existe decisión del evaluador ni campo observaciones | ❌ Falla | Anexo 4 |
| CP-15 | RF-06 (sin HU) | Promedio bajo debe dar "No elegible" | 1. POST `/api/evaluaciones/calcular` con criterios en 10 | Respuesta con elegibilidad negativa | Solo `recomendacion:"En riesgo"`; no hay filtros duros | ❌ Falla | Anexo 4 |
| CP-13 | RF-03/04/05 (sin HU) | Pesos que suman 110 deben rechazarse en backend | 1. POST `/api/criterios` `{nombre, peso:110}` | 400 | 201: el backend no valida la suma (solo el frontend) | ❌ Falla | Anexo 4 |
| CP-05 | RF-01 (sin HU) | Convocatoria con fin anterior al inicio | 1. POST `/api/convocatorias` `{inicio:"2025-09-01", fin:"2025-01-01"}` | 400 | 201: sin validación de rango de fechas | ❌ Falla | Anexo 4 |
| CP-18 | RF-08 (sin HU) | Dashboard con base vacía | 1. Vaciar tablas. 2. GET `/api/dashboard/resumen` | Ceros y listas vacías, sin NaN | `evaluados:0`, `ranking:[]`, todo finito | ✅ Pasa | Anexo 3 |

### Resto de casos

| ID Test | ID Historia | Descripción | Pasos | Esperado | Obtenido | Estado | Evidencia |
|---------|-------------|-------------|-------|----------|----------|--------|-----------|
| CP-01 | RF-01 | Obligatorios vacíos | POST `/api/estudiantes` `{}` | 400 + detalles nombre/carrera/promedio/ingreso | 400 con detalles en español | ✅ | Anexo 4 |
| CP-02 | RF-01 | Letras en numéricos | POST con promedio "abc", ingreso "mil", semestre "tres" | 400 (3/3) | 400 (3/3) | ✅ | Anexo 4 |
| CP-03 | RF-01 | Negativos y cero | ingreso -500, integrantes 0, cupos -1, monto negativo | 400 (4/4) | 400 (4/4) | ✅ | Anexo 4 |
| CP-04 | RF-01 | Límites y edades | promedio 100.01/-1, semestre 0/11, edad 15/61 → 400; edad 20 → 201 | Según lo indicado | Según lo indicado | ✅ | Anexo 4 |
| CP-06 | RF-01 | CI/correo duplicados | Crear, reintentar igual CI y luego igual correo | 409 "Ya existe…CI/correo" | 409 en español (2/2) | ✅ | Anexo 1, 4 |
| CP-07 | RF-01 | Largos y ñ/acentos | nombre 500 → 400; motivo 5000 → 201; "Ñandú Pérez O'Connor" → 201 intacto | Según lo indicado | Según lo indicado | ✅ | Anexo 2 |
| CP-08 | RF-07 | Eliminar tipo/convocatoria con asignaciones | Generar asignación, DELETE tipo y convocatoria | 409 (2/2) | 409 (2/2) | ✅ | Anexo 4 |
| CP-09 | RF-01 | Id inexistente | GET/PUT/DELETE `/api/estudiantes/999999` | 404 (3/3) | 404 (3/3) | ✅ | Anexo 4 |
| CP-10 | RF-01 | Decimales y ñ exactos | POST promedio 78.55, ingreso 3500.75; GET | Valores exactos | Exactos, sin truncar | ✅ | Anexo 2 |
| CP-11 | RF-02 | Edición persiste | PUT promedio 91.25; GET | 91.25 | 91.25 | ✅ | Anexo 2 |
| CP-12 | RF-01 | Baja sin huérfanos | Crear + evaluar + DELETE; contar en base | 204 y ceros | 204 y ceros | ✅ | Anexo 2 |
| CP-14 | RF-03/04/05 | Cálculo a mano vs motor | criterios 90/80/70/60/50 → 73.0 "En revisión"; todo 100 → 100 | Coincide | Coincide (73.0/100) | ✅ | Anexo 4 |
| CP-16 | RF-07 | Cupos y presupuesto | Tipo cupos=1 + 2 candidatos; generar; resumen | generadas≤1, usado≤total | 1, dentro de límites | ✅ | Anexo 3 |
| CP-19 | RF-08 | Totales vs base | GET resumen vs `count()` Prisma | Iguales | Iguales | ✅ | Anexo 3 |
| CP-20 | RNF-02 | POST válido | POST estudiante válido | 201 + id | 201 + id | ✅ | Anexo 4 |

Resultado: 16 ✅ Pasa, 4 ❌ Falla. Salida completa en `docs/qa/evidencias/ejecucion_pruebas.txt`.

## 3. Resumen de Defectos

| ID Test | Problema (Bug) | Issue GitHub | Prioridad | Asignado a |
|---------|----------------|--------------|-----------|------------|
| CP-17 | Sin decisión del evaluador (aprobar/rechazar/observación) | #2 | Alta | [COMPLETAR] |
| CP-15 | Sin reglas de elegibilidad ("No elegible") | #3 | Alta | [COMPLETAR] |
| CP-13 | Backend no valida que los pesos sumen 100 % | #4 | Alta | [COMPLETAR] |
| CP-05 | Convocatoria acepta fin anterior al inicio | #5 | Media | [COMPLETAR] |
| hallazgo-1 | Ranking duplica evaluaciones del mismo estudiante | #1 | Alta | [COMPLETAR] |

## 4. Anexos (capturas a tomar por el equipo)

- Captura 1 (error CRUD): abrir `/estudiantes/nuevo`, ingresar CI `1000001` existente y Guardar; debe verse "Este CI ya está registrado" debajo del campo CI.
- Captura 2 (dato en base): abrir Prisma Studio (`npm run db:studio` en `backend`), tabla Estudiante, fila con "Ñandú Pérez O'Connor", promedio 78.55 intactos.
- Captura 3 (dashboard): abrir `/dashboard` con datos semilla: 4 KPI, ranking top 5, alertas y barras por estado.
- Captura 4 (respuesta API): Thunder Client POST `/api/estudiantes` `{}` → 400 con `detalles`; y POST válido → 201 con `id_estudiante`.
- Captura 5 (tablero): GitHub Projects "DSS-Becas – Backlog" con los 9 issues en Backlog.
