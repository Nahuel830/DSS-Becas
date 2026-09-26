import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

/** Error con código HTTP y detalles por campo: { error, detalles }. */
export class HttpError extends Error {
  status: number;
  detalles?: Record<string, string>;
  constructor(status: number, mensaje: string, detalles?: Record<string, string>) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

const ETIQUETA_UNICO: Record<string, string> = {
  ci: "CI",
  correo: "correo",
  codigo_universitario: "código universitario",
  nombre: "nombre",
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.detalles ? { detalles: err.detalles } : {}) });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const campos = (err.meta?.target as string[] | undefined) ?? [];
      const campo = campos[0] ?? "campo";
      const etiqueta = ETIQUETA_UNICO[campo] ?? campo;
      res.status(409).json({
        error: `Ya existe un registro con ese ${etiqueta}`,
        detalles: { [campo]: `Ya existe un registro con ese ${etiqueta}` },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro no encontrado" });
      return;
    }
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}
