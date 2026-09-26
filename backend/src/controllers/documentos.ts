import { promises as fs } from "fs";
import path from "path";
import type { Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { prisma } from "../config/db";
import { HttpError } from "../middlewares/errorHandler";

const PERMITIDOS = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const id = String((req.params as Record<string, string>).id ?? "tmp");
    cb(null, path.join(env.UPLOAD_DIR, id));
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

async function asegurarDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (PERMITIDOS.includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, "Solo se permiten PDF, JPG y PNG de hasta 5 MB."));
  },
});

/** POST /api/estudiantes/:id/documentos (campo "archivo"). */
export async function subir(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const est = await prisma.estudiante.findUnique({ where: { id_estudiante: id } });
  if (!est) throw new HttpError(404, "Estudiante no encontrado");
  const archivo = req.file;
  if (!archivo) throw new HttpError(400, "Falta el archivo (campo 'archivo').");
  const dir = path.join(env.UPLOAD_DIR, String(id));
  await asegurarDir(dir);
  const destino = path.join(dir, archivo.filename);
  await fs.rename(archivo.path, destino);
  const doc = await prisma.documento.create({
    data: {
      id_estudiante: id,
      nombre: archivo.originalname,
      tamanio: archivo.size,
      mime: archivo.mimetype,
      ruta: destino,
    },
  });
  await prisma.evento.create({
    data: { id_estudiante: id, tipo: "edicion", detalle: `Documento adjuntado: ${doc.nombre}` },
  });
  res.status(201).json(doc);
}

/** GET /api/estudiantes/:id/documentos */
export async function listar(req: Request, res: Response): Promise<void> {
  res.json(
    await prisma.documento.findMany({
      where: { id_estudiante: Number(req.params.id) },
      orderBy: { id: "desc" },
    }),
  );
}

/** GET /api/documentos/:id/descarga */
export async function descargar(req: Request, res: Response): Promise<void> {
  const doc = await prisma.documento.findUnique({ where: { id: Number(req.params.id) } });
  if (!doc) throw new HttpError(404, "Documento no encontrado");
  res.download(doc.ruta, doc.nombre);
}

/** DELETE /api/documentos/:id */
export async function eliminar(req: Request, res: Response): Promise<void> {
  const doc = await prisma.documento.findUnique({ where: { id: Number(req.params.id) } });
  if (!doc) throw new HttpError(404, "Documento no encontrado");
  await prisma.documento.delete({ where: { id: doc.id } });
  await fs.unlink(doc.ruta).catch(() => undefined);
  await prisma.evento.create({
    data: { id_estudiante: doc.id_estudiante, tipo: "edicion", detalle: `Documento eliminado: ${doc.nombre}` },
  });
  res.status(204).send();
}
