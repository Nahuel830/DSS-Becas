# Plan de implementación — Frontend DSS-Becas

> Módulo 1 (análisis). Fuentes: `AGENTS.md`, READMEs, `docs/*`, `prototypes/*.png`, `diagrams/`, `ux_strategy/README.md`, `frontend/` actual. El PNG manda ante dudas visuales; `openapi.yaml` + `script_bd.sql` mandan ante dudas de datos.

## Módulos (checklist)

- [x] 1 Base y navegación — completado en este encargo (ver Módulo 2)
- [x] 2 Modelo de datos — completado en este encargo (ver Módulo 3)
- [x] 3 Dashboard — completado en este encargo (ver Módulo 4)
- [x] 4 Gestión de estudiantes — completado en este encargo (filtros en URL, orden, paginación, baja con confirmación)
- [x] 5 Nuevo estudiante — completado en este encargo (alta con validaciones; reutilizada para edición)
- [x] 6 Detalle de estudiante — completado en este encargo (ficha, acciones, evaluación, historial)
- [x] 7 Evaluación DSS — persiste en backend; preselección desde `/evaluacion/:idEstudiante`
- [x] 8 Backend y base de datos — Express+Prisma+Zod+SQLite, seed idempotente, tests API (8/8)
- [x] 9 Asignación de becas y reportes — `/becas` (ranking, cupos/presupuesto, generar/revocar, CSV/PDF) y `/configuracion` (catálogos)
- [x] 10 Pruebas — backend 8/8 y frontend 9/9 con Vitest; sin lint/CI
- [x] 11 Cierre — este encargo

## Pendientes (siguientes módulos)

- Módulos Seguimiento, Reportes y Administración: solo placeholders (sin endpoint ni mock).
- Login/roles: no implementado (D28).
- Sin lint ni CI.

## a) Resumen del sistema

DSS-Becas es un Sistema de Soporte a Decisiones para la asignación y seguimiento de becas universitarias (contexto: universidad boliviana, área de Bienestar Universitario). Evalúa candidatos con criterios ponderados (académicos + socioeconómicos), calcula puntajes DSS, genera rankings y recomienda becas.

Actores/roles: **Administrador** (casos de uso: registra, evalúa, consulta ranking, asigna); según `ux_strategy`: Usuario Operativo (gestiona datos y evaluaciones), Usuario Estratégico (analiza indicadores y aprueba), Usuario Final/estudiante (consulta estado). Alcance: gestión de estudiantes, evaluación DSS, ranking, asignación de becas, seguimiento, reportes y administración.

## b) Inventario de pantallas

| PNG | Ruta | Contenido detallado |
|-----|------|---------------------|
| `dashboard-dss.png` | `/dashboard` | Título "Dashboard DSS - Panel principal" + avatar "PB". 4 KPI con borde lateral: Estudiantes evaluados 482 (teal), Candidatos recomendados 210 (azul oscuro), En revisión 156 (dorado), En riesgo 39 (rojo). Tabla "Ranking de candidatos" (#, Estudiante, Puntaje DSS, Estado): María Fernández 92.5 Recomendado, Jorge Quispe 89.1 Recomendado, Ana Rojas 81.4 En revisión, Luis Mamani 74.0 En revisión, Carla Vega 58.2 En riesgo. Panel "Alertas" (4 ítems con punto rojo). Gráfico de barras "Distribución de estudiantes por estado" (210/156/39). |
| `gestion-estudiantes.png` | `/estudiantes` | Título + botón teal "+ Nuevo estudiante" + buscador "Buscar estudiante…". Tabla Código/Nombre/Carrera/Estado beca/Puntaje DSS/Acción(Ver): EST-001 María Fernández Ing. Sistemas Activa 92.5 … EST-007 Sofía Aguilar Psicología Pendiente "-" (7 filas). |
| `nuevo-estudiante.png` | `/estudiantes/nuevo` | Formulario en 4 bloques: Datos personales (Nombres, Apellidos, Carnet de identidad, Fecha de nacimiento, Teléfono/Correo, Carrera); Datos académicos (Promedio académico, Porcentaje de asistencia, Semestre/Gestión); Datos socioeconómicos (Ingreso familiar mensual, Carga familiar, Condición vulnerable); Solicitud de beca (Tipo de beca solicitada, Fecha de solicitud, Documentos adjuntos). Botones Guardar (teal) / Cancelar (gris). |
| `detalle-estudiante.png` | `/estudiantes/:id` | Ficha izquierda: avatar, María Fernández, EST-001/Ing. Sistemas, badge Recomendado, Puntaje DSS 92.5, Asistencia 96%, Promedio 88.0, Beca actual Excelencia. Derecha: "Evaluación DSS" con 5 barras horizontales (Rendimiento académico, Asistencia, Situación socioeconómica, Carga familiar, Condición vulnerable); "Historial de seguimiento" (Gestión/Promedio/Estado: 2024-I 85.0, 2024-II 87.2, 2025-I 88.0, Activa). |
| `evaluacion-dss.png` | `/evaluaciones/nueva` | Izquierda "Criterios ponderados": Rendimiento académico 30%, Asistencia 15%, Situación socioeconómica 25%, Carga familiar 15%, Condición vulnerable 15% + botón "Calcular puntaje DSS". Derecha: "Resultado de la evaluación" (Puntaje DSS 92.5 grande teal, Recomendación) + "Comparación con umbral" (Recomendado ≥80, En revisión 60–79, En riesgo <60). |
| `diagrama-navegacion.png` + `diagrams/DSS_Becas_Diagrama_Navegacion.*` | — | Login → Menú Principal → 7 módulos: 1 Dashboard (KPIs, Gráficos, Ranking, Alertas), 2 Gestión Estudiantes CRUD (Crear/Consultar/Actualizar/Eliminar → Detalle), 3 Evaluación (periodo → requisitos → cálculo → ranking → Recomendación), 4 Becas (Solicitudes, Asignaciones, Renovaciones, Historial), 5 Seguimiento (Rendimiento, Riesgo de pérdida, Estado), 6 Reportes (académicos, económicos, PDF/Excel), 7 Administración (Usuarios, Roles, Configuración). |

Sidebar (todos los PNG): marca "DSS-Becas / Bienestar Universitario"; ítems Dashboard DSS, Estudiantes, Evaluación DSS, Becas, Seguimiento, Reportes, Administración; header con título de página y avatar "PB".

## c) Mapa de navegación

Login → Menú Principal → {Dashboard, Gestión, Evaluación, Becas, Seguimiento, Reportes, Administración}. Gestión → "+ Nuevo" → Nuevo → Guardar → Gestión; Gestión → Ver → Detalle → Volver → Gestión. Evaluación → Calcular → Resultado → (link) Detalle. Implementado en `frontend/src/routing/`: `/`→`/dashboard`, `/dashboard`, `/estudiantes`, `/estudiantes/nuevo`, `/estudiantes/:idEstudiante`, `/evaluaciones/nueva`, `/becas`, placeholders `/seguimiento`, `/reportes`, `/administracion`, `*` NotFound.

## d) Sistema de diseño detectado

Sidebar `#0f2a3d`, activo/acentos teal `#0e7c7b`, dorado `#b08d1e`, rojo `#b03a2e`, fondo `#f4f6f8`, tarjeta blanca borde `#e2e8ee` radio 6, badges pill texto blanco, botones rectangulares (radio 2: teal primario, gris secundario), tabla 14px con separadores, KPI 32px con borde lateral 6px. Fuente de los PNG no identificable → Inter (Google Fonts) con fallback system-ui. Tokens en `frontend/src/styles/tokens.css`.

## e) Entidades y campos

SQL (`dss_becas`): ESTUDIANTE(`id_estudiante` PK, `nombre`, `apellido`, `carrera`, `promedio` DECIMAL(5,2), `ingreso_familiar` DECIMAL(10,2)); EVALUACION(`id_evaluacion` PK, `id_estudiante` FK, `fecha`, `puntaje_academico/social/final`); RESULTADO(`id_resultado` PK, `id_estudiante` FK, `resultado`); BECA(`id_beca` PK, `id_estudiante` FK, `nombre_beca`, `tipo` Excelencia/Social, `monto`, `estado` Activa/Inactiva). ER agrega Usuario(`id_usuario`, `nombre`, `correo`, `rol`) sin tabla (futura auth). UML agrega Criterio(`nombre`,`peso`,`valor`) y Administrador; `clases.puml` usa nombres viejos (`codigo`, `ingresoFamiliar`, `tipoBeca`) ya deprecados.

## f) Requisitos

RF-01 registro, RF-02 actualización (sin endpoint), RF-03 puntaje académico, RF-04 puntaje social, RF-05 puntaje final, RF-06 aptitud, RF-07 asignación, RF-08 reportes. RNF-01 <2s, RNF-02 REST+JSON, RNF-03 relacional con FK, RNF-04 responsive.

## g) Endpoints (`openapi.yaml` v1.0.0)

GET `/estudiantes` → Estudiante[]; POST `/estudiantes` (body Estudiante) → 201; POST `/evaluaciones` (body Evaluacion) → 201; GET `/resultados/{id_estudiante}` → Resultado; POST `/becas` (body Beca con `tipo`/`estado` enum) → 201. Sin prefijo `/api`, sin GET de becas/evaluaciones, sin agregados/ranking, sin auth.

## h) Reglas DSS

`puntaje_academico` + `puntaje_social` → `puntaje_final` (fórmula de combinación NO documentada). Umbrales: ≥80 Recomendado, 60–79 En revisión, <60 En riesgo. Pesos del prototipo: 30/15/25/15/15. Cálculo aislado en Motor DSS (backend); el frontend solo envía y muestra.

## i) Estado actual del frontend

React 18+TS+Vite 5, Router 6, TanStack Query 5 (`frontend/package.json`). Existe: layout Sidebar/Header, 5 vistas + becas esqueleto + placeholders, servicios tipados con mocks, `global.css`, `VITE_API_URL`. Sirve: `npm run dev` (:8080), `typecheck`, `build`. Falta (este encargo): tokens, iconos, recharts, `VITE_USE_MOCKS`, 30 mocks coherentes, resumen calculado, `useAsync`, formatos Bs/fecha/%, dashboard fiel con estados de carga/error/vacío.

## j) Orden de módulos

Ver checklist arriba (1–3 en este encargo; 4–7 ya implementadas en encargo previo; 8–9 pendientes).
