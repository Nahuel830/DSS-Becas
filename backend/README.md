# DSS-Becas Backend

API REST (Node.js + Express + TypeScript + Prisma + Zod). Prefijo `/api`. SQLite local (`prisma/dev.db`); portable a MySQL/PostgreSQL (ver D26).

## Requisitos

Node 18+ y npm.

## Instalación y arranque

```bash
cp .env.example .env
npm install
npm run db:migrate   # crea la base
npm run db:seed      # carga 30 estudiantes y catálogos (idempotente)
npm run dev          # http://localhost:3001/api (watch con tsx)
```

Desde la raíz del repo: `npm run setup` (todo lo anterior) y `npm run dev` (backend + frontend).

## Scripts

`dev` · `build` + `start` · `typecheck` · `test` (Vitest + supertest, base `test.db` aislada) · `db:migrate` · `db:seed` · `db:reset` · `db:studio` (ver la base en el navegador).

## Variables (`backend/.env`)

`PORT=3001` · `DATABASE_URL="file:./dev.db"` · `CORS_ORIGIN=http://localhost:5173` · `JWT_SECRET` (clave obligatoria que firma los tokens de login; generar una aleatoria en producción) · `UPLOAD_DIR=uploads`.

## Endpoints principales

- `GET /api/health`, `POST /api/dev/reset` (solo desarrollo)
- Estudiantes: `GET /api/estudiantes` (q, carrera, semestre, estado, orden, dir, page, pageSize → `{data,total,page,pageSize}`), `GET /:id` (con relaciones), `POST`, `PUT /:id`, `DELETE /:id` (cascada), `GET /:id/historial`
- Evaluaciones: `POST /calcular` (motor sin guardar), `POST /` (guarda + resultado + evento), `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /evaluar-todos`
- `GET /api/ranking?convocatoriaId=&tipoBecaId=`, `GET /api/dashboard/resumen`
- Catálogos CRUD: `/api/carreras`, `/api/tipos-beca`, `/api/convocatorias`, `/api/criterios` (409 si tienen asignaciones)
- Asignaciones: `GET /`, `GET /resumen`, `POST /generar`, `POST /`, `PUT /:id`, `DELETE /:id`
- Seguimiento: `GET /` (por periodo), `GET /becarios` (una fila por asignación Aprobada), `GET /asignacion/:id`, `POST /`, `PUT /:id`
- Documentos: `POST /api/estudiantes/:id/documentos` (multer, PDF/JPG/PNG ≤5 MB), `GET /:id/documentos`, `GET /api/documentos/:id/descarga`, `DELETE /api/documentos/:id`
- Becas: `GET /api/becas`, `POST /api/becas`

Errores uniformes `{error, detalles?}`: 400 validación, 404, 409 duplicados/con dependencias, 500.
