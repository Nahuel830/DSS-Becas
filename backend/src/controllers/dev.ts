import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";
import { seedDatabase } from "../seed";

/** POST /api/dev/reset (solo desarrollo): vacía y vuelve a sembrar. */
export async function reset(_req: Request, res: Response): Promise<void> {
  if (env.NODE_ENV === "production") {
    throw new HttpError(403, "No disponible en producción.");
  }
  await prisma.asignacion.deleteMany();
  await prisma.seguimiento.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.resultado.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.beca.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.carrera.deleteMany();
  await prisma.tipoBeca.deleteMany();
  await prisma.convocatoria.deleteMany();
  await prisma.criterio.deleteMany();
  await prisma.usuario.deleteMany();
  // SQLite no reinicia autoincrementales con deleteMany: se resetean para que el seed reuse ids 1..N.
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence");
  await seedDatabase();
  res.json({ ok: true });
}
