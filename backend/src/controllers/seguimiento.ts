import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { evaluarPeriodo, sugerirSuspension } from "../dss/seguimiento";
import { HttpError } from "../middlewares/errorHandler";

/** GET /api/seguimiento?convocatoriaId=&estado=&carrera= */
export async function listar(req: Request, res: Response): Promise<void> {
  const { convocatoriaId, estado, carrera } = req.query as Record<string, string | undefined>;
  res.json(
    await prisma.seguimiento.findMany({
      where: {
        ...(estado ? { estado } : {}),
        asignacion: {
          ...(convocatoriaId ? { id_convocatoria: Number(convocatoriaId) } : {}),
          ...(carrera ? { estudiante: { carrera } } : {}),
        },
      },
      include: {
        asignacion: {
          include: {
            estudiante: { select: { id_estudiante: true, nombre: true, apellido: true, carrera: true } },
            convocatoria: { select: { id: true, nombre: true } },
            tipoBeca: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: [{ periodo: "desc" }, { id: "desc" }],
    }),
  );
}

/** GET /api/seguimiento/becarios (una fila por asignación Aprobada). */
export async function becarios(req: Request, res: Response): Promise<void> {
  const { convocatoriaId, carrera, estado } = req.query as Record<string, string | undefined>;
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      estado: "Aprobada",
      ...(convocatoriaId ? { id_convocatoria: Number(convocatoriaId) } : {}),
      ...(carrera ? { estudiante: { carrera } } : {}),
    },
    include: {
      estudiante: { select: { id_estudiante: true, nombre: true, apellido: true, carrera: true } },
      convocatoria: { select: { id: true, nombre: true } },
      tipoBeca: { select: { id: true, nombre: true } },
      seguimientos: { orderBy: [{ periodo: "asc" }, { id: "asc" }] },
    },
    orderBy: { estudiante: { apellido: "asc" } },
  });
  const filas = asignaciones.map((a) => {
    const segs = a.seguimientos;
    const ultimo = segs.length > 0 ? segs[segs.length - 1] : undefined;
    return {
      id_asignacion: a.id,
      estudiante: a.estudiante,
      convocatoria: a.convocatoria,
      tipoBeca: a.tipoBeca,
      total_periodos: segs.length,
      ultimo_periodo: ultimo?.periodo ?? null,
      ultimo_promedio: ultimo?.promedio_periodo ?? null,
      estado: ultimo?.estado ?? "Sin registros",
      sugerencia_suspension: sugerirSuspension(segs.map((s) => s.estado)),
    };
  });
  res.json(estado ? filas.filter((f) => f.estado === estado) : filas);
}

/** GET /api/seguimiento/asignacion/:id (historial por becario + sugerencia). */export async function porAsignacion(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const historial = await prisma.seguimiento.findMany({
    where: { id_asignacion: id },
    orderBy: [{ periodo: "asc" }, { id: "asc" }],
  });
  res.json({
    historial,
    sugerencia_suspension: sugerirSuspension(historial.map((h) => h.estado)),
  });
}

/** POST /api/seguimiento (el estado se calcula por regla; cada cambio va a Evento). */
export async function crear(req: Request, res: Response): Promise<void> {
  const asig = await prisma.asignacion.findUnique({ where: { id: Number(req.body.id_asignacion) } });
  if (!asig) throw new HttpError(404, "Asignación no encontrada");
  const estado = evaluarPeriodo(Number(req.body.promedio_periodo));
  const seg = await prisma.seguimiento.create({
    data: {
      id_asignacion: asig.id,
      fecha: String(req.body.fecha ?? new Date().toISOString().slice(0, 10)),
      periodo: String(req.body.periodo),
      promedio_periodo: Number(req.body.promedio_periodo),
      estado,
      observaciones: req.body.observaciones ?? null,
    },
  });
  await prisma.evento.create({
    data: { id_estudiante: asig.id_estudiante, tipo: "edicion", detalle: `Seguimiento ${seg.periodo}: ${estado}` },
  });
  res.status(201).json(seg);
}

/** PUT /api/seguimiento/:id */
export async function actualizar(req: Request, res: Response): Promise<void> {
  const actual = await prisma.seguimiento.findUnique({ where: { id: Number(req.params.id) } });
  if (!actual) throw new HttpError(404, "Seguimiento no encontrado");
  const promedio =
    req.body.promedio_periodo !== undefined ? Number(req.body.promedio_periodo) : actual.promedio_periodo;
  const estado = evaluarPeriodo(promedio);
  const seg = await prisma.seguimiento.update({
    where: { id: actual.id },
    data: {
      ...(req.body.fecha !== undefined ? { fecha: String(req.body.fecha) } : {}),
      ...(req.body.periodo !== undefined ? { periodo: String(req.body.periodo) } : {}),
      promedio_periodo: promedio,
      estado,
      ...(req.body.observaciones !== undefined ? { observaciones: req.body.observaciones } : {}),
    },
  });
  const asig = await prisma.asignacion.findUnique({ where: { id: seg.id_asignacion } });
  await prisma.evento.create({
    data: { id_estudiante: asig?.id_estudiante ?? null, tipo: "edicion", detalle: `Seguimiento ${seg.periodo} actualizado: ${estado}` },
  });
  res.json(seg);
}
