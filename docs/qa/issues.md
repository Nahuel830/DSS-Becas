# Issues de QA para carga manual (gh no disponible en este entorno)

> `gh` no está instalado. Para cargarlos: crear en GitHub las etiquetas
> `bug` (rojo d73a4a), `ux-improvement` (morado 5319e7), `prioridad-critica`,
> `prioridad-alta`, `prioridad-media`, `prioridad-baja`, `qa-sprint`; luego un
> Issue por mejora con el texto de abajo. Si hay Project, crear
> "DSS-Becas – Backlog" (Backlog, To Do, In Progress, Done) y moverlos a Backlog.
> Comando si se instala gh: `gh auth refresh -s project`.

---

## [MEJ-01] Ranking duplica evaluaciones del mismo estudiante

Etiquetas: bug, prioridad-alta, qa-sprint.
Problema: Andrés Ríos aparece dos veces (posiciones 2 y 3, 90.4) tras evaluarlo dos veces.
Origen: hallazgo-1 manual. Causa raíz: `DashboardPage.tsx` ordena TODAS las evaluaciones sin agrupar por estudiante; `GET /api/dashboard/resumen` hace lo mismo (solo `/api/ranking` agrupa por mejor puntaje).
Reproducir: evaluar 2 veces al mismo estudiante → abrir `/dashboard`.
Esperado vs obtenido: una fila con el mejor puntaje vs. filas duplicadas.
Aceptación: una sola fila por estudiante con su mejor puntaje.

## [MEJ-02] Decisión del evaluador con observaciones obligatorias

Etiquetas: bug, prioridad-alta, qa-sprint.
Problema: no existe aprobar/rechazar/en observación ni campo de observaciones (CP-17).
Reproducir: PUT `/api/asignaciones/:id` `{estado:"Rechazada"}` → 200 sin pedir motivo.
Esperado: 400 si se rechaza o contradice sin observaciones; el motivo queda en el historial.
Aceptación: test CP-17 en verde.

## [MEJ-03] Reglas de elegibilidad ("No elegible")

Etiquetas: bug, prioridad-alta, qa-sprint.
Problema: sin filtros duros (promedio mínimo); todo puntúa y solo sale "En riesgo" (CP-15).
Reproducir: POST `/api/evaluaciones/calcular` con criterios en 10.
Esperado: elegibilidad negativa con motivo. Aceptación: test CP-15 en verde.

## [MEJ-04] Backend debe validar suma de pesos 100 %

Etiquetas: bug, prioridad-alta, qa-sprint.
Problema: POST `/api/criterios` con peso 110 devuelve 201; solo el frontend valida (CP-13).
Aceptación: suma ≠100 → 400; test CP-13 en verde.

## [MEJ-05] Convocatoria debe validar rango de fechas

Etiquetas: bug, prioridad-media, qa-sprint.
Problema: acepta fin anterior al inicio (CP-05).
Reproducir: POST `/api/convocatorias` `{inicio:"2025-09-01", fin:"2025-01-01"}` → 201.
Aceptación: 400 con detalle por campo.

## [MEJ-06] Módulo Seguimiento pendiente

Etiquetas: ux-improvement, prioridad-media, qa-sprint.
Problema: documentado en diagramas y sidebar (con asterisco), sin implementar (hallazgo-2).
Aceptación: historia de usuario + pantalla, o descarte documentado en DECISIONES.md.

## [MEJ-07] Módulo Reportes pendiente

Etiquetas: ux-improvement, prioridad-media, qa-sprint.
Problema: RF-08 parcial; `/reportes` es placeholder (hallazgo-2).
Aceptación: pantalla de reportes o descarte documentado.

## [MEJ-08] Módulo Administración pendiente

Etiquetas: ux-improvement, prioridad-media, qa-sprint.
Problema: documentado en diagramas y sidebar (con asterisco), sin implementar (hallazgo-2).
Aceptación: historia de usuario + pantalla, o descarte documentado.

## [MEJ-09] Contraste bajo en dorado y texto muted

Etiquetas: ux-improvement, prioridad-baja, qa-sprint.
Problema: blanco sobre `#b08d1e` = 3.15:1 y `#6b7a86` sobre fondo = 4.08:1 (mínimo 4.5:1, checklist ítem 10).
Aceptación: ambos ≥4.5:1 con la misma fórmula.
