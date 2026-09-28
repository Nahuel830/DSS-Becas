import { Router } from "express";
import * as asignaciones from "../controllers/asignaciones";
import * as catalogos from "../controllers/catalogos";
import * as dashboard from "../controllers/dashboard";
import * as dev from "../controllers/dev";
import * as documentos from "../controllers/documentos";
import * as estudiantes from "../controllers/estudiantes";
import * as evaluaciones from "../controllers/evaluaciones";
import * as reportes from "../controllers/reportes";
import * as seguimiento from "../controllers/seguimiento";
import { ah } from "../middlewares/async";
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
import { upload } from "../controllers/documentos";

export const router = Router();

router.get("/health", (_req, res) => res.json({ estado: "ok", fecha: new Date().toISOString() }));

// Estudiantes
router.get("/estudiantes", ah(estudiantes.listar));
router.get("/estudiantes/:id", ah(estudiantes.obtener));
router.get("/estudiantes/:id/historial", ah(estudiantes.historial));
router.post("/estudiantes", validate(estudianteSchema), ah(estudiantes.crear));
router.put("/estudiantes/:id", validate(estudianteSchema.partial()), ah(estudiantes.actualizar));
router.delete("/estudiantes/:id", ah(estudiantes.eliminar));

// Evaluaciones y ranking
router.get("/evaluaciones", ah(evaluaciones.listar));
router.get("/evaluaciones/:id", ah(evaluaciones.obtener));
router.post("/evaluaciones/calcular", validate(calcularSchema), ah(evaluaciones.calcularPuntaje));
router.post("/evaluaciones/evaluar-todos", ah(evaluaciones.evaluarTodos));
router.post("/evaluaciones", validate(evaluacionSchema), ah(evaluaciones.crear));
router.put("/evaluaciones/:id", validate(evaluacionSchema.partial()), ah(evaluaciones.actualizar));
router.delete("/evaluaciones/:id", ah(evaluaciones.eliminar));
router.get("/ranking", ah(evaluaciones.ranking));

// Becas (asignación directa, según openapi.yaml; GET para la UI de resultados)
router.get("/becas", ah(async (_req, res) => {
  const { prisma } = await import("../config/db");
  res.json(await prisma.beca.findMany({
    include: { estudiante: { select: { id_estudiante: true, nombre: true, apellido: true } } },
    orderBy: { id_beca: "desc" },
  }));
}));
router.post("/becas", validate(becaSchema), ah(async (req, res) => {
  const { prisma } = await import("../config/db");
  res.status(201).json(await prisma.beca.create({ data: req.body }));
}));

// Dashboard
router.get("/dashboard/resumen", ah(dashboard.resumen));

// Catálogos
router.get("/carreras", ah(catalogos.carreras.listar));
router.get("/carreras/:id", ah(catalogos.carreras.obtener));
router.post("/carreras", validate(carreraSchema), ah(catalogos.carreras.crear));
router.put("/carreras/:id", validate(carreraSchema.partial()), ah(catalogos.carreras.actualizar));
router.delete("/carreras/:id", ah(catalogos.carreras.eliminar));

router.get("/tipos-beca", ah(catalogos.tiposBeca.listar));
router.get("/tipos-beca/:id", ah(catalogos.tiposBeca.obtener));
router.post("/tipos-beca", validate(tipoBecaSchema), ah(catalogos.tiposBeca.crear));
router.put("/tipos-beca/:id", validate(tipoBecaSchema.partial()), ah(catalogos.tiposBeca.actualizar));
router.delete("/tipos-beca/:id", ah(catalogos.tiposBeca.eliminar));

router.get("/convocatorias", ah(catalogos.convocatorias.listar));
router.get("/convocatorias/:id", ah(catalogos.convocatorias.obtener));
router.post("/convocatorias", validate(convocatoriaSchema), ah(catalogos.convocatorias.crear));
router.put("/convocatorias/:id", validate(convocatoriaParcialSchema), ah(catalogos.convocatorias.actualizar));
router.delete("/convocatorias/:id", ah(catalogos.convocatorias.eliminar));

router.get("/criterios", ah(catalogos.criterios.listar));
router.put("/criterios/pesos", validate(pesosSchema), ah(catalogos.actualizarPesos));
router.get("/criterios/:id", ah(catalogos.criterios.obtener));
router.post("/criterios", validate(criterioSchema), ah(catalogos.criterios.crear));
router.put("/criterios/:id", validate(criterioSchema.partial()), ah(catalogos.criterios.actualizar));
router.delete("/criterios/:id", ah(catalogos.criterios.eliminar));

// Asignaciones
router.get("/asignaciones", ah(asignaciones.listar));
router.get("/asignaciones/resumen", ah(asignaciones.resumen));
router.post("/asignaciones/generar", validate(generarSchema), ah(asignaciones.generar));
router.post("/asignaciones", validate(asignacionSchema), ah(async (req, res) => {
  const { prisma } = await import("../config/db");
  res.status(201).json(await prisma.asignacion.create({ data: req.body }));
}));
router.put("/asignaciones/:id", ah(asignaciones.actualizar));
router.delete("/asignaciones/:id", ah(asignaciones.revocar));

// Reportes
router.get("/reportes/resumen", ah(reportes.resumen));
router.get("/reportes/ranking.csv", ah(reportes.rankingCsv));
router.get("/reportes/asignaciones.csv", ah(reportes.asignacionesCsv));

// Seguimiento académico
router.get("/seguimiento", ah(seguimiento.listar));
router.get("/seguimiento/asignacion/:id", ah(seguimiento.porAsignacion));
router.post("/seguimiento", validate(seguimientoSchema), ah(seguimiento.crear));
router.put("/seguimiento/:id", validate(seguimientoSchema.partial()), ah(seguimiento.actualizar));

// Documentos
router.post("/estudiantes/:id/documentos", upload.single("archivo"), ah(documentos.subir));
router.get("/estudiantes/:id/documentos", ah(documentos.listar));
router.get("/documentos/:id/descarga", ah(documentos.descargar));
router.delete("/documentos/:id", ah(documentos.eliminar));

// Desarrollo
router.post("/dev/reset", ah(dev.reset));
