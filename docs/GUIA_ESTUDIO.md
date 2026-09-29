# Guía de estudio — DSS-Becas

> Para los 5 integrantes. Objetivo: que **todos** puedan explicar, línea por línea, qué hace el código, **por qué** se hizo así y **con qué** (tecnologías) para la revisión del docente.
> Está escrita a partir de la lectura del repositorio completo (backend, frontend, base de datos, pruebas y documentación). Cuando algo es una debilidad real del proyecto, se dice de frente (sección 13) para que la defiendan con criterio en lugar de que el docente la descubra.

---

## 0. Cómo usar esta guía

| Tiempo | Qué hacer |
|---|---|
| **30 min (mínimo)** | Secciones 1, 3, 5 y 12. Con eso pueden explicar qué es, cómo fluye una petición y cómo se calcula el puntaje. |
| **Medio día** | Añadir 2, 4, 6, 7, 8. Abran cada archivo citado mientras leen. |
| **1–2 días** | Todo, más ejecutar el sistema (sección 14) y contestar el autoexamen (sección 15) sin mirar. |

**Regla de oro para la revisión:** el docente preguntará "¿qué hace este archivo/función y por qué está aquí?". Para cada archivo respondan tres cosas: **(1) qué hace, (2) quién lo llama, (3) qué pasaría si no existiera.**

---

## 1. El proyecto en 5 minutos

**DSS-Becas** es un *Sistema de Soporte a Decisiones* (DSS) para Bienestar Universitario. Ayuda a decidir **a quién dar una beca** y a **seguir su rendimiento** después.

**Idea central:** a cada estudiante se le califica en 5 criterios (0–100). El sistema calcula un **puntaje final ponderado** y lo clasifica:

| Puntaje final | Etiqueta |
|---|---|
| ≥ 80 | **Recomendado** |
| 60 – 79.99 | **En revisión** |
| < 60 | **En riesgo** |

Además hay *filtros duros* (elegibilidad): promedio mínimo 51 y, para beca Social, ingreso familiar ≤ Bs 4000. Un estudiante que no cumple se muestra **"No elegible"** aunque su puntaje sea alto.

**Qué se puede hacer en el sistema (11 vistas):** login, dashboard, gestión de estudiantes (lista, alta, edición, detalle con documentos e historial), evaluación DSS, becas (ranking, cupos, presupuesto, asignar/aprobar/rechazar/revocar), seguimiento académico por periodo, reportes (resumen, CSV, imprimir), configuración (catálogos y pesos) y administración de usuarios.

### Tecnologías y por qué se eligieron

| Capa | Tecnología | Para qué / por qué |
|---|---|---|
| Frontend | **React 18 + TypeScript + Vite 5** | UI por componentes; TS evita errores de tipos; Vite arranca rápido. |
| Rutas | **React Router 6** | Navegación entre pantallas sin recargar; rutas protegidas. |
| Datos del servidor | **TanStack Query 5** | Caché, estados `loading/error`, reintentos e invalidación tras guardar. |
| Gráficos / iconos | **recharts / lucide-react** | Gráficos del reporte; iconos del menú. |
| PDF | **jspdf + jspdf-autotable** | Exportar tablas a PDF (`utils/export.ts`). |
| Estilos | **CSS propio con variables** (`tokens.css` + `global.css`) | Decisión D5: sin Tailwind, colores tomados de los prototipos. |
| Backend | **Node + Express 4 + TypeScript** | API REST en JSON. |
| Base de datos | **SQLite + Prisma 5** | ORM tipado; SQLite porque no requiere instalar servidor (D26). |
| Validación | **Zod** | Valida el cuerpo de cada petición y da errores por campo. |
| Seguridad | **JWT (jsonwebtoken) + bcryptjs** | Sesión por token; contraseñas guardadas como hash. |
| Archivos | **multer** | Subida de documentos (PDF/JPG/PNG ≤ 5 MB). |
| Pruebas | **Vitest + supertest** | Pruebas unitarias y de API (`npm test` en ambos). |

---

## 2. Mapa del repositorio

```
DSS-Becas/
├── AGENTS.md              ← reglas del proyecto (fuentes de verdad, estructura, convenciones)
├── package.json           ← scripts raíz: setup y dev (backend + frontend a la vez)
├── backend/               ← API REST
│   ├── prisma/            ← schema.prisma, migraciones, seed, set-passwords
│   ├── src/
│   │   ├── server.ts / app.ts      ← arranque y configuración de Express
│   │   ├── config/                 ← db.ts (Prisma+WAL), env.ts (variables, CORS)
│   │   ├── routes/index.ts         ← TODAS las rutas + permiso por ruta
│   │   ├── controllers/            ← reciben req/res y usan Prisma
│   │   ├── dss/                    ← MOTOR DSS (lógica pura, sin BD ni Express)
│   │   ├── validators/schemas.ts   ← esquemas Zod
│   │   ├── auth/                   ← jwt.ts, permisos.ts
│   │   ├── middlewares/            ← requireAuth, validate, errorHandler, async, notFound
│   │   └── seed.ts                 ← datos iniciales (30 estudiantes, catálogos, 3 usuarios)
│   └── tests/             ← api, auth, permisos, qa/auditoria
├── frontend/
│   └── src/
│       ├── main.tsx                ← punto de entrada (providers)
│       ├── routing/                ← routes.ts, router.tsx, guards.tsx
│       ├── pages/                  ← una página por ruta (*Page.tsx)
│       ├── components/             ← piezas reutilizables (+ layout/)
│       ├── services/api/           ← cliente HTTP, un archivo por recurso, mocks
│       ├── state/                  ← AuthContext, Permisos, Toast, hooks
│       ├── models/domain.ts        ← enums y tipos de dominio
│       ├── utils/                  ← dss.ts, format.ts, export.ts
│       └── styles/                 ← tokens.css, global.css
├── docs/                  ← SRS, OpenAPI, BD, arquitectura, UML, QA, DECISIONES.md
├── prototypes/            ← PNG de las pantallas diseñadas (UI de referencia)
├── diagrams/ y ux_strategy/
```

**Orden de autoridad si algo se contradice** (AGENTS.md): `openapi.yaml` y `script_bd.sql` > SRS/arquitectura/UML > prototipos.

**Historial:** ~62 commits, con convención `feat/fix/docs`. El proyecto creció por fases: análisis y docs → frontend con mocks → backend real → auditoría QA (issues #1–#9) → módulos de seguimiento/reportes/administración → login → matriz de permisos.

---

## 3. Arquitectura y flujo de una petición

**Capas** (documentado en `docs/architecture/`):

```
Navegador (React)
   │  fetch + token JWT
   ▼
routes/index.ts ─► requireAuth ─► requirePermiso ─► validate(Zod) ─► controller
                                                                      │
                                     ┌────────────────────────────────┤
                                     ▼                                ▼
                              dss/ (Motor DSS)                  Prisma ─► SQLite
```

**Regla de arquitectura clave:** el cálculo del puntaje vive **solo** en `backend/src/dss/` (funciones puras). Los controladores lo *llaman*, no lo reimplementan; y no hay lógica de puntaje en SQL.

### Ejemplo completo: "Evaluar a un estudiante" (memorícenlo)

1. **`EvaluacionPage.tsx`**: el usuario elige estudiante, escribe los 5 criterios (0–100) y pulsa *Calcular*.
2. La página llama `evaluacionesApi.calcular(...)` → `POST /api/evaluaciones/calcular` (en `services/api/evaluaciones.ts`, que usa `apiClient` de `client.ts`, el cual **agrega el header `Authorization: Bearer <token>`**).
3. En el servidor, `routes/index.ts` ejecuta en cadena:
   - `requireAuth` → verifica el JWT y **recarga al usuario de la BD** (si está inactivo o cambió `token_version` → 401).
   - `requirePermiso("evaluaciones:crear")` → si el rol no lo tiene → 403.
   - `validate(calcularSchema)` → Zod valida el cuerpo; si falla → 400 con `detalles` por campo.
   - `ah(evaluaciones.calcularPuntaje)` → controlador (envuelto por `ah` para capturar errores async).
4. `calcularPuntaje` llama `calcular()` del **motor** (`dss/motor.ts`), busca promedio e ingreso del estudiante y llama `evaluarElegibilidad()` (`dss/elegibilidad.ts`). Responde puntajes + `elegible` + `motivos_no_elegible`. **No guarda nada.**
5. La página muestra el resultado y hace `POST /api/evaluaciones` con los puntajes. `evaluaciones.crear` **crea la Evaluación, hace `upsert` del Resultado** (etiqueta Recomendado/En revisión/En riesgo) **y crea un Evento** en el historial.
6. `onSuccess` en el frontend **invalida las cachés** (`["dashboard"]`, `["estudiantes"]`, `["ranking"]`…) para que las otras pantallas se refresquen, y muestra un *toast*.
7. Cualquier error pasa por `errorHandler.ts`, que lo traduce a JSON `{ error, detalles? }` con el código correcto (400/404/409/503/500).

### Cómo se manejan los errores (contrato uniforme)

`errorHandler.ts` convierte:
- `HttpError(status, msg, detalles)` → ese status.
- Prisma `P2002` (valor único repetido) → **409** "Ya existe un registro con ese CI".
- `P2025` → 404; `P2003` (FK inválida) → 400; base bloqueada → **503**.
- `PrismaClientValidationError` → 400.
- Cualquier otra cosa → **500** con código `ERR-XXXX` que también se imprime en el log (para rastrear).

El frontend lo recibe como `ApiError` (`client.ts`) y muestra el mensaje real al usuario.

---

## 4. Base de datos (`backend/prisma/schema.prisma`)

**Prisma** describe el modelo y genera el cliente tipado. Las migraciones están en `prisma/migrations/` (7 en total: inicial → observaciones → seguimiento → usuario_activo → estudiante_solicitud → usuario_auth → usuario_requerido). Cada una cuenta un pedazo de la historia del proyecto.

### Tablas (las 4 originales del SQL/SRS + las agregadas)

| Modelo | Rol | Notas clave |
|---|---|---|
| **Estudiante** | Datos personales, académicos, socioeconómicos | `ci`, `correo`, `codigo_universitario` **únicos**. Campos opcionales con `?`. |
| **Evaluacion** | Puntaje académico, social y final por fecha | Varias por estudiante. FK con `onDelete: Cascade`. |
| **Resultado** | Etiqueta actual del estudiante | `id_estudiante` **único** → 1 por estudiante (por eso `upsert`). |
| **Beca** | Beca directa (según OpenAPI) | `tipo` Excelencia/Social, `estado` Activa/Inactiva. |
| Carrera, TipoBeca, Convocatoria, Criterio | **Catálogos** | TipoBeca tiene `monto` y `cupos`; Convocatoria tiene `presupuesto`. |
| **Asignacion** | Estudiante ↔ convocatoria ↔ tipo de beca | `@@unique([est, conv, tipo])` evita asignar dos veces; `Restrict` en convocatoria/tipo. |
| **Seguimiento** | Promedio por periodo de una asignación | Estado calculado por regla. |
| **Documento** | Archivos adjuntos | Guarda la ruta en disco. |
| **Evento** | Historial/auditoría | `id_estudiante` **nullable** (eventos de login/usuarios no tienen estudiante). |
| **Usuario** | Login | `password_hash`, `token_version`, `debe_cambiar_password`, `activo`. |

### Relaciones y borrado en cascada
Al eliminar un Estudiante se borran automáticamente sus evaluaciones, resultado, becas, documentos, eventos y asignaciones (`onDelete: Cascade`). En cambio, **no se puede** borrar un TipoBeca/Convocatoria con asignaciones (`Restrict` + guarda 409 en el controlador).

### Por qué SQLite y no MySQL (pregunta segura del docente)
Los diagramas y `script_bd.sql` hablan de MySQL (`dss_becas`), pero no había servidor disponible; se usó SQLite con tipos portables. Para pasar a MySQL basta cambiar `provider` y `DATABASE_URL`. Está registrado en la decisión **D26**. Al arrancar se activan `WAL` y `busy_timeout=5000` (`config/db.ts`) para tolerar varios usuarios y Prisma Studio abierto.

### Seed (`src/seed.ts`)
Idempotente (usa `upsert`/`findFirst`, se puede correr muchas veces). Carga 30 estudiantes, carreras, 2 tipos de beca (Excelencia Bs 600 × 20 cupos; Social Bs 400 × 30), una convocatoria (presupuesto Bs 50 000), los 5 criterios, evaluaciones, becas de ejemplo, una asignación con seguimiento, y **3 usuarios** (admin / evaluador / consulta). Los puntajes finales del seed son valores fijos tomados de los prototipos (no salen del motor).

---

## 5. El Motor DSS (`backend/src/dss/`) — lo más importante

Son funciones **puras** (sin BD ni Express) → fáciles de probar. Cinco archivos:

### 5.1 `criterios.ts`
- `CRITERIOS`: los 5 criterios y sus pesos: Rendimiento **30**, Asistencia **15**, Situación socioeconómica **25**, Carga familiar **15**, Condición vulnerable **15** (suman **100**).
- `UMBRAL_RECOMENDADO = 80`, `UMBRAL_REVISION = 60`.
- `validarPesos()` lanza error si no suman 100 (se ejecuta al cargar el módulo).
- `recomendar(puntaje)` → `"Recomendado" | "En revisión" | "En riesgo"`.

### 5.2 `motor.ts`
`calcular(criterios)` devuelve:

```
puntaje_academico = (rendimiento + asistencia) / 2
puntaje_social    = (situacion + carga + vulnerable) / 3
puntaje_final     = (rend·30 + asist·15 + sit·25 + carga·15 + vuln·15) / 100
```
todo redondeado a 2 decimales (`redondear2`).

**Ejemplo para aprender a mano** (rendimiento 90, asistencia 80, situación 70, carga 60, vulnerable 50):
- académico = (90+80)/2 = **85**
- social = (70+60+50)/3 = **60**
- final = (2700 + 1200 + 1750 + 900 + 750)/100 = **73.0** → **En revisión**.

`derivarCriterios(promedio, ingreso)` se usa en **"evaluar todos"** cuando solo hay datos básicos (D32): rendimiento = promedio; asistencia = 90 (neutra); situación = `100 − ingreso/6000·100` limitado a 0–100; carga = 70; vulnerable = 60.

### 5.3 `elegibilidad.ts`
`PROMEDIO_MINIMO = 51` y `TOPE_INGRESO_SOCIAL = 4000`. `evaluarElegibilidad(est, tipoBeca)` devuelve `{ elegible, motivos_no_elegible[] }`. Son "filtros duros" previos al puntaje (issue #3 de QA).

### 5.4 `ranking.ts`
- `mejorPorEstudiante()`: si un estudiante tiene varias evaluaciones, se queda con la de mayor puntaje (evita duplicados en el ranking, issue #1).
- `ordenarRanking()`: puntaje ↓; empate → **promedio ↓**; empate → **menor ingreso familiar** (más necesidad primero).

### 5.5 `seguimiento.ts`
- `evaluarPeriodo(promedio)` → `"En riesgo"` si < 51, si no `"Al día"`.
- `sugerirSuspension(estados)` → `true` si los **dos últimos** periodos están "En riesgo".

Estas reglas están cubiertas por pruebas (sección 9). Correspondencia con casos del docente: **CP-002** (evaluación) y **CP-003** (asignación).

---

## 6. Backend, archivo por archivo

### Arranque
- **`server.ts`**: espera `dbLista` (pragmas SQLite) y escucha en `0.0.0.0:PORT` (para acceso por red local); imprime las IP locales.
- **`app.ts`**: `cors` con función `origenPermitido`, `express.json({limit:"2mb"})`, monta `router` en `/api`, luego `notFound` y `errorHandler` (el orden importa: el manejador de errores va al final).
- **`config/env.ts`**: lee variables (`PORT`, `CORS_ORIGIN`, `CORS_LAN`, `UPLOAD_DIR`, `NODE_ENV`). `origenPermitido` acepta `localhost`, `127.0.0.1`, `192.168.*.*` y `10.*.*.*` si `CORS_LAN=true` (D49).
- **`config/db.ts`**: crea el único `PrismaClient` y aplica `PRAGMA journal_mode=WAL` y `busy_timeout`.

### Middlewares (`middlewares/`)
| Archivo | Qué hace |
|---|---|
| `async.ts` (`ah`) | Envuelve handlers `async` para que un error rechazado llegue a `next(err)` (Express 4 no lo hace solo). |
| `validate.ts` | Ejecuta `schema.safeParse(req.body)`; si falla arma `detalles {campo: mensaje}` → 400; si pasa reemplaza `req.body` por los datos **ya limpios y convertidos**. |
| `requireAuth.ts` | Lee `Authorization: Bearer`, verifica JWT, **consulta al usuario en BD en cada petición**, rechaza inactivos o con `token_version` distinto, y deja `req.usuario`. |
| `errorHandler.ts` | Traduce errores (ver sección 3). Define `HttpError`. |
| `notFound.ts` | 404 JSON para rutas inexistentes. |

### Validación (`validators/schemas.ts`)
Zod con ayudas propias muy importantes para el "guardado robusto" (D51/D52):
- `aVacio`: `""`, `"Seleccionar..."`, `null` → `undefined` (evita guardar `""` en campos únicos, que chocaban en P2002).
- `aDecimal`: acepta **coma decimal** (`"1.499,99"` → `1499.99`); inválido → deja el texto para que Zod dé 400 (nunca `NaN` a Prisma).
- `estudianteSchema`: nombre/apellido/carrera obligatorios; CI con regex; edad 16–60; promedio 0–100; semestre 1–10; ingreso ≥ 0; `procedencia` urbano/rural.
- `convocatoriaSchema`: `superRefine` exige `fin > inicio` (issue #5).
- `pesosSchema`: los pesos enviados deben **sumar 100** (issue #4).
- `becaSchema`, `asignacionSchema`, `seguimientoSchema`, `criteriosSchema`, `calcularSchema`, etc.

### Rutas (`routes/index.ts`)
Un único archivo con todos los endpoints agrupados: Auth, Estudiantes, Evaluaciones/Ranking, Becas, Dashboard, Catálogos, Asignaciones, Reportes, Seguimiento, Documentos, Usuarios, Dev. Después de `/health` y `/auth/login` (públicos) hay `router.use(requireAuth)` y **cada ruta lleva `P("modulo:accion")`**.

### Controladores (`controllers/`)
| Archivo | Responsabilidad y puntos a saber |
|---|---|
| `estudiantes.ts` | `listar` filtra por `q/carrera/semestre` en SQL, y `estado`/orden por puntaje **en memoria** (dataset pequeño, D33), con paginación `{data,total,page,pageSize}`. `estadoDe()` deriva: beca activa → "Activa"; si no, recomendación por puntaje; si no hay evaluación → "Pendiente". `crear/actualizar` registran un **Evento**. |
| `evaluaciones.ts` | `calcularPuntaje`, `crear`, `actualizar`, `eliminar` (si no quedan evaluaciones borra el Resultado → vuelve a Pendiente), `evaluarTodos` (pendientes con criterios derivados), `ranking` (mejor evaluación por estudiante + marca `asignado`). |
| `asignaciones.ts` | `listar`, `resumen` (cupos y presupuesto usados/disponibles), `generar` (toma los **top-N libres** según cupos, ordenados por `ordenarRanking`), `actualizar` (decisión: **Rechazada/En observación exigen observaciones ≥ 10 caracteres**, issue #2), `revocar`. |
| `seguimiento.ts` | El **estado no lo manda el cliente**: se calcula con `evaluarPeriodo`. `porAsignacion` devuelve historial + `sugerencia_suspension`. |
| `catalogos.ts` | `catalogo()` es una **fábrica de CRUD genérico** para carreras, tipos de beca, convocatorias y criterios; en tipos y convocatorias bloquea borrar con asignaciones (409). `actualizarPesos` guarda todos los pesos en una **transacción**. |
| `dashboard.ts` | Resumen real: conteos por estado, top-5 (sin duplicados), distribución y alertas. |
| `reportes.ts` | `resumen` (postulantes, evaluados, aprobados, montos, por carrera/tipo) y **CSV** con BOM UTF-8 y `;` como separador (para Excel en español). |
| `documentos.ts` | `multer` con carpeta `uploads/<id>` creada *antes* de escribir (causa del 500 histórico, D51); solo PDF/JPG/PNG ≤ 5 MB. |
| `usuarios.ts` | CRUD solo Admin; `protegerAdmin` impide desactivar/eliminarse a sí mismo y al **último admin activo**; cambiar usuario o contraseña sube `token_version` (cierra sesiones). |
| `auth.ts` | `login` (usuario o correo, sin importar mayúsculas), **límite de 5 fallos / 10 min por usuario+IP → 429**, `me`, `cambiarPassword` (verifica la actual, sube `token_version`, devuelve token nuevo). |
| `resultados.ts` | `GET /resultados/:id` (estaba en OpenAPI y faltaba implementarlo, D61). |
| `dev.ts` | `POST /dev/reset`: borra todo y vuelve a sembrar (bloqueado si `NODE_ENV=production`). |

---

## 7. Seguridad y roles (`auth/`)

### JWT (`auth/jwt.ts`)
- Token con `{ id_usuario, rol, token_version }`, expira en **8 h**.
- El secreto sale de `JWT_SECRET`; si falta o es el valor de ejemplo, **lanza error** (no arranca "inseguro").

### `token_version` — concepto que el docente puede pedir
Cada usuario tiene un contador. El token guarda el valor con el que fue emitido. `requireAuth` compara con la BD: si el admin cambia la contraseña/usuario, el contador sube y **todos los tokens viejos dejan de servir** sin necesidad de una lista negra.

### Contraseñas
Nunca en claro: `bcryptjs` (hash con sal, costo 10). Las respuestas usan `select` sin `password_hash`.

### Permisos (`auth/permisos.ts`) — única fuente de verdad (D61)
Mapa `rol → ["modulo:accion", ...]`:
- **Administrador**: todo, incluida configuración, usuarios y `dev:reset`.
- **Evaluador**: crear/editar estudiantes, evaluar, decidir asignaciones, registrar seguimiento, ver reportes. **No** elimina, no genera asignaciones, no configura.
- **Consulta**: solo lectura.

`requirePermiso("x")` devuelve un middleware que responde **403** si el rol no lo tiene. Además marca la función con `.permiso`, y el test `permisos.test.ts` **recorre todas las rutas del router y falla si alguna no tiene permiso** (D64). Buena historia para contar.

El frontend **no decide permisos por su cuenta**: recibe `permisos[]` del servidor en el login/`/auth/me` y los usa para ocultar botones, menú y rutas (solo comodidad de UI; la seguridad real está en el backend).

---

## 8. Frontend

### 8.1 Arranque (`main.tsx`)
Anida providers de fuera hacia dentro: `QueryClientProvider` → `ToastProvider` → `AuthProvider` → `RouterProvider`. Todo el árbol puede así usar caché de datos, notificaciones y sesión.

### 8.2 Rutas (`routing/`)
- **`routes.ts`**: constantes de rutas (evita "strings mágicos"); las dinámicas son funciones (`detalleEstudiante(id)`).
- **`router.tsx`**: `createBrowserRouter`. Estructura anidada:
  `/login` (pública) → `RequireAuth` → `AppLayout` (sidebar+header) → páginas. Algunas envueltas en `RequirePermiso` (nuevo/editar estudiante, evaluación, configuración, administración). `*` → `NotFoundPage`.
- **`guards.tsx`**: `RequireAuth` (espera verificación; sin sesión → `/login`; si `debe_cambiar_password` fuerza `CambiarPasswordPage`), `RequirePermiso`/`RequireRol` (o "Acceso denegado").

### 8.3 Estado global (`state/`)
| Archivo | Función |
|---|---|
| `AuthContext.tsx` | Guarda sesión (token + usuario) en `localStorage`; al iniciar revalida con `/auth/me`; escucha el evento global **`dss:sesion-expirada`** (lo lanza `client.ts` ante cualquier 401) para cerrar sesión y avisar. Trae usuarios/permisos **mock** para el modo demo. |
| `Permisos.tsx` | Hook `usePermiso(p)` y componente `<Puede permiso=…>` para mostrar/ocultar. |
| `ToastContext.tsx` | Notificaciones (`exito/error/advertencia/info`), se cierran a los 4 s. |
| `queryClient.ts` | Config de TanStack Query (`retry: 1`, sin refetch al enfocar la ventana). |
| `useDebounce.ts` | Retrasa 300 ms el valor del buscador para no consultar en cada tecla. |
| `useAsync.ts` | Hook propio de carga (loading/error/data). |

### 8.4 Capa de servicios (`services/api/`) — patrón central
- **`client.ts`**: `apiClient.get/post/put/del` sobre `fetch`. Pone `Authorization`, convierte errores del backend en `ApiError`, y ante 401 emite el evento de sesión expirada. Exporta `USE_MOCKS` (solo `true` si `VITE_USE_MOCKS==="true"`).
- **Un archivo por recurso** (`estudiantes.ts`, `evaluaciones.ts`, `asignaciones.ts`, `seguimiento.ts`, `reportes.ts`, `catalogos.ts`, `usuarios.ts`, `documentos.ts`, `dashboard.ts`, `auth.ts`, `becas.ts`, `resultados.ts`): objetos como `estudiantesApi` con **la misma firma en modo real y modo mock**. Así las páginas no saben de dónde vienen los datos.
- **`types.ts`**: tipos con nombres **snake_case del contrato OpenAPI** (`id_estudiante`, `ingreso_familiar`…). Regla de AGENTS.md: nunca `codigo`/`ingresoFamiliar`/`tipoBeca`.
- **Modo demo**: `mocks.ts` (30 estudiantes) + `db.ts` (una mini-base en `localStorage`, clave `dss-becas-db`, con `getAll/getById/create/update/remove`). Solo si `VITE_USE_MOCKS=true`. Por defecto **todo persiste en la API**; si el servidor no responde se muestra "Sin conexión", **nunca** un fallback silencioso a mocks (D50).

### 8.5 TanStack Query — el patrón que se repite en cada página
```
const { data, isPending, isError, refetch } = useQuery({ queryKey: [...], queryFn: ... })
const m = useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: [...] }) })
```
- `queryKey` identifica la caché (p. ej. `["estudiantes", q, carrera, estado, pagina, ...]`: cambia el filtro → nueva consulta).
- `["dashboard"]` es la clave **compartida**: casi cualquier guardado la invalida para que el panel se actualice.
- Cada página maneja 3 estados: **cargando** (`Spinner`), **error** (`EmptyState` + Reintentar) y **datos**.

### 8.6 Páginas (`pages/`, una por ruta)
| Página | Qué hace / detalle a recordar |
|---|---|
| `LoginPage` | Formulario usuario/correo + contraseña; tras entrar vuelve a la ruta original (`location.state.desde`). |
| `CambiarPasswordPage` | Obligatoria si `debe_cambiar_password`; pide actual + nueva (≥ 8, letra y número). |
| `DashboardPage` | KPI, ranking top-5 (mejor puntaje por estudiante), alertas y gráfico de distribución. |
| `EstudiantesPage` | Búsqueda con debounce, filtros, orden y paginación **guardados en la URL** (`useSearchParams`) para conservarlos al volver; acciones según permisos. |
| `NuevoEstudiantePage` | Alta **y** edición (misma pantalla, según haya `:idEstudiante`). Formulario de ~27 campos con validación en cliente que **replica** las del servidor y mapea errores del servidor a cada campo (`MAPA_SERVIDOR`). Sube documentos aparte; si falla la subida, el estudiante **igual queda guardado** (D54). |
| `DetalleEstudiantePage` | Ficha, criterios, resultado, documentos (subir/descargar/eliminar) e **historial** de eventos. |
| `EvaluacionPage` | Formulario de 5 criterios; ver flujo en sección 3. |
| `BecasPage` | Elige convocatoria + tipo; muestra ranking, cupos/presupuesto y asignadas; **generar**, aprobar/rechazar/observar (con `ObservacionDialog`), revocar; exportar CSV/PDF. |
| `SeguimientoPage` | Lista de periodos con filtros; historial por becario y registro de nuevo periodo (el estado sale de la regla). |
| `ReportesPage` | Resumen por convocatoria con gráficos recharts, descargas CSV e impresión (`@media print`, clase `no-print`). |
| `ConfiguracionPage` | CRUD genérico por pestañas (`CrudTab<T>` con tipos genéricos) de carreras, tipos, convocatorias y criterios + guardado de pesos en lote. |
| `AdministracionPage` | CRUD de usuarios con roles y activar/desactivar. |
| `NotFoundPage` | 404 de la interfaz. |

### 8.7 Componentes (`components/`, uno por archivo, PascalCase)
Layout: `AppLayout` (Sidebar + Header + `<Outlet/>`), `Sidebar` (menú filtrado por permisos), `Header`. Presentación: `Card`, `PageHeader`, `KpiCard`, `EstadoBadge`, `RankingTable`, `EstudiantesTable`, `AlertsPanel`, `EstadoChart`, `CriterioBar`, `UmbralLegend`, `Avatar`. Formularios y diálogos: `FormField`, `FormSection`, `Modal`, `ConfirmDialog`, `ObservacionDialog`. Primitivas: `Button`, `Spinner`, `EmptyState`.

### 8.8 Utilidades y estilos
- **`utils/dss.ts`**: `clasificarPuntaje` (mismos umbrales que el backend), `PESOS_CRITERIOS`, `codigoEstudiante` (`EST-001`, solo visual), `nombreCompleto`.
- **`utils/format.ts`**: `formatPuntaje`, `formatMonedaBs` (Intl `es-BO`/BOB), `formatFecha`, `parseDecimal` (coma decimal, espejo de `aDecimal` del backend).
- **`utils/export.ts`**: CSV (BOM + `;`) y PDF.
- **`styles/tokens.css`**: variables (colores, radios, espacios) extraídas de los prototipos; `--gold` y `--muted` ajustados por contraste de accesibilidad (D48).
- **`vite.config.ts`**: `host:true` y **proxy `/api` → `localhost:3001`** para que funcione desde otras PCs de la red sin recompilar (D49).

---

## 9. Pruebas

Vitest en ambos lados (`npm test`). Backend con **supertest** contra una base SQLite aislada (`tests/helpers.ts`: `prepararDb`, `loginAdmin`, cliente con token).

| Archivo | Qué prueba |
|---|---|
| `api.test.ts` | Motor (30/15/25/15/15, umbrales, desempates), CRUD estudiantes, evaluar+dashboard, catálogos 409, reset, **guardado robusto** (coma decimal, vacíos, CI duplicado→409). |
| `auth.test.ts` | Login por usuario y correo, contraseña mala 401, inactivo 403, sin `password_hash`, invalidación de sesiones, último admin protegido. |
| `permisos.test.ts` | Matriz por rol y **cobertura de todas las rutas** (ver sección 7). |
| `qa/auditoria.test.ts` | Auditoría QA: datos inválidos, integridad, reglas DSS (cálculo a mano vs motor, elegibilidad, cupos/presupuesto), dashboard vacío, y tests de cierre de los issues #1–#9. |
| `frontend/tests/` | `dss.test.ts` (umbrales, código EST-NNN) y `format.test.ts`. |

**Anécdota técnica útil (D62/D63):** un `import` estático de las rutas en un test creaba `PrismaClient` *antes* de fijar `DATABASE_URL` y escribió usuarios de prueba en la base real. Se corrigió con **import dinámico** y se documentó. Muestra madurez: encontraron un fallo, lo corrigieron y lo dejaron escrito.

> Nota de honestidad: la documentación del proyecto declara backend 48/48 y frontend 11/11 en verde; en la revisión para esta guía **no se ejecutaron** (el repositorio se leyó sin instalar dependencias). Antes de la revisión, corran `npm test` y verifiquen.

---

## 10. Documentación y proceso (también se evalúa)

| Documento | Contenido |
|---|---|
| `docs/requirements/SRS_DSS_Becas.md` | RF-01…RF-08, RNF-01…RNF-04, historias HU-SEG/REP/ADM, matriz de roles. |
| `docs/api/openapi.yaml` (v1.2.0) | Contrato de la API. **Regla:** todo endpoint nuevo requiere actualizar el spec. |
| `docs/database/` | `script_bd.sql`, diccionario de datos, modelo entidad-relación. |
| `docs/architecture/` + `docs/uml/` | Arquitectura por capas, diagrama de componentes, clases, secuencia de evaluación, casos de uso. |
| `docs/DECISIONES.md` (D1–D67) | **Registro de cada decisión** tomada por falta de especificación o conflicto entre fuentes. Es la mejor prueba de criterio propio. |
| `docs/qa/` + `docs/testing/` | Reporte QA, checklist ISO 25010, lista de mejoras, issues, Postman, casos CP-001…CP-004, matriz de trazabilidad. |
| `docs/PLAN_IMPLEMENTACION.md`, `docs/frontend/plan_frontend.md` | Planes de trabajo. |
| `AGENTS.md` | Reglas del repo (estructura fija, contrato primero, commits convencionales, "docs-first"). |

**Metodología visible:** *docs-first* (se actualiza la doc con cada cambio), commits convencionales, ramas `feature/`/`fix/`/`docs/`, PRs (#10, #12), issues #1–#9 cerrados por commits, tablero GitHub Projects.

---

## 11. Reparto sugerido de estudio (5 integrantes)

Cada persona domina **su bloque a profundidad** y conoce el resto a nivel de la sección 3. El día previo, cada quien explica su bloque a los demás (10 min).

| # | Bloque | Archivos | Debe poder explicar |
|---|---|---|---|
| **1** | **Motor DSS y pruebas** | `backend/src/dss/*`, `tests/api.test.ts`, `tests/qa/auditoria.test.ts`, `frontend/utils/dss.ts` | Fórmulas con el ejemplo de la sección 5, umbrales, elegibilidad, ranking y desempates, `derivarCriterios`. |
| **2** | **Base de datos y API de negocio** | `schema.prisma`, migraciones, `seed.ts`, `controllers/estudiantes/evaluaciones/asignaciones/seguimiento/dashboard/reportes` | Modelo y relaciones, cascadas/Restrict, cada endpoint, flujo generar asignaciones. |
| **3** | **Seguridad, validación y errores** | `auth/*`, `middlewares/*`, `validators/schemas.ts`, `controllers/auth.ts`, `usuarios.ts`, `permisos.test.ts`, `auth.test.ts` | JWT + `token_version`, bcrypt, roles y permisos, Zod (`aVacio`/`aDecimal`), `errorHandler`, rate-limit. |
| **4** | **Frontend: estructura, estado y servicios** | `main.tsx`, `routing/*`, `state/*`, `services/api/*`, `models/`, `utils/format.ts` | Providers, guards, cliente HTTP, mocks vs API real, TanStack Query (keys/invalidación), contrato snake_case. |
| **5** | **Frontend: pantallas, componentes y UX + documentación** | `pages/*`, `components/*`, `styles/*`, `docs/*`, `prototypes/` | Cada pantalla y su flujo, formularios y validación, permisos en UI, decisiones D1–D67, SRS/OpenAPI, QA. |

---

## 12. Preguntas probables del docente (y cómo responder)

1. **¿Dónde está la lógica DSS y por qué ahí?** En `backend/src/dss/` como funciones puras: aislada de controladores y SQL (regla de AGENTS.md/arquitectura por capas); se prueba sin base de datos.
2. **Expliquen la fórmula del puntaje final.** Suma ponderada 30/15/25/15/15 sobre 100 (ejemplo 73.0 de la sección 5). Académico = promedio de rendimiento y asistencia; social = promedio de situación, carga y vulnerable.
3. **¿Cómo desempata el ranking?** Puntaje ↓, luego promedio ↓, luego menor ingreso familiar.
4. **¿Qué hace un estudiante "No elegible"?** Incumple promedio mínimo 51 o (beca Social) ingreso > Bs 4000; el sistema lo indica con motivos aunque el puntaje sea alto.
5. **¿Cómo protegen la API?** Login → JWT 8 h; `requireAuth` recarga al usuario en cada petición; `requirePermiso` por ruta; un test verifica que ninguna ruta quede sin permiso.
6. **¿Por qué `token_version`?** Para invalidar sesiones al cambiar contraseña/usuario sin lista negra.
7. **¿Cómo se guardan las contraseñas?** Hash bcrypt con sal; nunca se devuelven al cliente.
8. **¿Qué es Zod y por qué validan en cliente *y* servidor?** Zod valida el cuerpo y da errores por campo; el cliente valida por experiencia de usuario, el servidor por seguridad (nunca se confía en el cliente).
9. **¿Por qué SQLite si el diseño decía MySQL?** Sin servidor disponible; tipos portables; cambio con `provider` + `DATABASE_URL` (D26).
10. **¿Por qué TanStack Query?** Caché, estados de carga/error y `invalidateQueries` tras guardar para mantener pantallas sincronizadas.
11. **¿Qué es el modo mock?** Demo sin backend (`VITE_USE_MOCKS=true`) con la misma firma que la API real; por defecto está apagado y nunca hay fallback silencioso.
12. **¿Cómo evitaron el error 500 al guardar?** Coma decimal, `""` en campos únicos, carpeta `uploads` inexistente, SQLite bloqueado (D51–D56). Se reprodujo, se blindó y se probó.
13. **¿Cómo garantizan integridad referencial?** FK en Prisma con `Cascade`/`Restrict`, `@@unique`, guardas 409 en el controlador.
14. **¿Cómo probaron el sistema?** Vitest + supertest, auditoría QA con issues #1–#9, checklist ISO 25010, matriz de trazabilidad, colección Postman.
15. **¿Qué decisiones tomaron por su cuenta?** `docs/DECISIONES.md` (D1–D67): ej. umbrales de los prototipos, criterios derivados, configuración de elegibilidad.
16. **¿Cómo se organizó el equipo?** Issues, tablero de Projects, ramas por tipo, commits convencionales, PRs.

---

## 13. Puntos débiles reales (conózcanlos antes que el docente)

Son observaciones de la lectura del código. Ninguna rompe el sistema, pero un revisor atento puede señalarlas. Para cada una: qué es, y qué responder / cómo mejorarla.

1. **Los pesos editables en Configuración no afectan el cálculo.** La pantalla y `PUT /criterios/pesos` guardan pesos en la tabla `Criterio`, pero `motor.ts` usa pesos fijos (30/15/25/15/15) escritos dentro de la función `calcular` (además de `CRITERIOS` en `criterios.ts`). El frontend (`EvaluacionPage`, `utils/dss.ts`) también los tiene fijos (decisión D9/D30). *Mejora:* que el motor reciba los pesos de la BD (o de `CRITERIOS`, eliminando el objeto `peso` duplicado). *Cómo defenderlo:* "los pesos del prototipo son la regla vigente; la configuración persiste el catálogo, la conexión con el motor es el siguiente paso".
2. **El servidor confía en los puntajes que envía el cliente en `POST /evaluaciones`.** Solo `/evaluaciones/calcular` los calcula; el guardado acepta cualquier `puntaje_final` 0–100. El frontend real siempre calcula primero, pero otro cliente podría enviar valores arbitrarios. *Mejora:* recalcular en el servidor desde los 5 criterios.
3. **El resultado guardado no considera elegibilidad.** `evaluaciones.crear` usa `recomendar(puntaje)`; "No elegible" solo aparece en el cálculo/pantalla, no en `Resultado`.
4. **Lógica repetida:** "mejor evaluación por estudiante" está escrita a mano en `evaluaciones.ranking` y `asignaciones.generar` aunque existe `mejorPorEstudiante()` en `dss/ranking.ts`. También la regla de clasificación existe en backend (`dss/criterios.ts`) y frontend (`utils/dss.ts`), y la de seguimiento en mock (D42), y los permisos mock (D65). *Es una consecuencia de tener modo demo;* se documentó, pero es duplicación.
5. **Código con casts y handlers en línea:** `catalogos.ts` usa `as typeof prisma.carrera` para el CRUD genérico; `/becas` y `POST /asignaciones` tienen el handler dentro de `routes/index.ts` con `import()` dinámico en vez de controlador. *Mejora:* moverlos a controladores.
6. **Rate-limit en memoria** (`auth.ts`): se pierde al reiniciar y no funciona con varias instancias (D58, aceptado para esta fase).
7. **Dashboard:** el top-5 del servidor pasa `promedio: 0` e `ingreso: 0` al ordenar, así que el desempate por promedio/ingreso no se aplica ahí (sí en `/ranking`).
8. **Filtrado y orden "por estado" en memoria** en `estudiantes.listar` (D33): correcto para 30 registros; no escala a miles.
9. **Datos del seed no salen del motor:** los puntajes finales son fijos del prototipo; el "Ana Rojas 81.4" figura Recomendado por umbral (D16).
10. **Documentación desfasada en algunos puntos:** p. ej. D28 ("sin autenticación") quedó superada por D57; los diagramas siguen diciendo MySQL; `frontend/types.ts` cita "openapi v1.0.0" y el spec ya va por 1.2.0. Conviene señalar la superación de decisiones.
11. **Detalles menores:** `jwt.ts` reexporta `env` sin usarlo; `useAsync.ts` existe pero las páginas usan React Query; `bcrypt.hashSync` es síncrono (bloquea el hilo un instante).
12. **Cobertura de pruebas del frontend** limitada a utilidades (`dss`, `format`); las páginas no tienen pruebas de componentes.

> Consejo: no las escondan. Decir "lo sabemos, está registrado y la mejora es X" demuestra dominio del código.

---

## 14. Cómo ejecutarlo y guion de demo (5 min)

```bash
# Raíz del repo
cp backend/.env.example backend/.env    # y poner un JWT_SECRET aleatorio
npm run setup     # instala, migra y siembra la base
npm run dev       # backend :3001 + frontend :5173
cd backend && npm run db:studio          # ver la base en el navegador
cd backend && npm test ; cd ../frontend && npm test && npm run typecheck && npm run build
```

Usuarios de demostración (según la documentación del proyecto): `admin` / `Admin2026!`, `evaluador` / `Evaluador2026!`, `consulta` / `Consulta2026!`.

**Guion sugerido de demo:**
1. Login como **admin** → Dashboard (KPI y ranking).
2. **Estudiantes**: buscar, filtrar, abrir detalle (documentos + historial).
3. **Nuevo estudiante** con coma decimal en el ingreso (`1.499,99`) → se guarda; probar CI duplicado → error 409 legible.
4. **Evaluación DSS**: 90/80/70/60/50 → **73.0, En revisión**; probar estudiante con promedio < 51 → "No elegible".
5. **Becas**: generar asignaciones; rechazar sin observación (bloquea) y con ≥ 10 caracteres (pasa); ver cupos/presupuesto.
6. **Seguimiento**: registrar un periodo con promedio 45 → "En riesgo"; segundo periodo → sugerencia de suspensión.
7. **Reportes**: descargar CSV, imprimir.
8. Cerrar sesión, entrar como **consulta** → botones ocultos y, en Postman/URL directa, 403.
9. Mostrar `permisos.test.ts` y `DECISIONES.md`.

---

## 15. Autoexamen (respondan sin mirar el código)

1. Nombren las 4 tablas originales y las 6+ agregadas. ¿Qué borra `onDelete: Cascade`?
2. Calculen a mano: 100/100/100/0/0 → académico, social, final y etiqueta. *(100 / 33.33 / 70.0 → En revisión)*
3. ¿En qué orden pasan los middlewares de `POST /api/evaluaciones` y qué código devuelve cada fallo posible (401/403/400)?
4. ¿Por qué `Resultado.id_estudiante` es único y qué método de Prisma se usa por eso?
5. ¿Qué pasa si el admin cambia la contraseña de un usuario con sesión abierta?
6. ¿Qué diferencia hay entre `aVacio` y `aDecimal`? Den un ejemplo de cada uno.
7. ¿Qué hace `invalidateQueries({ queryKey: ["dashboard"] })` y dónde se usa?
8. ¿Cómo sabe el frontend qué botones mostrar? ¿Es eso suficiente para la seguridad?
9. ¿Qué cambia entre `VITE_USE_MOCKS=true` y `false`? ¿Qué nunca debe pasar?
10. Señalen 3 debilidades del proyecto y su mejora (sección 13).
11. ¿Cómo evita el sistema asignar más becas que cupos? *(`generar` toma solo `cupos − ocupados` candidatos; `@@unique` evita duplicar)*
12. ¿Por qué el CSV usa BOM y `;`? *(Excel en español: acentos y separador de columnas)*

---

## 16. Glosario rápido

- **DSS**: sistema de soporte a decisiones; recomienda, no decide.
- **ORM (Prisma)**: traduce objetos TypeScript a consultas SQL.
- **Middleware**: función que se ejecuta antes del controlador (auth, validación…).
- **JWT**: token firmado que identifica al usuario sin guardar sesión en el servidor.
- **CORS**: regla del navegador sobre qué orígenes pueden llamar la API.
- **Cascade / Restrict**: borrar en cadena / impedir borrar si hay dependientes.
- **Upsert**: crear si no existe, actualizar si existe.
- **Idempotente**: ejecutarlo varias veces da el mismo resultado (el seed).
- **Query key**: etiqueta de la caché en TanStack Query.
- **Mock**: dato/servicio simulado para demo sin backend.
- **snake_case**: `id_estudiante` (estilo del contrato y la BD).
