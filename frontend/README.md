# DSS-Becas Frontend

Aplicación web del Sistema de Soporte a Decisiones para becas (React 18 + TypeScript + Vite 5). Diseño fiel a `../prototypes/*.png`; contrato en `../docs/api/openapi.yaml`.

## Requisitos

Node 20+ y npm.

## Instalación

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:8080
npm run typecheck
npm run build
```

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
- `/estudiantes` ← `gestion-estudiantes.png` (tabla + buscador)
- `/estudiantes/nuevo` ← `nuevo-estudiante.png` (formulario `POST /estudiantes`)
- `/estudiantes/:idEstudiante` ← `detalle-estudiante.png` (ficha + criterios + historial)
- `/evaluaciones/nueva` ← `evaluacion-dss.png` (`POST /evaluaciones`)
- `/becas` (sin PNG: lista de becas), `/seguimiento`, `/reportes`, `/administracion` (placeholders)

Notas: sin backend los servicios usan mocks (`live:false`); umbrales DSS ≥80/60–79/<60 (ver `../docs/DECISIONES.md`).
