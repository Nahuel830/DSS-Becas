import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { recomendar } from "../dss/criterios";
import { HttpError } from "../middlewares/errorHandler";

type OrdenEstudiante = "codigo" | "nombre" | "carrera" | "promedio" | "puntaje";

async function evento(id_estudiante: number | null, tipo: string, detalle: string): Promise<void> {
  await prisma.evento.create({ data: { id_estudiante, tipo, detalle } });
}

function estadoDe(e: {
  becas: Array<{ estado: string }>;
  evaluaciones: Array<{ puntaje_final: number }>;
  resultados: Array<{ resultado: string }>;
}): { puntaje_final: number | null; estado_beca: string; resultado: string | null } {
  const puntaje = e.evaluaciones[0]?.puntaje_final ?? null;
  const becaActiva = e.becas.some((b) => b.estado === "Activa");
  return {
    puntaje_final: puntaje,
    estado_beca: becaActiva ? "Activa" : puntaje !== null ? recomendar(puntaje) : "Pendiente",
    resultado: e.resultados[0]?.resultado ?? null,
  };
}

/** GET /api/estudiantes?q=&carrera=&semestre=&estado=&orden=&dir=&page=&pageSize= */
export async function listar(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? "").trim();
  const carrera = String(req.query.carrera ?? "").trim();
  const semestre = req.query.semestre !== undefined ? Number(req.query.semestre) : undefined;
  const estado = String(req.query.estado ?? "").trim();
  const orden = (String(req.query.orden ?? "codigo") as OrdenEstudiante) || "codigo";
  const dir = req.query.dir === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const pageSize = [10, 20, 50].includes(Number(req.query.pageSize)) ? Number(req.query.pageSize) : 10;

  const where = {
    ...(q
      ? { OR: [{ nombre: { contains: q } }, { apellido: { contains: q } }, { ci: { contains: q } }, { carrera: { contains: q } }] }
      : {}),
    ...(carrera ? { carrera } : {}),
    ...(semestre !== undefined && Number.isInteger(semestre) ? { semestre } : {}),
  };
  const todos = await prisma.estudiante.findMany({
    where,
    include: {
      evaluaciones: { orderBy: { id_evaluacion: "desc" }, take: 1 },
      resultados: { take: 1 },
      becas: true,
    },
  });

  let filas = todos.map((e) => {
    const { evaluaciones, resultados, becas: _b, ...base } = e;
    return { ...base, ...estadoDe(e) };
  });
  if (estado) filas = filas.filter((f) => f.estado_beca === estado);

  const por: Record<OrdenEstudiante, (f: (typeof filas)[number]) => string | number> = {
    codigo: (f) => f.id_estudiante,
    nombre: (f) => `${f.nombre} ${f.apellido}`,
    carrera: (f) => f.carrera,
    promedio: (f) => f.promedio,
    puntaje: (f) => f.puntaje_final ?? -1,
  };
  const get = por[orden] ?? por.codigo;
  filas.sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
    return dir === "desc" ? -cmp : cmp;
  });

  const total = filas.length;
  const data = filas.slice((page - 1) * pageSize, page * pageSize);
  res.json({ data, total, page, pageSize });
}

/** GET /api/estudiantes/:id (con relaciones). */
export async function obtener(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const e = await prisma.estudiante.findUnique({
    where: { id_estudiante: id },
    include: { evaluaciones: true, resultados: true, becas: true, documentos: true },
  });
  if (!e) throw new HttpError(404, "Estudiante no encontrado");
  res.json(e);
}

/** GET /api/estudiantes/:id/historial */
export async function historial(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const eventos = await prisma.evento.findMany({
    where: { id_estudiante: id },
    orderBy: { fecha: "desc" },
  });
  res.json(eventos);
}

/** POST /api/estudiantes */
export async function crear(req: Request, res: Response): Promise<void> {
  const e = await prisma.estudiante.create({ data: req.body });
  await evento(e.id_estudiante, "creacion", `Estudiante registrado: ${e.nombre} ${e.apellido}`);
  res.status(201).json(e);
}

/** PUT /api/estudiantes/:id */
export async function actualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const e = await prisma.estudiante.update({ where: { id_estudiante: id }, data: req.body });
  await evento(id, "edicion", "Datos del estudiante actualizados");
  res.json(e);
}

/** DELETE /api/estudiantes/:id (elimina en cascada evaluaciones, becas, documentos e historial). */
export async function eliminar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await prisma.estudiante.delete({ where: { id_estudiante: id } });
  res.status(204).send();
}
