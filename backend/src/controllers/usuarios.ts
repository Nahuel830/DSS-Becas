import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";
import { z } from "zod";

export const usuarioSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  correo: z.string().email("Correo inválido."),
  rol: z.enum(["Administrador", "Evaluador", "Consulta"]),
  activo: z.boolean().optional(),
});

/** GET /api/usuarios?q= */
export async function listar(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? "").trim();
  res.json(
    await prisma.usuario.findMany({
      where: q
        ? { OR: [{ nombre: { contains: q } }, { correo: { contains: q } }, { rol: { contains: q } }] }
        : {},
      orderBy: { id_usuario: "asc" },
    }),
  );
}

/** GET /api/usuarios/:id */
export async function obtener(req: Request, res: Response): Promise<void> {
  const u = await prisma.usuario.findUnique({ where: { id_usuario: Number(req.params.id) } });
  if (!u) throw new HttpError(404, "Usuario no encontrado");
  res.json(u);
}

/** POST /api/usuarios (correo duplicado → 409). */
export async function crear(req: Request, res: Response): Promise<void> {
  res.status(201).json(await prisma.usuario.create({ data: req.body }));
}

/** PUT /api/usuarios/:id */
export async function actualizar(req: Request, res: Response): Promise<void> {
  res.json(await prisma.usuario.update({ where: { id_usuario: Number(req.params.id) }, data: req.body }));
}

/** PUT /api/usuarios/:id/estado {activo} (activar/desactivar). */
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  res.json(
    await prisma.usuario.update({
      where: { id_usuario: Number(req.params.id) },
      data: { activo: Boolean(req.body.activo) },
    }),
  );
}

/** DELETE /api/usuarios/:id */
export async function eliminar(req: Request, res: Response): Promise<void> {
  await prisma.usuario.delete({ where: { id_usuario: Number(req.params.id) } });
  res.status(204).send();
}
