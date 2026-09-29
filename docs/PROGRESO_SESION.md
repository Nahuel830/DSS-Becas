# Progreso de sesión — cierre de módulos y login

Fecha: 2026-09-28. Rama: `feature/cierre-modulos`. Base de datos intacta (30 estudiantes, 28 evaluaciones, 3 usuarios).

## PARTE 1 — Bug de guardado: HECHA y commiteada (`8fbb067`)

- Reproducido: por API el ejemplo daba 400 (Zod frenaba la coma); el 500 real venía de la carpeta `uploads/<id>` inexistente (multer ENOENT), SQLite bloqueado y `""` en únicos.
- Blindaje backend: `aVacio`/`aDecimal` en zod (vacíos→`undefined`, `"1.499,99"`→`1499.99`), nuevas columnas `tipo_beca_solicitada`/`fecha_solicitud` con migración aplicada, `mkdirSync` antes de multer, WAL + `busy_timeout=5000`, `ValidationError`→400, P2003→400, 500 con código `ERR-<base36>`.
- Blindaje frontend: `parseDecimal`, CI vacío→`undefined`, nuevos campos en el payload, subida con aviso (sin tumbar el guardado), detalles por campo en Config/Admin/Evaluación.
- Tests: backend 40/40, frontend 11/11; typecheck y build verdes.
- Decisiones D51–D56.

## PARTE 2 — Login: NO EMPEZADA (paso exacto: nada implementado)

Hecho como preparación: `JWT_SECRET` aleatorio ya generado en `backend/.env` (gitignorado).
Falta todo, en este orden:
1. `npm i bcryptjs jsonwebtoken` + `-D @types/bcryptjs @types/jsonwebtoken`.
2. Migración Usuario (`usuario` opcional → rellenar → obligatorio + `password_hash`, `token_version`, `debe_cambiar_password`, `ultimo_acceso`, `activo`) SIN borrar usuarios.
3. `backend/prisma/set-passwords.ts` + `npm run db:passwords` + seed 3 usuarios.
4. Endpoints auth + `requireAuth`/`requireRol` + `Evento` de accesos + CORS Authorization.
5. Frontend: LoginPage, AuthContext, rutas protegidas, Header con usuario, permisos por rol, AdministracionPage extendida, mock de login.
6. `auth.test.ts` + adaptar tests existentes con helper de login.
7. openapi.yaml + README con los 3 usuarios.
8. Commit `feat(auth): login por usuario con roles y sesiones invalidables`.

## PARTE 3 — GitHub: PENDIENTE

- Commits existentes (no duplicar): QA/auditoría, cierre-modulos módulos, `fix: guardado robusto`, y el `wip` de abajo.
- Falta: typecheck/build/tests finales, verificación `.env`/`.db` fuera de git, `git pull --rebase origin main`, push, PR "Cierre de módulos, login y acceso remoto" con Closes #1–#9, merge, `checkout main && pull`.

## Migraciones y dependencias pendientes

- Migraciones aplicadas: `estudiante_solicitud` (datos verificados: 30/28/3). Ninguna pendiente.
- Dependencias pendientes: `bcryptjs`, `jsonwebtoken`, `@types/bcryptjs`, `@types/jsonwebtoken`.
