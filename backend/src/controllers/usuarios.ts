import bcryptjs from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";
import { z } from "zod";

export const USUARIO_RE = /^[a-z0-9._-]{3,30}$/;

export const usuarioSchema = z.object({
  usuario: z
    .string()
    .min(3, "Mínimo 3 caracteres.")
    .max(30, "Máximo 30 caracteres.")
    .regex(USUARIO_RE, "Solo minúsculas, números, punto y guion bajo."),
  nombre: z.string().min(1, "Requerido.").max(100),
  correo: z.string().email("Correo inválido."),
  rol: z.enum(["Administrador", "Evaluador", "Consulta"]),
  activo: z.boolean().optional(),
});

export const usuarioCrearSchema = usuarioSchema.extend({
  password: z.string().min(8, "La contraseña es obligatoria (mínimo 8 caracteres)."),
});

export const usuarioActualizarSchema = usuarioSchema.partial().extend({
  password: z.string().min(8, "Mínimo 8 caracteres.").optional(),
});

const SIN_HASH = {
  id_usuario: true,
  usuario: true,
  nombre: true,
  correo: true,
  rol: true,
  activo: true,
  token_version: true,
  debe_cambiar_password: true,
  ultimo_acceso: true,
} as const;

/** GET /api/usuarios?q= (solo Admin). */
export async function listar(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  res.json(
    await prisma.usuario.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q } },
              { correo: { contains: q } },
              { rol: { contains: q } },
              { usuario: { contains: q } },
            ],
          }
        : {},
      select: SIN_HASH,
      orderBy: { id_usuario: "asc" },
    }),
  );
}

/** GET /api/usuarios/:id (solo Admin). */
export async function obtener(req: Request, res: Response): Promise<void> {
  const u = await prisma.usuario.findUnique({
    where: { id_usuario: Number(req.params.id) },
    select: SIN_HASH,
  });
  if (!u) throw new HttpError(404, "Usuario no encontrado");
  res.json(u);
}

/** POST /api/usuarios (solo Admin; password obligatoria). */
export async function crear(req: Request, res: Response): Promise<void> {
  const password = String(req.body.password ?? "");
  if (password.length < 8) {
    throw new HttpError(400, "La contraseña es obligatoria (mínimo 8 caracteres).", {
      password: "La contraseña es obligatoria (mínimo 8 caracteres).",
    });
  }
  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ usuario: req.body.usuario }, { correo: req.body.correo }] },
  });
  if (existente) {
    const campo = existente.usuario === req.body.usuario ? "usuario" : "correo";
    throw new HttpError(409, campo === "usuario" ? "El usuario ya existe." : "Ya existe un registro con ese correo.", {
      [campo]: campo === "usuario" ? "El usuario ya existe." : "Ya existe un registro con ese correo.",
    });
  }
  const u = await prisma.usuario.create({
    data: {
      usuario: req.body.usuario,
      nombre: req.body.nombre,
      correo: req.body.correo,
      rol: req.body.rol,
      activo: req.body.activo ?? true,
      password_hash: bcryptjs.hashSync(password, 10),
    },
    select: SIN_HASH,
  });
  await prisma.evento.create({
    data: { id_estudiante: null, tipo: "edicion", detalle: `Usuario creado: ${u.usuario}` },
  });
  res.status(201).json(u);
}

/** PUT /api/usuarios/:id (solo Admin; bump de token_version si cambia usuario o password). */
export async function actualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const actual = await prisma.usuario.findUnique({ where: { id_usuario: id } });
  if (!actual) throw new HttpError(404, "Usuario no encontrado");
  const { password, ...resto } = req.body as Record<string, unknown>;
  void password;
  if (resto.usuario && resto.usuario !== actual.usuario) {
    const dup = await prisma.usuario.findUnique({ where: { usuario: String(resto.usuario) } });
    if (dup) throw new HttpError(409, "El usuario ya existe.", { usuario: "El usuario ya existe." });
  }
  if (resto.correo && resto.correo !== actual.correo) {
    const dup = await prisma.usuario.findUnique({ where: { correo: String(resto.correo) } });
    if (dup) {
      throw new HttpError(409, "Ya existe un registro con ese correo.", {
        correo: "Ya existe un registro con ese correo.",
      });
    }
  }
  const cambiaSesion = Boolean(
    (resto.usuario && resto.usuario !== actual.usuario) || (typeof password === "string" && password !== ""),
  );
  const datos: Record<string, unknown> = { ...resto };
  delete datos.password;
  if (datos.activo === false) {
    await protegerAdmin(id, req.usuario?.id_usuario ?? 0, false);
  }
  if (typeof password === "string" && password !== "") {
    if (password.length < 8) {
      throw new HttpError(400, "La contraseña debe tener mínimo 8 caracteres.", {
        password: "La contraseña debe tener mínimo 8 caracteres.",
      });
    }
    datos.password_hash = bcryptjs.hashSync(password, 10);
  }
  const u = await prisma.usuario.update({
    where: { id_usuario: id },
    data: { ...datos, ...(cambiaSesion ? { token_version: { increment: 1 } } : {}) },
    select: SIN_HASH,
  });
  const cambios: string[] = [];
  if (resto.usuario && resto.usuario !== actual.usuario) cambios.push("usuario");
  if (typeof password === "string" && password !== "") cambios.push("contraseña");
  if (resto.rol && resto.rol !== actual.rol) cambios.push("rol");
  if (resto.activo !== undefined && resto.activo !== actual.activo) cambios.push("estado");
  await prisma.evento.create({
    data: {
      id_estudiante: null,
      tipo: "edicion",
      detalle: `Usuario ${u.usuario} actualizado${cambios.length > 0 ? `: ${cambios.join(", ")}` : ""}`,
    },
  });
  res.json(u);
}

/** PUT /api/usuarios/:id/estado {activo} (solo Admin; protege último admin y a uno mismo). */
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const activo = Boolean(req.body.activo);
  await protegerAdmin(id, req.usuario?.id_usuario ?? 0, activo);
  const u = await prisma.usuario.update({ where: { id_usuario: id }, data: { activo }, select: SIN_HASH });
  await prisma.evento.create({
    data: { id_estudiante: null, tipo: "edicion", detalle: `Usuario ${u.usuario} ${activo ? "activado" : "desactivado"}` },
  });
  res.json(u);
}

/** DELETE /api/usuarios/:id (solo Admin; protege último admin y a uno mismo). */
export async function eliminar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const u = await prisma.usuario.findUnique({ where: { id_usuario: id } });
  if (!u) throw new HttpError(404, "Usuario no encontrado");
  await protegerAdmin(id, req.usuario?.id_usuario ?? 0, false);
  await prisma.usuario.delete({ where: { id_usuario: id } });
  await prisma.evento.create({
    data: { id_estudiante: null, tipo: "edicion", detalle: `Usuario eliminado: ${u.usuario}` },
  });
  res.status(204).send();
}

async function protegerAdmin(id: number, yo: number, pasarA: boolean): Promise<void> {
  if (id === yo && !pasarA) {
    throw new HttpError(400, "No puedes desactivarte ni eliminarte a ti mismo.");
  }
  if (!pasarA) {
    const u = await prisma.usuario.findUnique({ where: { id_usuario: id } });
    if (u?.rol === "Administrador") {
      const activos = await prisma.usuario.count({ where: { rol: "Administrador", activo: true, NOT: { id_usuario: id } } });
      if (activos === 0) {
        throw new HttpError(400, "No se puede eliminar ni desactivar al último Administrador activo.");
      }
    }
  }
}
