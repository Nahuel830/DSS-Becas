import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";

/** CRUD genérico de catálogos con guarda 409 al eliminar con dependencias. */
function catalogo(
  modelo: "carrera" | "tipoBeca" | "convocatoria" | "criterio",
  etiqueta: string,
  usos?: (id: number) => Promise<number>,
) {
  const db = () => {
    if (modelo === "carrera") return prisma.carrera;
    if (modelo === "tipoBeca") return prisma.tipoBeca;
    if (modelo === "convocatoria") return prisma.convocatoria;
    return prisma.criterio;
  };
  return {
    async listar(_req: Request, res: Response): Promise<void> {
      res.json(await (db() as typeof prisma.carrera).findMany({ orderBy: { id: "asc" } }));
    },
    async obtener(req: Request, res: Response): Promise<void> {
      const item = await (db() as typeof prisma.carrera).findUnique({ where: { id: Number(req.params.id) } });
      if (!item) throw new HttpError(404, `${etiqueta} no encontrada`);
      res.json(item);
    },
    async crear(req: Request, res: Response): Promise<void> {
      res.status(201).json(await (db() as typeof prisma.carrera).create({ data: req.body }));
    },
    async actualizar(req: Request, res: Response): Promise<void> {
      const item = await (db() as typeof prisma.carrera).update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(item);
    },
    async eliminar(req: Request, res: Response): Promise<void> {
      const id = Number(req.params.id);
      if (usos && (await usos(id)) > 0) {
        throw new HttpError(409, `No se puede eliminar: tiene registros asociados`);
      }
      await (db() as typeof prisma.carrera).delete({ where: { id } });
      res.status(204).send();
    },
  };
}

async function usosAsignacion(columna: "id_tipo_beca" | "id_convocatoria", id: number): Promise<number> {
  return prisma.asignacion.count({ where: { [columna]: id } });
}

export const carreras = catalogo("carrera", "Carrera");
export const tiposBeca = catalogo("tipoBeca", "Tipo de beca", (id) => usosAsignacion("id_tipo_beca", id));
export const convocatorias = catalogo("convocatoria", "Convocatoria", (id) =>
  usosAsignacion("id_convocatoria", id),
);
export const criterios = catalogo("criterio", "Criterio");
