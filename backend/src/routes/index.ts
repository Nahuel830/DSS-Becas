import { Router } from "express";
import * as asignaciones from "../controllers/asignaciones";
import * as auth from "../controllers/auth";
import * as catalogos from "../controllers/catalogos";
import * as dashboard from "../controllers/dashboard";
import * as dev from "../controllers/dev";
import * as documentos from "../controllers/documentos";
import * as estudiantes from "../controllers/estudiantes";
import * as evaluaciones from "../controllers/evaluaciones";
import * as reportes from "../controllers/reportes";
import * as resultados from "../controllers/resultados";
import * as seguimiento from "../controllers/seguimiento";
import * as usuarios from "../controllers/usuarios";
import { requirePermiso } from "../auth/permisos";
import { ah } from "../middlewares/async";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import {
  asignacionSchema,
  becaSchema,
  calcularSchema,
  carreraSchema,
  convocatoriaParcialSchema,
  convocatoriaSchema,
  criterioSchema,
  estudianteSchema,
  evaluacionSchema,
  generarSchema,
  pesosSchema,
  seguimientoSchema,
  tipoBecaSchema,
} from "../validators/schemas";
import { usuarioActualizarSchema, usuarioCrearSchema } from "../controllers/usuarios";
import { upload } from "../controllers/documentos";

export const router = Router();

router.get("/health", (_req, res) => res.json({ estado: "ok", fecha: new Date().toISOString() }));

// Auth pública
router.post("/auth/login", validate(auth.loginSchema), ah(auth.login));

// Todo lo demás exige sesión + permiso explícito.
router.use(requireAuth);
const P = requirePermiso;
router.get("/auth/me", ah(auth.me));
router.post("/auth/cambiar-password", validate(auth.cambiarPasswordSchema), ah(auth.cambiarPassword));

// Estudiantes
router.get("/estudiantes", P("estudiantes:ver"), ah(estudiantes.listar));
router.get("/estudiantes/:id", P("estudiantes:ver"), ah(estudiantes.obtener));
router.get("/estudiantes/:id/historial", P("estudiantes:ver"), ah(estudiantes.historial));
router.post("/estudiantes", P("estudiantes:crear"), validate(estudianteSchema), ah(estudiantes.crear));
router.put("/estudiantes/:id", P("estudiantes:editar"), validate(estudianteSchema.partial()), ah(estudiantes.actualizar));
router.delete("/estudiantes/:id", P("estudiantes:eliminar"), ah(estudiantes.eliminar));

// Evaluaciones y ranking
router.get("/evaluaciones", P("evaluaciones:ver"), ah(evaluaciones.listar));
router.get("/evaluaciones/:id", P("evaluaciones:ver"), ah(evaluaciones.obtener));
router.post("/evaluaciones/calcular", P("evaluaciones:crear"), validate(calcularSchema), ah(evaluaciones.calcularPuntaje));
router.post("/evaluaciones/evaluar-todos", P("evaluaciones:crear"), ah(evaluaciones.evaluarTodos));
router.post("/evaluaciones", P("evaluaciones:crear"), validate(evaluacionSchema), ah(evaluaciones.crear));
router.put("/evaluaciones/:id", P("evaluaciones:editar"), validate(evaluacionSchema.partial()), ah(evaluaciones.actualizar));
router.delete("/evaluaciones/:id", P("evaluaciones:eliminar"), ah(evaluaciones.eliminar));
router.get("/ranking", P("asignaciones:ver"), ah(evaluaciones.ranking));
router.get("/resultados/:id", P("evaluaciones:ver"), ah(resultados.porEstudiante));

// Becas (asignación directa, según openapi.yaml; GET para la UI de resultados)
router.get("/becas", P("asignaciones:ver"), ah(async (_req, res) => {
  const { prisma } = await import("../config/db");
  res.json(await prisma.beca.findMany({
    include: { estudiante: { select: { id_estudiante: true, nombre: true, apellido: true } } },
    orderBy: { id_beca: "desc" },
  }));
}));
router.post("/becas", P("asignaciones:generar"), validate(becaSchema), ah(async (req, res) => {
  const { prisma } = await import("../config/db");
  res.status(201).json(await prisma.beca.create({ data: req.body }));
}));

// Dashboard
router.get("/dashboard/resumen", P("reportes:ver"), ah(dashboard.resumen));

// Catálogos (lectura para Evaluador: los formularios la necesitan; escritura solo Admin)
router.get("/carreras", P("catalogos:ver"), ah(catalogos.carreras.listar));
router.get("/carreras/:id", P("catalogos:ver"), ah(catalogos.carreras.obtener));
router.post("/carreras", P("configuracion:editar"), validate(carreraSchema), ah(catalogos.carreras.crear));
router.put("/carreras/:id", P("configuracion:editar"), validate(carreraSchema.partial()), ah(catalogos.carreras.actualizar));
router.delete("/carreras/:id", P("configuracion:editar"), ah(catalogos.carreras.eliminar));

router.get("/tipos-beca", P("catalogos:ver"), ah(catalogos.tiposBeca.listar));
router.get("/tipos-beca/:id", P("catalogos:ver"), ah(catalogos.tiposBeca.obtener));
router.post("/tipos-beca", P("configuracion:editar"), validate(tipoBecaSchema), ah(catalogos.tiposBeca.crear));
router.put("/tipos-beca/:id", P("configuracion:editar"), validate(tipoBecaSchema.partial()), ah(catalogos.tiposBeca.actualizar));
router.delete("/tipos-beca/:id", P("configuracion:editar"), ah(catalogos.tiposBeca.eliminar));

router.get("/convocatorias", P("catalogos:ver"), ah(catalogos.convocatorias.listar));
router.get("/convocatorias/:id", P("catalogos:ver"), ah(catalogos.convocatorias.obtener));
router.post("/convocatorias", P("configuracion:editar"), validate(convocatoriaSchema), ah(catalogos.convocatorias.crear));
router.put("/convocatorias/:id", P("configuracion:editar"), validate(convocatoriaParcialSchema), ah(catalogos.convocatorias.actualizar));
router.delete("/convocatorias/:id", P("configuracion:editar"), ah(catalogos.convocatorias.eliminar));

router.get("/criterios", P("catalogos:ver"), ah(catalogos.criterios.listar));
router.put("/criterios/pesos", P("configuracion:editar"), validate(pesosSchema), ah(catalogos.actualizarPesos));
router.get("/criterios/:id", P("catalogos:ver"), ah(catalogos.criterios.obtener));
router.post("/criterios", P("configuracion:editar"), validate(criterioSchema), ah(catalogos.criterios.crear));
router.put("/criterios/:id", P("configuracion:editar"), validate(criterioSchema.partial()), ah(catalogos.criterios.actualizar));
router.delete("/criterios/:id", P("configuracion:editar"), ah(catalogos.criterios.eliminar));

// Asignaciones
router.get("/asignaciones", P("asignaciones:ver"), ah(asignaciones.listar));
router.get("/asignaciones/resumen", P("asignaciones:ver"), ah(asignaciones.resumen));
router.post("/asignaciones/generar", P("asignaciones:generar"), validate(generarSchema), ah(asignaciones.generar));
router.post("/asignaciones", P("asignaciones:generar"), validate(asignacionSchema), ah(async (req, res) => {
  const { prisma } = await import("../config/db");
  res.status(201).json(await prisma.asignacion.create({ data: req.body }));
}));
router.put("/asignaciones/:id", P("asignaciones:decidir"), ah(asignaciones.actualizar));
router.delete("/asignaciones/:id", P("asignaciones:revocar"), ah(asignaciones.revocar));

// Reportes
router.get("/reportes/resumen", P("reportes:ver"), ah(reportes.resumen));
router.get("/reportes/ranking.csv", P("reportes:ver"), ah(reportes.rankingCsv));
router.get("/reportes/asignaciones.csv", P("reportes:ver"), ah(reportes.asignacionesCsv));

// Seguimiento académico
router.get("/seguimiento", P("seguimiento:ver"), ah(seguimiento.listar));
router.get("/seguimiento/asignacion/:id", P("seguimiento:ver"), ah(seguimiento.porAsignacion));
router.post("/seguimiento", P("seguimiento:editar"), validate(seguimientoSchema), ah(seguimiento.crear));
router.put("/seguimiento/:id", P("seguimiento:editar"), validate(seguimientoSchema.partial()), ah(seguimiento.actualizar));

// Documentos
router.post("/estudiantes/:id/documentos", P("documentos:subir"), upload.single("archivo"), ah(documentos.subir));
router.get("/estudiantes/:id/documentos", P("estudiantes:ver"), ah(documentos.listar));
router.get("/documentos/:id/descarga", P("estudiantes:ver"), ah(documentos.descargar));
router.delete("/documentos/:id", P("documentos:eliminar"), ah(documentos.eliminar));

// Usuarios (solo Administrador)
router.get("/usuarios", P("usuarios:gestionar"), ah(usuarios.listar));
router.get("/usuarios/:id", P("usuarios:gestionar"), ah(usuarios.obtener));
router.post("/usuarios", P("usuarios:gestionar"), validate(usuarioCrearSchema), ah(usuarios.crear));
router.put("/usuarios/:id", P("usuarios:gestionar"), validate(usuarioActualizarSchema), ah(usuarios.actualizar));
router.put("/usuarios/:id/estado", P("usuarios:gestionar"), ah(usuarios.cambiarEstado));
router.delete("/usuarios/:id", P("usuarios:gestionar"), ah(usuarios.eliminar));

// Desarrollo (solo Administrador)
router.post("/dev/reset", P("dev:reset"), ah(dev.reset));
