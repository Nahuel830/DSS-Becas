# AGENTS.md — DSS-Becas

> Docs + UI prototypes + `frontend/` app (React 18+TS+Vite 5, Router 6, TanStack Query 5; ver `docs/frontend/plan_frontend.md`). 5 vistas implementadas (dashboard, gestión, nuevo, detalle, evaluación) + esqueleto becas; sin backend (mocks con forma del contrato), ni tests/lint/CI. Comandos verificados en `frontend/`: `npm install`, `npm run dev` (:8080), `npm run typecheck`, `npm run build`. Env: `VITE_API_URL` (ver `.env.example`).

## Sources of truth (trust in this order)

1. API contract: `docs/api/openapi.yaml` — endpoints `/estudiantes`, `/evaluaciones`, `/resultados/{id_estudiante}`, `/becas`; JSON over REST.
2. DB schema: `docs/database/script_bd.sql` is executable truth; `docs/database/diccionario_datos.md` explains it. Database is `dss_becas` (relational, FK integrity).
3. Requirements: `docs/requirements/SRS_DSS_Becas.md` (RF-01–RF-08, RNF-01–RNF-04).
4. Architecture: `docs/architecture/componentes_sistema.md`, `docs/architecture/decisiones_arquitectura.md`, `docs/architecture/diagrama_componentes.puml` — layered: Frontend UI → Controllers → Services → DSS Engine + MySQL.
5. Domain model: `docs/uml/clases.puml` + `docs/uml/secuencia_evaluacion.puml`; validation cases: `docs/testing/casos_prueba.md` (CP-001–CP-004).
6. UI scope: `prototypes/README.md` + `*.png`; navigation: `diagrams/DSS_Becas_Diagrama_Navegacion.drawio`.

If docs conflict, prefer `script_bd.sql` and `openapi.yaml` over prose `.md`.

## Constraints for new code (when implementation starts)

- Layered architecture only: keep DSS scoring (`puntaje_academico` + `puntaje_social` → `puntaje_final`) isolated in a Motor DSS service, never in controllers or SQL.
- Schema names are fixed: tables `ESTUDIANTE`, `EVALUACION`, `RESULTADO`, `BECA`; snake_case columns (`id_estudiante`, `ingreso_familiar`, `nombre_beca`, ...). Follow SQL/OpenAPI, not UML (`codigo`, `ingresoFamiliar`, `tipoBeca` are deprecated for contract purposes; OpenAPI already used snake_case, no rename needed).
- `BECA` requires `tipo` (Excelencia/Social) and `estado` (Activa/Inactiva) per SQL/dictionary. Resolved 2026-09-23 in `docs/api/openapi.yaml`: `Beca` schema now includes `tipo` and `estado` as enums — SQL untouched.
- API must stay REST+JSON, documented in OpenAPI; every new endpoint needs a spec update (SRS acceptance criterion).
- DSS score calculations must be covered by standardized test cases before acceptance (SRS); mirror CP-002/CP-003 when adding tests.

## Frontend (colaboradores: leer antes de tocar)

- Estructura fija: `components/` (+`layout/`), `pages/` (una por ruta), `services/api/` (cliente `client.ts`, tipos `types.ts`, `mocks.ts`), `models/`, `routing/` (`routes.ts` + `router.tsx`), `state/` (`queryClient.ts`), `utils/`, `styles/` (`global.css`, sin Tailwind).
- Contrato primero: tipos y nombres snake_case de `openapi.yaml` (`id_estudiante`, `ingreso_familiar`, `nombre_beca`; `tipo`/`estado` con enum). Nunca reintroducir `codigo`/`ingresoFamiliar`/`tipoBeca`.
- Sin backend: las vistas usan fallback a `mocks.ts` (misma forma del contrato) y exponen `live:false`. Clave de caché compartida `["dashboard"]`. Al conectar el backend real, quitar mocks por servicio, no la estructura.
- Rutas 1:1 con `prototypes/`: `/dashboard`, `/estudiantes`, `/estudiantes/nuevo`, `/estudiantes/:idEstudiante`, `/evaluaciones/nueva`, `/becas`. Placeholders sin endpoint: `/seguimiento`, `/reportes`, `/administracion` (no implementar hasta tener spec+mock).
- Componentes reutilizables: `Card`, `PageHeader`, `KpiCard`, `EstadoBadge`, `RankingTable`, `EstudiantesTable`, `AlertsPanel`, `EstadoChart`, `FormField`, `FormSection`, `Avatar`, `CriterioBar`, `UmbralLegend`. Un componente por archivo, `PascalCase`, páginas `*Page`.
- Commits convencionales (`feat(frontend): …`, `docs(…): …`, `fix(…): …`); ramas `feature/`, `docs/`, `fix/`; un cambio lógico por commit con su doc actualizada. No agregar frameworks/deps ni CI sin confirmación del owner.

## Workflow

- Docs-first repo: update the affected doc alongside any behavior change (contract, SQL, SRS, or test case), not code alone.
- Do not create build configs, runners, or CI unprompted; confirm stack choice with the owner first.
- Binary/docx artifacts (`*.docx`, `*.png`, `*.drawio.png`) are not editable sources — edit the `.md`/`.puml`/`.sql`/`.yaml` and regenerate exports.
