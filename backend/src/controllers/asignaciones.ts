import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { ordenarRanking } from "../dss/ranking";
import { HttpError } from "../middlewares/errorHandler";

/** GET /api/asignaciones?convocatoriaId=&tipoBecaId= */
export async function listar(req: Request, res: Response): Promise<void> {
  const where = {
    ...(req.query.convocatoriaId ? { id_convocatoria: Number(req.query.convocatoriaId) } : {}),
    ...(req.query.tipoBecaId ? { id_tipo_beca: Number(req.query.tipoBecaId) } : {}),
  };
  res.json(
    await prisma.asignacion.findMany({
      where,
      include: {
        estudiante: { select: { id_estudiante: true, nombre: true, apellido: true, carrera: true } },
        convocatoria: { select: { id: true, nombre: true } },
        tipoBeca: { select: { id: true, nombre: true, monto: true } },
      },
      orderBy: { puntaje: "desc" },
    }),
  );
}

/** GET /api/asignaciones/resumen?convocatoriaId=&tipoBecaId= (cupos y presupuesto). */
export async function resumen(req: Request, res: Response): Promise<void> {
  const convocatoriaId = Number(req.query.convocatoriaId);
  const tipoBecaId = Number(req.query.tipoBecaId);
  if (!convocatoriaId || !tipoBecaId) throw new HttpError(400, "Faltan convocatoriaId y tipoBecaId.");
  const [convocatoria, tipo] = await Promise.all([
    prisma.convocatoria.findUnique({ where: { id: convocatoriaId } }),
    prisma.tipoBeca.findUnique({ where: { id: tipoBecaId } }),
  ]);
  if (!convocatoria || !tipo) throw new HttpError(404, "Convocatoria o tipo de beca no encontrado.");
  const asignadas = await prisma.asignacion.findMany({
    where: { id_convocatoria: convocatoriaId, id_tipo_beca: tipoBecaId, estado: "Aprobada" },
  });
  const ocupados = asignadas.length;
  const usado = asignadas.reduce((s, a) => s + tipo.monto, 0);
  res.json({
    cupos_totales: tipo.cupos,
    ocupados,
    disponibles: Math.max(0, tipo.cupos - ocupados),
    presupuesto_total: convocatoria.presupuesto,
    presupuesto_usado: usado,
    presupuesto_disponible: Math.max(0, convocatoria.presupuesto - usado),
  });
}

/** POST /api/asignaciones/generar {convocatoriaId, tipoBecaId} (top-N por cupos). */
export async function generar(req: Request, res: Response): Promise<void> {
  const { convocatoriaId, tipoBecaId } = req.body as { convocatoriaId: number; tipoBecaId: number };
  const tipo = await prisma.tipoBeca.findUnique({ where: { id: tipoBecaId } });
  if (!tipo) throw new HttpError(404, "Tipo de beca no encontrado.");
  const existentes = new Set(
    (await prisma.asignacion.findMany({ where: { id_convocatoria: convocatoriaId, id_tipo_beca: tipoBecaId } })).map(
      (a) => a.id_estudiante,
    ),
  );
  const ocupados = existentes.size;
  const libres = Math.max(0, tipo.cupos - ocupados);
  const evals = await prisma.evaluacion.findMany({ include: { estudiante: true } });
  const mejores = new Map<number, (typeof evals)[number]>();
  for (const ev of evals) {
    const actual = mejores.get(ev.id_estudiante);
    if (!actual || ev.puntaje_final > actual.puntaje_final) mejores.set(ev.id_estudiante, ev);
  }
  const candidatos = ordenarRanking(
    [...mejores.values()]
      .filter((ev) => !existentes.has(ev.id_estudiante))
      .map((ev) => ({
        id_estudiante: ev.id_estudiante,
        puntaje_final: ev.puntaje_final,
        promedio: ev.estudiante.promedio,
        ingreso_familiar: ev.estudiante.ingreso_familiar,
      })),
  ).slice(0, libres);
  const creadas = [];
  for (const c of candidatos) {
    creadas.push(
      await prisma.asignacion.create({
        data: {
          id_estudiante: c.id_estudiante,
          id_convocatoria: convocatoriaId,
          id_tipo_beca: tipoBecaId,
          puntaje: c.puntaje_final,
          estado: "Aprobada",
        },
      }),
    );
    await prisma.evento.create({
      data: { id_estudiante: c.id_estudiante, tipo: "edicion", detalle: `Beca asignada (${tipo.nombre})` },
    });
  }
  res.status(201).json({ generadas: creadas.length, asignaciones: creadas });
}

/** PUT /api/asignaciones/:id {estado, observaciones?} (#2). */
export async function actualizar(req: Request, res: Response): Promise<void> {
  const estado = String(req.body.estado ?? "Aprobada");
  const observaciones = req.body.observaciones as string | undefined;
  // #2: rechazar u observar exige justificación de al menos 10 caracteres.
  if (
    (estado === "Rechazada" || estado === "En observación") &&
    (!observaciones || observaciones.trim().length < 10)
  ) {
    throw new HttpError(400, "Se requieren observaciones (mínimo 10 caracteres).", {
      observaciones: "Se requieren observaciones (mínimo 10 caracteres).",
    });
  }
  const a = await prisma.asignacion.update({
    where: { id: Number(req.params.id) },
    data: { estado, ...(observaciones !== undefined ? { observaciones } : {}) },
  });
  await prisma.evento.create({
    data: {
      id_estudiante: a.id_estudiante,
      tipo: "edicion",
      detalle: `Decisión del evaluador: ${estado}${observaciones ? ` — ${observaciones}` : ""}`,
    },
  });
  res.json(a);
}

/** DELETE /api/asignaciones/:id (revocar). */
export async function revocar(req: Request, res: Response): Promise<void> {
  const a = await prisma.asignacion.findUnique({ where: { id: Number(req.params.id) } });
  if (!a) throw new HttpError(404, "Asignación no encontrada");
  await prisma.asignacion.delete({ where: { id: a.id } });
  await prisma.evento.create({
    data: { id_estudiante: a.id_estudiante, tipo: "edicion", detalle: "Asignación de beca revocada" },
  });
  res.status(204).send();
}
