import type { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "./errorHandler";

/** Valida req.body con Zod; error 400 con detalles por campo. */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      const detalles: Record<string, string> = {};
      for (const p of r.error.issues) {
        detalles[p.path.join(".") || "body"] = p.message;
      }
      next(new HttpError(400, "Datos inválidos", detalles));
      return;
    }
    req.body = r.data;
    next();
  };
}
