# Matriz de trazabilidad — DSS-Becas

| Código | Requisito | Pantalla / Ruta | Archivos | Casos | Estado |
|--------|-----------|-----------------|----------|-------|--------|
| RF-01 | Registro de estudiantes | `/estudiantes/nuevo` | `NuevoEstudiantePage.tsx`, `backend/src/controllers/estudiantes.ts` | CP-04, CP-05 | Cumple |
| RF-02 | Actualizar estudiantes | `/estudiantes/:id/editar` | `NuevoEstudiantePage.tsx` (modo edición), `PUT /api/estudiantes/:id` | CP-06 | Cumple |
| RF-03 | Puntaje académico | `/evaluaciones/nueva`, `/evaluacion/:id` | `EvaluacionPage.tsx`, `backend/src/dss/motor.ts`, `POST /api/evaluaciones/calcular` | CP-08 | Cumple |
| RF-04 | Puntaje social | idem RF-03 | idem RF-03 | CP-08 | Cumple |
| RF-05 | Puntaje final DSS | idem RF-03 | idem RF-03 | CP-08 | Cumple |
| RF-06 | Sugerir aptitud | `/estudiantes/:id`, ranking | `DetalleEstudiantePage.tsx`, umbrales (D16) | CP-07 | Cumple |
| RF-07 | Asignación formal de becas | `/becas` | `BecasPage.tsx`, `POST /api/asignaciones/generar`, `POST /api/becas` | CP-12 | Cumple |
| RF-08 | Reportes | `/becas` (ranking + CSV/PDF), `/dashboard` | `utils/export.ts`, `BecasPage.tsx` | CP-12 | Parcial: sin pantalla `/reportes` dedicada (placeholder; el ranking exportable la cubre) |
| RNF-01 | Respuesta < 2 s | Todas | TanStack Query + SQLite local + paginación | CP-01 | Cumple |
| RNF-02 | REST + JSON | — | `backend/src/routes/`, `openapi.yaml` (prefijo `/api`, D27) | Tests API | Cumple |
| RNF-03 | BD relacional con integridad | — | `prisma/schema.prisma` (SQLite local; FK + cascadas; MySQL por `DATABASE_URL`, D26) | Tests API (cascada) | Cumple |
| RNF-04 | UI responsiva | Todas | `global.css` (1100/1024/640px), tarjetas móviles | Manual | Cumple |
| RES-01 | Personal autorizado | — | Sin implementar (D28) | — | No cumple: sin spec de login/roles en prototipos ni endpoints en `openapi.yaml` |

CP-01–CP-11 en `PRUEBAS_MANUALES.md`; CP-12–CP-14 abajo.
