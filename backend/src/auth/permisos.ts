import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middlewares/errorHandler";

/**
 * ÚNICA fuente de verdad de permisos por rol (D61).
 * Clave "modulo:accion". Ninguna ruta queda sin permiso salvo
 * /api/health y /api/auth/* (públicas).
 */
export const PERMISOS_POR_ROL: Record<string, string[]> = {
  Administrador: [
    "estudiantes:ver",
    "estudiantes:crear",
    "estudiantes:editar",
    "estudiantes:eliminar",
    "documentos:subir",
    "documentos:eliminar",
    "evaluaciones:ver",
    "evaluaciones:crear",
    "evaluaciones:editar",
    "evaluaciones:eliminar",
    "asignaciones:ver",
    "asignaciones:generar",
    "asignaciones:decidir",
    "asignaciones:revocar",
    "seguimiento:ver",
    "seguimiento:editar",
    "reportes:ver",
    "catalogos:ver",
    "configuracion:ver",
    "configuracion:editar",
    "usuarios:gestionar",
    "dev:reset",
  ],
  Evaluador: [
    "estudiantes:ver",
    "estudiantes:crear",
    "estudiantes:editar",
    "documentos:subir",
    "evaluaciones:ver",
    "evaluaciones:crear",
    "evaluaciones:editar",
    "asignaciones:ver",
    "asignaciones:decidir",
    "seguimiento:ver",
    "seguimiento:editar",
    "reportes:ver",
    "catalogos:ver",
  ],
  Consulta: [
    "estudiantes:ver",
    "evaluaciones:ver",
    "asignaciones:ver",
    "seguimiento:ver",
    "reportes:ver",
    "catalogos:ver",
  ],
};

export function tienePermiso(rol: string | undefined, permiso: string): boolean {
  if (!rol) return false;
  return (PERMISOS_POR_ROL[rol] ?? []).includes(permiso);
}

export function permisosDe(rol: string | undefined): string[] {
  if (!rol) return [];
  return [...(PERMISOS_POR_ROL[rol] ?? [])];
}

/** Exige el permiso indicado; si no → 403. Requiere requireAuth antes. */
export function requirePermiso(permiso: string) {
  const mw = (req: Request, _res: Response, next: NextFunction): void => {
    if (process.env.DSS_DEBUG_PERMISOS === "1") {
      // eslint-disable-next-line no-console
      console.log(`[permiso] ${req.method} ${req.path} rol=${req.usuario?.rol} permiso=${permiso}`);
    }
    if (!tienePermiso(req.usuario?.rol, permiso)) {
      next(new HttpError(403, "Su rol no permite esta acción."));
      return;
    }
    next();
  };
  // Marcado para el test de cobertura: toda ruta registrada debe llevar permiso.
  (mw as unknown as { permiso: string }).permiso = permiso;
  return mw;
}
