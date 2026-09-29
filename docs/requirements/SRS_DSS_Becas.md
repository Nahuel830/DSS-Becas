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

## Historias de Usuario (módulos Seguimiento, Reportes y Administración)

- **HU-SEG-01**: Como personal de Bienestar quiero registrar el promedio por periodo de cada becario para detectar riesgo académico.
- **HU-SEG-02**: Como personal de Bienestar quiero ver el historial por becario con sugerencia de suspensión ante dos periodos en riesgo.
- **HU-REP-01**: Como estratégico quiero un resumen por convocatoria (postulantes, aprobados, montos, distribución) con gráficos.
- **HU-REP-02**: Como estratégico quiero descargar el ranking y las asignaciones en CSV e imprimir el reporte.
- **HU-ADM-01**: Como administrador quiero gestionar usuarios (crear, editar, activar/desactivar, eliminar) con roles Administrador|Evaluador|Consulta.

## Roles y permisos

| Módulo | Administrador | Evaluador | Consulta |
|--------|---------------|-----------|----------|
| Dashboard | ver | ver | ver |
| Estudiantes | crear, editar, eliminar, subir/borrar documentos | crear, editar, subir documentos | solo ver (lista y detalle) |
| Evaluación DSS | evaluar, evaluar todos, editar/eliminar evaluaciones | evaluar y evaluar todos | oculto |
| Becas/asignaciones | generar, aprobar, rechazar, en observación, revocar | aprobar, rechazar, en observación | solo ver |
| Seguimiento | todo | registrar y editar periodos | solo ver |
| Reportes | ver, CSV, imprimir | ver, CSV, imprimir | ver, CSV, imprimir |
| Configuración | todo | oculto | oculto |
| Administración | todo | oculto | oculto |
| Restablecer datos | sí | no | no |

Fuente de verdad: `backend/src/auth/permisos.ts`. Sin permiso → 403 "Su rol no permite esta acción".
