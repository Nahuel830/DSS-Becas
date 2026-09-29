# Progreso de sesión — cierre de módulos, login y permisos por rol

Fecha: 2026-09-29. Rama `fix/permisos-roles`. Base de datos intacta (30/28/3, verificado tras incidente D63).

## PARTE 1 — Bug de guardado: HECHA y commiteada (`8fbb067`)

- Reproducido: por API el ejemplo daba 400 (Zod frenaba la coma); el 500 real venía de la carpeta `uploads/<id>` inexistente (multer ENOENT), SQLite bloqueado y `""` en únicos.
- Blindaje backend: `aVacio`/`aDecimal` en zod (vacíos→`undefined`, `"1.499,99"`→`1499.99`), nuevas columnas `tipo_beca_solicitada`/`fecha_solicitud` con migración aplicada, `mkdirSync` antes de multer, WAL + `busy_timeout=5000`, `ValidationError`→400, P2003→400, 500 con código `ERR-<base36>`.
- Blindaje frontend: `parseDecimal`, CI vacío→`undefined`, nuevos campos en el payload, subida con aviso (sin tumbar el guardado), detalles por campo en Config/Admin/Evaluación.
- Tests: backend 40/40, frontend 11/11; typecheck y build verdes.
- Decisiones D51–D56.

## PARTE 2 — Login: HECHA y commiteada (migraciones `usuario_auth` + `usuario_requerido`, commit `feat(auth)`, D57–D60)

Backend (`requireAuth`/`requireRol`, login con rate-limit, `me`, cambio de password, usuarios solo Admin con guards, eventos, CORS Authorization, JWT aleatorio en `.env`), frontend (LoginPage, AuthContext, rutas protegidas, cambio obligatorio, Header, permisos por rol, administración extendida, mock demo), `auth.test.ts`, openapi 1.2.0 y README con los 3 usuarios.

## PARTE 3 — GitHub: HECHA (PR #10 fusionado a `main`, Closes #1–#9)

## Matriz de permisos por rol (rama fix/permisos-roles)

Backend `requirePermiso` en cada ruta (fuente: `backend/src/auth/permisos.ts`), frontend con `usePermiso`/`Puede`/`RequirePermiso` desde `permisos[]` del servidor, tests en `backend/tests/permisos.test.ts` (incluye cobertura total de rutas). Decisiones D61–D67. Commit `fix(auth): matriz de permisos por rol en backend y frontend`.

## PARTE 3 — GitHub: HECHA

- Commits por tema (sin duplicar): módulos, `fix: guardado robusto`, `feat(auth)`, docs.
- Verificación final: typecheck/build/tests en verde (backend 48/48, frontend 11/11); ningún `.env`/`.db`/binario versionado.
- PR #10 "Cierre de módulos, login y acceso remoto" (Closes #1–#9) fusionado; `main` actualizado.

## Migraciones y dependencias

- Migraciones aplicadas: `estudiante_solicitud`, `usuario_auth`, `usuario_requerido` (datos intactos).
- Dependencias instaladas: `bcryptjs`, `jsonwebtoken`, `@types/bcryptjs`, `@types/jsonwebtoken`.
