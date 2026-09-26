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

Aplicación web (React 18 + TypeScript + Vite 5, React Router 6, TanStack Query 5, CSS plano en `global.css`). Sin backend todavía: lee `VITE_API_URL` y usa mocks con forma del contrato cuando no hay API.

➡️ [frontend](./frontend) · Plan: [docs/frontend/plan_frontend.md](./docs/frontend/plan_frontend.md)

**Requisitos:** Node 20+ y npm.

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev            # http://localhost:8080
npm run typecheck
npm run build
```

**Estructura:** `src/components/` (incl. `layout/`) · `src/pages/` (una por ruta) · `src/services/api/` (cliente + tipos del contrato + `mocks.ts`) · `src/models/` · `src/routing/` · `src/state/` · `src/utils/` · `src/styles/`.

**Pantallas implementadas:** Dashboard (`/dashboard`), Gestión (`/estudiantes`), Nuevo (`/estudiantes/nuevo`), Detalle (`/estudiantes/:idEstudiante`), Evaluación (`/evaluaciones/nueva`) y esqueleto de Becas (`/becas`).

**Pendientes:** Seguimiento, Reportes y Administración son placeholders (sin endpoint en `openapi.yaml` ni mock); no hay backend, tests/lint/CI.

**Convenciones:** Conventional Commits (`feat(frontend): …`) y ramas `feature/`, `docs/`, `fix/` (detalle en `docs/frontend/plan_frontend.md` §5).

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
