# Plan técnico del frontend — DSS-Becas

> Documento de planificación. No hay código implementado. Stack propuesto (pendiente de confirmación del owner según `AGENTS.md`); contrato vigente: `docs/api/openapi.yaml` v1.0.0; referencia visual: `prototypes/*.png`.

## 1. Framework y librerías propuestas

**Propuesta: React 18 + TypeScript + Vite (SPA).**

| Decisión | Propuesta | Justificación |
|----------|-----------|---------------|
| Framework | React + TypeScript | Sistema de gestión (formularios, tablas, dashboard): ecosistema maduro, tipado que evita errores de contrato (`id_estudiante` vs `codigo`), fácil para un segundo colaborador |
| Build/dev | Vite | Arranque rápido, salida estática compatible con el `launch.json` existente (Chrome contra localhost); sin SSR/prerender que el proyecto no necesita |
| Routing | React Router (rutas declarativas) | Mapeo 1:1 pantalla→ruta (ver §3); soporta `/:idEstudiante` para detalle |
| Server state | TanStack Query | Cache/reintentos de `GET /estudiantes` y `GET /resultados/:id`; evita estado global manual; ayuda a RNF-01 (<2s percibidos) |
| Formularios | React Hook Form + Zod | `nuevo-estudiante` tiene 4 bloques y ~13 campos; validación por esquema espejo de SQL (`NOT NULL`, `DECIMAL(5,2)`) y del YAML cuando agregue `required` (INC-17) |
| Tablas | TanStack Table (solo si la tabla crece) | Gestión con búsqueda/orden; si se quiere mínimo, tabla HTML + filtro local basta en fase 1 |
| Gráficos | Recharts | Dashboard: barras "Distribución por estado"; liviano, suficiente para KPIs/ranking |
| HTTP | `fetch` + wrapper tipado generado (§4) | Sin Axios salvo necesidad (interceptores auth futuros); menos dependencias |
| Estilos | Tailwind CSS (o CSS Modules como alternativa) | Prototipos: sidebar fijo + cards + tablas; Tailwind replica rápido ese layout y garantiza responsive (RNF-04) |

Descartados: Next.js/Nuxt (SSR innecesario, más complejidad), Angular (sobredimensionado para 5 vistas), jQuery/vanilla (no escala a dashboard + evaluación).

## 2. Estructura de carpetas (futura `frontend/`, aún no creada)

```
frontend/
  src/
    components/      # Sidebar, KpiCard, DataTable, StudentForm, CriteriaWeights, EstadoBadge…
    pages/           # DashboardPage, EstudiantesPage, NuevoEstudiantePage,
                     #   DetalleEstudiantePage, EvaluacionPage (una por ruta, §3)
    services/api/    # cliente generado + wrapper fetch (generated/ nunca se edita a mano)
    models/          # tipos generados + enums de dominio (TipoBeca, EstadoBeca, UmbralDSS)
    routing/         # router.tsx, routes.ts, guards (auth futura)
    state/           # QueryClient + contexto UI mínimo (sidebar, filtros); sin Redux
    utils/           # umbrales DSS (>=80/60-79/<60), formateo DECIMAL(5,2), helpers
    styles/          # tailwind.css / variables del tema (azul sidebar, teal acento)
  public/
```

Regla: las `pages/` son delgadas (orquestan); la lógica vive en `components/` y `services/`; el cálculo DSS **no** se implementa en el frontend (vive en el Motor DSS backend según arquitectura) — el frontend solo envía criterios/puntajes y muestra el resultado.

## 3. Mapeo pantalla → ruta → endpoints (`openapi.yaml`)

Base URL configurable (`VITE_API_URL`); rutas YAML sin prefijo `/api` (ver INC-10: no usar `/api/...` hasta decidir versionado).

| Prototipo | Ruta | Consume (YAML real) | Notas / gaps |
|-----------|------|---------------------|--------------|
| `dashboard-dss.png` | `/dashboard` (landing tras login) | `GET /estudiantes` (+ N× `GET /resultados/{id_estudiante}` o caché) | El YAML **no tiene** endpoint de agregados/ranking: KPIs (482/210/156/39), ranking y distribución se derivan en cliente. Componentes: `KpiCards`, `RankingTable`, `AlertsPanel` (alertas: mock local, sin endpoint), `EstadoChart` |
| `gestion-estudiantes.png` | `/estudiantes` | `GET /estudiantes` | Tabla Código/Nombre/Carrera/Estado/Puntaje + buscador local; "Ver" → `/estudiantes/:id`. `Puntaje` y `Estado beca` vienen de `resultados`/caché, no del `Estudiante` |
| `nuevo-estudiante.png` | `/estudiantes/nuevo` | `POST /estudiantes` | Solo `nombre, apellido, carrera, promedio, ingreso_familiar` van al contrato. Resto del mock (carnet, teléfono/correo, asistencia, semestre, carga familiar, condición vulnerable, documentos) es **UI-only fase 1**: no persistir ni enviar hasta ampliar YAML+SQL |
| `detalle-estudiante.png` | `/estudiantes/:idEstudiante` | `GET /resultados/{id_estudiante}` (+ dato fila cacheado de la lista) | Muestra recomendación, barras por criterio e historial. **Gap**: el historial por gestión (2024-I/II, 2025-I) y las barras por criterio no tienen endpoint — mock local hasta `GET /evaluaciones?estudiante=` o similar |
| `evaluacion-dss.png` | `/evaluaciones/nueva` | `POST /evaluaciones` → luego `GET /resultados/{id_estudiante}` | Pesos fijos en frontend (30/15/25/15/15) como constantes; umbrales `>=80 Recomendado / 60–79 En revisión / <60 En riesgo` (corrige secuencia, INC-15). El YAML recibe puntajes ya calculados, no criterios sueltos |
| (sin mock) Becas | `/becas` (futura) | `POST /becas` con `nombre_beca, tipo, estado, monto, id_estudiante` | Sin pantalla en `prototypes/`; no implementar hasta tener diseño. `GET /becas` no existe (INC-11) |

## 4. Tipado y cliente API desde `openapi.yaml`

- Fuente única: `docs/api/openapi.yaml`. Generar, no escribir a mano:
  - `npx openapi-typescript docs/api/openapi.yaml -o frontend/src/models/api.d.ts` (tipos `Estudiante, Evaluacion, Resultado, Beca` con `tipo: "Excelencia" | "Social"`, `estado: "Activa" | "Inactiva"`).
  - Opcional: `orval` si se quiere además el cliente fetch/Query ya tipado.
- Lo generado va a `services/api/generated/` y **no se edita**; el wrapper (`apiClient.ts`: baseURL, headers JSON, manejo de errores) importa de ahí.
- Naming: se conserva **snake_case del contrato** en requests/responses (`id_estudiante`, `ingreso_familiar`, `nombre_beca`…); nada de `codigo`/`ingresoFamiliar`/`tipoBeca` en el frontend.
- Validación: esquemas Zod por formulario que replican el contrato + límites SQL (`VARCHAR(100)`, `DECIMAL(5,2)`, NOT NULL); cuando el YAML agregue `required` (INC-17), regenerar y alinear.
- Regenerar el cliente en cada cambio del YAML (criterio de aceptación SRS: todo endpoint documentado y funcional).

## 5. Convenciones (para el colaborador)

- **Componentes**: `PascalCase` (`DetalleEstudiante`, `RankingTable`); un componente por archivo, mismo nombre de archivo; páginas terminan en `Page` (`DashboardPage`); hooks `use*`; constantes de dominio en `UPPER_SNAKE` (`UMBRAL_RECOMENDADO = 80`).
- **Ramas**: `feature/<ambito>` (p. ej. `feature/dashboard`), `docs/<tema>`, `fix/<tema>`; ramas cortas desde `main`.
- **Commits**: Conventional Commits (`feat(frontend): tabla de gestión`, `docs(frontend): plan inicial`, `fix(api): ejemplo apellido`). Un cambio lógico por commit; el doc afectado se actualiza en el mismo PR (docs-first).
- **PRs**: describir pantalla vs mock, ruta, endpoints consumidos y regeneración de tipos si tocó el YAML; adjuntar captura comparada con `prototypes/`.
- **No crear aún**: `frontend/` ni configs/build/CI hasta que el owner confirme el stack (`AGENTS.md` Workflow).
