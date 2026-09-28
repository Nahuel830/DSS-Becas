import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { recomendar } from "../dss/criterios";
import { calcular, derivarCriterios } from "../dss/motor";
import { evaluarElegibilidad } from "../dss/elegibilidad";
import { ordenarRanking } from "../dss/ranking";
import { HttpError } from "../middlewares/errorHandler";

/** POST /api/evaluaciones/calcular (motor DSS + elegibilidad, sin guardar). */
export async function calcularPuntaje(req: Request, res: Response): Promise<void> {
  const r = calcular(req.body.criterios);
  const est = await prisma.estudiante.findUnique({
    where: { id_estudiante: req.body.id_estudiante },
    select: { promedio: true, ingreso_familiar: true },
  });
  if (!est) throw new HttpError(404, "Estudiante no encontrado");
  const veredicto = evaluarElegibilidad(est, req.body.tipo_beca);
  res.json({
    id_estudiante: req.body.id_estudiante,
    ...r,
    recomendacion: veredicto.elegible ? r.recomendacion : "No elegible",
    elegible: veredicto.elegible,
    motivos_no_elegible: veredicto.motivos_no_elegible,
  });
}

/** POST /api/evaluaciones (guarda + actualiza resultado + evento). */
export async function crear(req: Request, res: Response): Promise<void> {
  const ev = await prisma.evaluacion.create({ data: req.body });
  const etiqueta = recomendar(ev.puntaje_final);
  await prisma.resultado.upsert({
    where: { id_estudiante: ev.id_estudiante },
    create: { id_estudiante: ev.id_estudiante, resultado: etiqueta },
    update: { resultado: etiqueta },
  });
  await prisma.evento.create({
    data: { id_estudiante: ev.id_estudiante, tipo: "evaluacion", detalle: `Evaluación registrada con puntaje ${ev.puntaje_final}` },
  });
  res.status(201).json(ev);
}

/** GET /api/evaluaciones */
export async function listar(_req: Request, res: Response): Promise<void> {
  const items = await prisma.evaluacion.findMany({
    orderBy: { id_evaluacion: "desc" },
    include: { estudiante: { select: { id_estudiante: true, nombre: true, apellido: true, carrera: true } } },
  });
  res.json(items);
}

/** GET /api/evaluaciones/:id */
export async function obtener(req: Request, res: Response): Promise<void> {
  const ev = await prisma.evaluacion.findUnique({
    where: { id_evaluacion: Number(req.params.id) },
    include: { estudiante: true },
  });
  if (!ev) throw new HttpError(404, "Evaluación no encontrada");
  res.json(ev);
}

/** PUT /api/evaluaciones/:id */
export async function actualizar(req: Request, res: Response): Promise<void> {
  const ev = await prisma.evaluacion.update({
    where: { id_evaluacion: Number(req.params.id) },
    data: req.body,
  });
  const etiqueta = recomendar(ev.puntaje_final);
  await prisma.resultado.upsert({
    where: { id_estudiante: ev.id_estudiante },
    create: { id_estudiante: ev.id_estudiante, resultado: etiqueta },
    update: { resultado: etiqueta },
  });
  res.json(ev);
}

/** DELETE /api/evaluaciones/:id (el estudiante vuelve a Pendiente si no tiene otras). */
export async function eliminar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const ev = await prisma.evaluacion.findUnique({ where: { id_evaluacion: id } });
  if (!ev) throw new HttpError(404, "Evaluación no encontrada");
  await prisma.evaluacion.delete({ where: { id_evaluacion: id } });
  const restantes = await prisma.evaluacion.count({ where: { id_estudiante: ev.id_estudiante } });
  if (restantes === 0) {
    await prisma.resultado.deleteMany({ where: { id_estudiante: ev.id_estudiante } });
  }
  await prisma.evento.create({
    data: { id_estudiante: ev.id_estudiante, tipo: "edicion", detalle: "Evaluación eliminada; estudiante a Pendiente" },
  });
  res.status(204).send();
}

/** POST /api/evaluaciones/evaluar-todos (pendientes con criterios derivados, ver D32). */
export async function evaluarTodos(_req: Request, res: Response): Promise<void> {
  const pendientes = await prisma.estudiante.findMany({
    where: { evaluaciones: { none: {} } },
  });
  let creadas = 0;
  for (const est of pendientes) {
    const r = calcular(derivarCriterios(est.promedio, est.ingreso_familiar));
    const ev = await prisma.evaluacion.create({
      data: {
        id_estudiante: est.id_estudiante,
        fecha: new Date().toISOString().slice(0, 10),
        puntaje_academico: r.puntaje_academico,
        puntaje_social: r.puntaje_social,
        puntaje_final: r.puntaje_final,
      },
    });
    await prisma.resultado.upsert({
      where: { id_estudiante: est.id_estudiante },
      create: { id_estudiante: est.id_estudiante, resultado: r.recomendacion },
      update: { resultado: r.recomendacion },
    });
    await prisma.evento.create({
      data: { id_estudiante: est.id_estudiante, tipo: "evaluacion", detalle: `Evaluación masiva con puntaje ${ev.puntaje_final}` },
    });
    creadas += 1;
  }
  res.json({ evaluadas: creadas });
}

/** GET /api/ranking?convocatoriaId=&tipoBecaId= (orden + desempates). */
export async function ranking(req: Request, res: Response): Promise<void> {
  const convocatoriaId = req.query.convocatoriaId !== undefined ? Number(req.query.convocatoriaId) : undefined;
  const tipoBecaId = req.query.tipoBecaId !== undefined ? Number(req.query.tipoBecaId) : undefined;
  const evals = await prisma.evaluacion.findMany({
    include: { estudiante: true },
  });
  const mejores = new Map<number, (typeof evals)[number]>();
  for (const ev of evals) {
    const actual = mejores.get(ev.id_estudiante);
    if (!actual || ev.puntaje_final > actual.puntaje_final) mejores.set(ev.id_estudiante, ev);
  }
  let asignadas: Set<number> = new Set();
  if (convocatoriaId && tipoBecaId) {
    const asig = await prisma.asignacion.findMany({
      where: { id_convocatoria: convocatoriaId, id_tipo_beca: tipoBecaId },
    });
    asignadas = new Set(asig.map((a) => a.id_estudiante));
  }
  const filas = ordenarRanking(
    [...mejores.values()].map((ev) => ({
      id_estudiante: ev.id_estudiante,
      nombre: `${ev.estudiante.nombre} ${ev.estudiante.apellido}`,
      carrera: ev.estudiante.carrera,
      puntaje_final: ev.puntaje_final,
      promedio: ev.estudiante.promedio,
      ingreso_familiar: ev.estudiante.ingreso_familiar,
      recomendacion: recomendar(ev.puntaje_final),
      asignado: asignadas.has(ev.id_estudiante),
    })),
  ).map((f, i) => ({ posicion: i + 1, ...f }));
  res.json(filas);
}
