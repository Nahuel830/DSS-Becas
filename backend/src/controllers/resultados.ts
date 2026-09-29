import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";

/** GET /api/resultados/{id_estudiante} (documentado en openapi, faltaba implementar). */
export async function porEstudiante(req: Request, res: Response): Promise<void> {
  const r = await prisma.resultado.findUnique({
    where: { id_estudiante: Number(req.params.id) },
  });
  if (!r) throw new HttpError(404, "Sin resultado para este estudiante.");
  res.json(r);
}
