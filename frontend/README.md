# DSS-Becas Frontend

Aplicación web del Sistema de Soporte a Decisiones para becas (React 18 + TypeScript + Vite 5). Diseño fiel a `../prototypes/*.png`; contrato en `../docs/api/openapi.yaml`.

## Requisitos

Node 20+ y npm. Backend en `http://localhost:3001` (ver `../backend/README.md`).

## Instalación

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
npm test           # Vitest (utils y resumen)
```

Desde la raíz: `npm run setup` y `npm run dev` (levanta backend + frontend).

## Variables de entorno

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Base del backend (con prefijo `/api`) |
| `VITE_USE_MOCKS` | `false` | `true` → mocks en localStorage (demo); `false` → API real |

## Scripts

`dev` (puerto 5173) · `build` · `preview` · `typecheck` (`tsc --noEmit`) · `test` (`vitest run`).

## Variables de entorno

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Base del backend (sin barra final) |
| `VITE_USE_MOCKS` | `true` | `true` → mocks locales con retardo de 300 ms; `false` → API real |

## Scripts

`dev` (puerto 8080) · `build` · `preview` · `typecheck` (`tsc --noEmit`).

## Estructura

`components/` (UI reutilizable + `layout/` con Sidebar/Header) · `pages/` (una por ruta) · `services/api/` (cliente `client.ts`, tipos `types.ts`, `mocks.ts`) · `models/` (dominio) · `routing/` (`routes.ts` + `router.tsx`) · `state/` (`queryClient.ts`, `useAsync.ts`) · `utils/` (reglas DSS, formatos Bs/fecha/%) · `styles/` (`tokens.css`, `global.css`).

## Pantallas y su PNG

- `/dashboard` ← `dashboard-dss.png` (KPI, ranking top 5, alertas, distribución recharts)
- `/estudiantes` ← `gestion-estudiantes.png` (tabla con buscador, filtros, orden, paginación, ver/editar/evaluar/eliminar)
- `/estudiantes/nuevo` y `/estudiantes/:id/editar` ← `nuevo-estudiante.png` (formulario `POST /estudiantes`)
- `/estudiantes/:idEstudiante` ← `detalle-estudiante.png` (ficha + criterios + historial)
- `/evaluaciones/nueva` y `/evaluacion/:idEstudiante` ← `evaluacion-dss.png` (`POST /evaluaciones`)
- `/becas` — ranking, cupos/presupuesto, generar/revocar/decidir asignación, exportar CSV/PDF
- `/seguimiento` — periodos por becario, estados, historial y sugerencia de suspensión
- `/reportes` — resumen por convocatoria, 3 gráficos, CSV e impresión
- `/configuracion` — catálogos (carreras, tipos de beca, convocatorias, criterios) con pestañas
- `/administracion` — usuarios (crear/editar/activar/eliminar)

Notas: sin backend los servicios usan mocks (`live:false`); umbrales DSS ≥80/60–79/<60 (ver `../docs/DECISIONES.md`).

## Datos de prueba

Con `VITE_USE_MOCKS=true` los datos (30 estudiantes) se guardan en localStorage (`dss-becas-db`): altas, ediciones, bajas y evaluaciones persisten al recargar y el dashboard se actualiza solo. Con el backend (`false`), "Restablecer datos de prueba" llama a `POST /api/dev/reset`. Para volver a los datos iniciales: avatar "PB" (arriba a la derecha) → "Restablecer datos de prueba" → confirmar. Base real visible con `npm run db:studio` desde `../backend`.
