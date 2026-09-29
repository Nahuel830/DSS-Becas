# DSS-Becas

# Sistema de Soporte a Decisiones para la Asignación y Seguimiento de Becas Universitarias

## Descripción del proyecto

DSS-Becas es un Sistema de Soporte a Decisiones (DSS) orientado a apoyar el proceso de asignación y seguimiento de becas universitarias mediante el análisis de información académica y socioeconómica de los estudiantes.

El sistema permite gestionar información de estudiantes, evaluar candidatos mediante criterios ponderados, calcular puntuaciones DSS, generar rankings y proporcionar información de apoyo para la toma de decisiones del área de Bienestar Universitario.

El proyecto fue desarrollado aplicando conceptos de Ingeniería de Software y Sistemas de Información, incluyendo análisis de requisitos, modelado UML, diseño de arquitectura, documentación técnica, prototipado UX/UI y organización mediante control de versiones.

---

# Objetivo del sistema

Diseñar una solución informática que permita mejorar la gestión del proceso de becas universitarias mediante un sistema estructurado de evaluación, seguimiento y generación de información para apoyar decisiones institucionales.

---

# Funcionalidades principales

- Gestión de estudiantes.
- Registro de información académica y socioeconómica.
- Evaluación DSS mediante criterios ponderados.
- Cálculo de puntuación de candidatos.
- Generación de ranking de estudiantes.
- Seguimiento del estado de becas.
- Generación de reportes.
- Administración del sistema.

---

# Estructura del repositorio

## Documentación

Contiene los documentos técnicos y entregables del proyecto:

- Especificación de requisitos (SRS).
- Documentación de arquitectura.
- Diseño de base de datos.
- Diccionario de datos.
- Especificación API.
- Casos de prueba.
- Diagramas UML.

➡️ [docs](./docs)

---

## Estrategia UX

Contiene la documentación relacionada con la experiencia de usuario:

- Identificación de usuarios.
- Necesidades y objetivos.
- Análisis UX del sistema.

➡️ [ux_strategy](./ux_strategy)

---

## Diagramas

Contiene los diagramas utilizados para representar la estructura y navegación del sistema:

- Diagrama de arquitectura.
- Diagramas de navegación.
- Modelos visuales del sistema.

➡️ [diagrams](./diagrams)

---

## Prototipos UI

Contiene los prototipos de interfaz diseñados para representar la interacción del usuario con el sistema:

- Dashboard DSS.
- Gestión de estudiantes.
- Evaluación DSS.
- Seguimiento.
- Gestión de becas.

➡️ [prototypes](./prototypes)

---

## Frontend

Aplicación web (React 18 + TypeScript + Vite 5, React Router 6, TanStack Query 5, recharts). Consume la API en `VITE_API_URL` (`http://localhost:3001/api`) o mocks locales con `VITE_USE_MOCKS=true`.

➡️ [frontend](./frontend) · Plan: [docs/frontend/plan_frontend.md](./docs/frontend/plan_frontend.md)

**Requisitos:** Node 20+ y npm.

```bash
npm run setup            # desde la raíz: instala todo, migra y siembra
npm run dev              # backend :3001 + frontend :5173
```

O por partes: `cd frontend`, `cp .env.example .env`, `npm install`, `npm run dev` (`typecheck`, `build`, `test`).

**Estructura:** `src/components/` (incl. `layout/`) · `src/pages/` (una por ruta) · `src/services/api/` (cliente + tipos + `mocks.ts` + `db.ts`) · `src/models/` · `src/routing/` · `src/state/` · `src/utils/` · `src/styles/`.

**Pantallas:** Dashboard (`/dashboard`), Gestión (`/estudiantes`), Nuevo (`/estudiantes/nuevo`), Detalle (`/estudiantes/:idEstudiante`), Edición (`/estudiantes/:idEstudiante/editar`), Evaluación (`/evaluaciones/nueva`, `/evaluacion/:idEstudiante`), Becas (`/becas`), Seguimiento (`/seguimiento`), Reportes (`/reportes`), Configuración (`/configuracion`), Administración (`/administracion`).

**Convenciones:** Conventional Commits (`feat(frontend): …`) y ramas `feature/`, `docs/`, `fix/` (detalle en `docs/frontend/plan_frontend.md` §5).

---

## Backend

API REST (Node.js + Express + TypeScript + Prisma + Zod) con SQLite (`backend/prisma/dev.db`).

➡️ [backend](./backend/README.md)

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate && npm run db:seed
npm run dev              # :3001 (`typecheck`, `build`, `test`)
```

Ver la base: `cd backend && npm run db:studio`. Puertos: backend :3001, frontend :5173.

---

## Acceso desde otra PC en la misma red

1. En esta PC (la que corre los servidores), obtené tu IP: abrí PowerShell y ejecutá `ipconfig`. Buscá "Adaptador de LAN inalámbrica Wi-Fi" y anotá la "Dirección IPv4" (p. ej. `192.168.1.50`).
2. Asegurate de que backend (`npm run dev` en `backend/`) y frontend (`npm run dev` en `frontend/`) estén corriendo.
3. Desde la otra PC, abrí en el navegador `http://IP:5173` (p. ej. `http://192.168.1.50:5173`). El frontend usa `/api` relativo y el proxy de Vite lo dirige al backend; el backend acepta orígenes de la red local (ver `CORS_LAN` en `backend/.env.example`).
4. Si el navegador da `ERR_CONNECTION_REFUSED`, permití los puertos en el Firewall de Windows (PowerShell como administrador):

```powershell
New-NetFirewallRule -DisplayName "DSS-Becas frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "DSS-Becas backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

## Herramientas utilizadas

- **GitHub:** Gestión del repositorio y control de versiones.
- **Draw.io:** Elaboración de diagramas UML y arquitectura.
- **PlantUML:** Modelado técnico del sistema.
- **Microsoft Word:** Elaboración de documentación académica.
- **Herramientas de prototipado UX/UI:** Diseño de interfaces.

---

# Información académica

**Asignatura:** Sistemas de Información II

**Proyecto:** Sistema de Soporte a Decisiones para la Asignación y Seguimiento de Becas Universitarias (DSS-Becas)

**Autor:**  
Nahuel Fernando Martinez Mariscal
Jose Huarachi 
Xavier Catrillo
Jorge Villa Rubia
Alexis Agirre

---

# Repositorio

Código fuente y documentación disponible en:

https://github.com/Nahuel830/DSS-Becas
