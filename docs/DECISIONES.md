# Decisiones de implementación — DSS-Becas

Registro de decisiones tomadas por falta de información o por conflicto entre fuentes. Toda la interfaz y docs en español.

- **D1 Contrato snake_case.** Prevalecen `openapi.yaml` + `script_bd.sql`: `id_estudiante`, `ingreso_familiar`, `nombre_beca`. `codigo`, `ingresoFamiliar`, `tipoBeca` (UML) deprecados.
- **D2 Beca con enums.** `tipo: Excelencia|Social`, `estado: Activa|Inactiva` (diccionario/SQL → `openapi.yaml`).
- **D3 Idioma de código inglés, UI español.** Identificadores y componentes en inglés (consistencia con el código existente); textos visibles, comentarios y docs en español.
- **D4 Estructura AGENTS.md sobre el encargo.** `AGENTS.md` fija `components/`, `pages/`, `services/api/`, `models/`, `routing/`, `state/`, `utils/`, `styles/` y tiene prioridad: no se crean `app/`, `layouts/`, `types/`, `mocks/`, `hooks/`. Equivalencias: `routing/`≈app+router, `components/layout/`≈layouts, `models/`+`services/api/types.ts`≈types, `services/api/mocks.ts`≈mocks, `state/useAsync.ts`≈hooks.
- **D5 Sin Tailwind.** El proyecto usa CSS con variables (`styles/tokens.css` + `globals`). No se instala Tailwind.
- **D6 Resumen del dashboard calculado.** `dashboardService.getResumen()` calcula desde los mocks (Módulo 3); los agregados del PNG (482/210/156/39) no se hardcodean, por lo que los KPI muestran los valores de la muestra mock. Diferencia conocida vs PNG.
- **D7 Código EST-NNN solo visual.** Derivado como `EST-<id con 3 dígitos>`; nunca viaja al contrato.
- **D8 Campos UI-only.** Carnet, contacto, asistencia, semestre, carga familiar, condición vulnerable, documentos y solicitud de beca se muestran (fiel al mock) pero no se envían a `POST /estudiantes` hasta ampliar contrato+SQL.
- **D9 Pesos y umbrales como constantes frontend** (30/15/25/15/15; ≥80/60–79/<60) hasta que el backend/Motor DSS los provea.
- **D10 Sin ruta de edición.** El diagrama solo contempla Nuevo y Detalle; RF-02 no tiene endpoint. No se crea `/estudiantes/:id/editar`.
- **D11 Rutas de evaluación.** Se mantiene `/evaluaciones/nueva` (diagrama dice "Evaluación DSS" sin paths); no se crean `/evaluacion` ni `/evaluacion/:id`.
- **D12 Fuente Inter** (Google Fonts, fallback system-ui): la de los PNG no es identificable.
- **D13 `VITE_USE_MOCKS=true` por defecto** (sin backend). Los servicios simulan 300 ms y mantienen la misma firma en ambos modos.
- **D14 Iconos lucide discretos** en sidebar y KPI (los PNG muestran solo texto; mejora sin contradecir pantallas/campos/flujos).
- **D15 recharts solo para Distribución** del dashboard; el resto sigue CSS (suficiente y fiel al PNG).
- **D16 Umbrales mandan sobre etiquetas del PNG.** El mock pinta "Ana Rojas 81.4 En revisión" pero la leyenda del propio PNG dice Recomendado ≥80: 81.4 se clasifica Recomendado (igual en gestión y detalle).
- **D17 Mocks con forma exacta del contrato.** Aunque el encargo pide CI/semestre en mocks, `Estudiante` no los tiene: no se agregan campos fuera del contrato.
- **D18 Sin GET /becas en el contrato.** `becasApi.list()` solo devuelve mock; en modo real (`VITE_USE_MOCKS=false`) propaga el error y la vista muestra Reintentar.
