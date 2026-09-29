import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { verificarToken } from "../auth/jwt";
import { HttpError } from "./errorHandler";

export interface UsuarioSesion {
  id_usuario: number;
  usuario: string;
  nombre: string;
  correo: string;
  rol: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
    }
  }
}

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

/** Exige JWT válido y recarga el usuario en cada petición (D58). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    next(new HttpError(401, "Sesión requerida."));
    return;
  }
  let payload: { id_usuario: number; rol: string; token_version: number };
  try {
    payload = verificarToken(token);
  } catch {
    next(new HttpError(401, "Su sesión expiró o sus datos cambiaron, ingrese nuevamente."));
    return;
  }
  prisma.usuario
    .findUnique({ where: { id_usuario: payload.id_usuario }, select: SIN_HASH })
    .then((u) => {
      if (!u || !u.activo || u.token_version !== payload.token_version) {
        next(new HttpError(401, "Su sesión expiró o sus datos cambiaron, ingrese nuevamente."));
        return;
      }
      req.usuario = {
        id_usuario: u.id_usuario,
        usuario: u.usuario,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
      };
      next();
    })
    .catch(next);
}

/** Exige uno de los roles indicados (se evalúa con el rol recargado). */
export function requireRol(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      next(new HttpError(403, "Su rol no permite esta acción."));
      return;
    }
    next();
  };
}

/** Rol Consulta: solo lectura (GET y descargas). */
export function soloLecturaParaConsulta(req: Request, _res: Response, next: NextFunction): void {
  if (req.usuario?.rol === "Consulta" && req.method !== "GET") {
    next(new HttpError(403, "Su rol no permite esta acción."));
    return;
  }
  next();
}
