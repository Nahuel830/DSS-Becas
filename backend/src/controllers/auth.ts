import bcryptjs from "bcryptjs";
import type { Request, Response } from "express";
import { firmarToken } from "../auth/jwt";
import { permisosDe } from "../auth/permisos";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";
import { z } from "zod";

export const loginSchema = z.object({
  usuario: z.string().min(1, "Requerido."),
  password: z.string().min(1, "Requerida."),
});

export const cambiarPasswordSchema = z.object({
  actual: z.string().min(1, "Requerida."),
  nueva: z
    .string()
    .min(8, "Mínimo 8 caracteres.")
    .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), "Debe tener letra y número."),
});

const SIN_HASH = {
  id_usuario: true,
  usuario: true,
  nombre: true,
  correo: true,
  rol: true,
  activo: true,
  debe_cambiar_password: true,
  ultimo_acceso: true,
} as const;

// 5 intentos fallidos en 10 min por usuario+IP → 429.
const intentos = new Map<string, number[]>();

function fallosRecientes(clave: string): number {
  const ahora = Date.now();
  const lista = (intentos.get(clave) ?? []).filter((t) => ahora - t < 10 * 60 * 1000);
  intentos.set(clave, lista);
  return lista.length;
}

function registrarFallo(clave: string): number {
  const lista = [...(intentos.get(clave) ?? []), Date.now()];
  intentos.set(clave, lista);
  return lista.length;
}

function limpiarFallos(clave: string): void {
  intentos.delete(clave);
}

async function eventoAuth(detalle: string): Promise<void> {
  await prisma.evento.create({ data: { id_estudiante: null, tipo: "edicion", detalle } });
}

/** POST /api/auth/login (usuario o correo, sin importar mayúsculas ni espacios). */
export async function login(req: Request, res: Response): Promise<void> {
  const clave = String(req.body.usuario ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const ip = String(req.ip ?? "");
  const llave = `${clave}:${ip}`;
  if (fallosRecientes(llave) >= 5) {
    throw new HttpError(429, "Demasiados intentos. Reintente en 10 minutos.");
  }
  const u = await prisma.usuario.findFirst({
    where: { OR: [{ usuario: clave }, { correo: clave }] },
  });
  const validar = u?.password_hash
    ? bcryptjs.compareSync(password, u.password_hash)
    : false;
  if (!u || !validar) {
    const n = registrarFallo(llave);
    await eventoAuth(`Acceso fallido: ${clave}`);
    if (n >= 5) {
      throw new HttpError(429, "Demasiados intentos. Reintente en 10 minutos.");
    }
    throw new HttpError(401, "Usuario o contraseña incorrectos.");
  }
  if (!u.activo) {
    throw new HttpError(403, "Usuario desactivado.");
  }
  limpiarFallos(llave);
  await prisma.usuario.update({
    where: { id_usuario: u.id_usuario },
    data: { ultimo_acceso: new Date() },
  });
  await eventoAuth(`Acceso correcto: ${u.usuario}`);
  const { password_hash: _h, token_version, ...resto } = u;
  void _h;
  res.json({
    token: firmarToken({ id_usuario: u.id_usuario, rol: u.rol, token_version }),
    usuario: { ...resto, permisos: permisosDe(u.rol) },
  });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  const u = await prisma.usuario.findUnique({
    where: { id_usuario: req.usuario?.id_usuario ?? 0 },
    select: SIN_HASH,
  });
  if (!u) throw new HttpError(401, "Su sesión expiró o sus datos cambiaron, ingrese nuevamente.");
  res.json({ ...u, permisos: permisosDe(u.rol) });
}

/** POST /api/auth/cambiar-password (cierra otras sesiones y devuelve token nuevo). */
export async function cambiarPassword(req: Request, res: Response): Promise<void> {
  const id = req.usuario?.id_usuario ?? 0;
  const u = await prisma.usuario.findUnique({ where: { id_usuario: id } });
  if (!u || !u.password_hash || !bcryptjs.compareSync(String(req.body.actual ?? ""), u.password_hash)) {
    await eventoAuth(`Cambio de contraseña fallido: id=${id}`);
    throw new HttpError(401, "La contraseña actual es incorrecta.");
  }
  const hash = bcryptjs.hashSync(String(req.body.nueva), 10);
  const actualizado = await prisma.usuario.update({
    where: { id_usuario: id },
    data: { password_hash: hash, token_version: { increment: 1 }, debe_cambiar_password: false },
    select: SIN_HASH,
  });
  await eventoAuth(`Contraseña cambiada: ${actualizado.usuario}`);
  const completo = await prisma.usuario.findUniqueOrThrow({ where: { id_usuario: id } });
  res.json({
    token: firmarToken({ id_usuario: id, rol: completo.rol, token_version: completo.token_version }),
    usuario: { ...actualizado, permisos: permisosDe(actualizado.rol) },
  });
}
