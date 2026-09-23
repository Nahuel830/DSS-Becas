# DSS-Becas Frontend (scaffold)

Esqueleto funcional según `docs/frontend/plan_frontend.md`. Sin detalle visual todavía.

## Requisitos

Node 20+ y npm.

## Uso

```bash
cp .env.example .env   # o set VITE_API_URL en tu entorno
npm install
npm run dev            # http://localhost:8080
npm run typecheck
npm run build
```

## Estructura

`components/` `pages/` `services/api/` `models/` `routing/` `state/` `utils/` `styles/`
Contrato: `../docs/api/openapi.yaml` (tipos en `src/services/api/types.ts`).
