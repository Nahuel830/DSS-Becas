# Lista de mejoras — DSS-Becas

> Tablero GitHub Projects: pendiente (ver nota en REPORTE_PRUEBAS_QA.md). Issues #1–#9 ya creados.

| ID | Issue | Tipo | Origen | Descripción | Criterio de aceptación | Prioridad | Est. | Sprint |
|----|-------|------|--------|-------------|------------------------|-----------|------|--------|
| MEJ-01 | #1 | bug | hallazgo-1 | Ranking duplica evaluaciones del mismo estudiante (frontend `DashboardPage.tsx` y `GET /api/dashboard/resumen` usan todas las filas; solo `/api/ranking` agrupa por mejor puntaje) | Evaluar 2 veces a un estudiante muestra una sola fila con su mejor puntaje | Alta | 3 | [COMPLETAR] |
| MEJ-02 | #2 | bug | CP-17 | Decisión del evaluador: aprobar/rechazar/en observación con observaciones obligatorias al rechazar o contradecir | Rechazar sin observaciones → 400; el motivo queda en el historial | Alta | 5 | [COMPLETAR] |
| MEJ-03 | #3 | bug | CP-15 | Reglas de elegibilidad ("No elegible" por promedio mínimo u otros filtros duros) | Caso bajo mínimo devuelve elegibilidad negativa con motivo | Alta | 3 | [COMPLETAR] |
| MEJ-04 | #4 | bug | CP-13 | Backend debe validar que los pesos de criterios sumen 100 % | POST/PUT con suma ≠100 → 400 | Alta | 2 | [COMPLETAR] |
| MEJ-05 | #5 | bug | CP-05 | Convocatoria debe validar fin posterior a inicio | POST con fin<inicio → 400 con detalle por campo | Media | 1 | [COMPLETAR] |
| MEJ-06 | #6 | ux-improvement | hallazgo-2 | Módulo Seguimiento (documentado en diagramas, sin implementar) | Historia de usuario + pantalla o descarte documentado | Media | 5 | [COMPLETAR] |
| MEJ-07 | #7 | ux-improvement | hallazgo-2 | Módulo Reportes (RF-08 parcial; placeholder actual) | Pantalla o descarte documentado | Media | 5 | [COMPLETAR] |
| MEJ-08 | #8 | ux-improvement | hallazgo-2 | Módulo Administración/usuarios (documentado, sin implementar) | Historia de usuario + pantalla o descarte documentado | Media | 5 | [COMPLETAR] |
| MEJ-09 | #9 | ux-improvement | Checklist ítem 10 | Contraste: dorado 3.15:1 y muted 4.08:1 bajo 4.5:1 | Ambos ≥4.5:1 verificados con la misma fórmula | Baja | 1 | [COMPLETAR] |
