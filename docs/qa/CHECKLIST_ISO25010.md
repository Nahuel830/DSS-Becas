# Checklist UX ISO/IEC 25010 — DSS-Becas

Escala: Pasa (1) / Falla (0) / N/A. Fecha: 26/09/2026.

| # | Ítem | Cal. | Justificación |
|---|------|------|---------------|
| 1 | Claridad del Dashboard (5 s) | 1 | `/dashboard` (`DashboardPage.tsx`): título "Panel principal", 4 KPI con etiqueta + valor, ranking, alertas y barras; se entiende el propósito sin ayuda. |
| 2 | Lenguaje del negocio | 1 | UI en español con términos del dominio (puntaje, beca, convocatoria). Sin "null/500/stack" visibles: errores del backend se traducen (`errorHandler.ts`) y el frontend muestra textos propios (`ToastContext.tsx`, `EmptyState`). |
| 3 | Navegación formulario→dashboard | 1 | Tras guardar, Toast + navegación al detalle/listado (`NuevoEstudiantePage.tsx`); sidebar con NavLink activo y rutas 1:1 con prototipos (`router.tsx`). |
| 4 | Eficiencia de carga | 1 | Formulario precarga selects (carreras/tipos por API), fecha por defecto hoy en evaluación, buscador con debounce 300 ms, paginación 10/20/50 (`EstudiantesPage.tsx`, `EvaluacionPage.tsx`). |
| 5 | Control y libertad | 1 | Cancelar con ConfirmDialog si hay cambios, Limpiar filtros, Volver (conserva filtros por query params), Reintentar en errores (`NuevoEstudiantePage.tsx`, `EstudiantesPage.tsx`). |
| 6 | Prevención activa | 1 | `type="number"` con min/max, `type="date"`, selects para enums, validación al salir del campo + scroll al primer error (`NuevoEstudiantePage.tsx`, Zod en `backend/src/validators/schemas.ts`). |
| 7 | Mensajes de recuperación | 0 | Los errores 400/409 llegan en español con detalle por campo, pero ante backend apagado el mensaje es genérico y no indica el puerto esperado ni reintento automático (`client.ts`, `EmptyState` en páginas). |
| 8 | Consistencia visual | 1 | Botón primario teal `#0e7c7b` abajo a la izquierda del formulario en todas las pantallas; tokens centralizados (`styles/tokens.css`); componentes reutilizados. |
| 9 | Jerarquía y carga cognitiva | 1 | Destacan los KPI (32px) y el puntaje (40px teal); alertas con punto rojo; 3 gráficos/tablas por pantalla sin saturación. Verde=positivo y rojo=crítico se usan de forma consistente (`EstadoBadge.tsx`, semáforo de umbrales). |
| 10 | Contraste inclusivo | 0 | Estados con texto además del color (pasa), pero fallan WCAG 4.5:1: blanco sobre dorado `#b08d1e` = 3.15:1 (badges "En revisión") y muted `#6b7a86` sobre fondo `#f4f6f8` = 4.08:1. Pasan: teal 5.01, rojo 6.02, sidebar 11.15, texto 14.61. |

Puntaje: 8/10.
