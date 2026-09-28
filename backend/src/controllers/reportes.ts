import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { recomendar } from "../dss/criterios";

/** GET /api/reportes/resumen?convocatoriaId= */
export async function resumen(req: Request, res: Response): Promise<void> {
  const convocatoriaId = req.query.convocatoriaId !== undefined ? Number(req.query.convocatoriaId) : undefined;
  const [totalEstudiantes, evaluaciones, asignaciones] = await Promise.all([
    prisma.estudiante.count(),
    prisma.evaluacion.findMany({ include: { estudiante: { select: { carrera: true } } } }),
    prisma.asignacion.findMany({
      where: convocatoriaId ? { id_convocatoria: convocatoriaId } : {},
      include: { tipoBeca: { select: { nombre: true, monto: true } } },
    }),
  ]);
  const evaluados = new Set(evaluaciones.map((e) => e.id_estudiante)).size;
  const porEstado = (estado: string): number => asignaciones.filter((a) => a.estado === estado).length;
  const montoAsignado = asignaciones
    .filter((a) => a.estado === "Aprobada")
    .reduce((s, a) => s + a.tipoBeca.monto, 0);
  let presupuesto = 0;
  if (convocatoriaId) {
    const conv = await prisma.convocatoria.findUnique({ where: { id: convocatoriaId } });
    presupuesto = conv?.presupuesto ?? 0;
  } else {
    const convs = await prisma.convocatoria.findMany();
    presupuesto = convs.reduce((s, c) => s + c.presupuesto, 0);
  }
  const porCarrera = new Map<string, number>();
  for (const ev of evaluaciones) {
    const c = ev.estudiante?.carrera ?? "Sin carrera";
    porCarrera.set(c, (porCarrera.get(c) ?? 0) + 1);
  }
  const porTipo = new Map<string, { cantidad: number; monto: number }>();
  for (const a of asignaciones) {
    const actual = porTipo.get(a.tipoBeca.nombre) ?? { cantidad: 0, monto: 0 };
    porTipo.set(a.tipoBeca.nombre, {
      cantidad: actual.cantidad + 1,
      monto: actual.monto + (a.estado === "Aprobada" ? a.tipoBeca.monto : 0),
    });
  }
  const promedio =
    evaluaciones.length === 0
      ? 0
      : Math.round((evaluaciones.reduce((s, e) => s + e.puntaje_final, 0) / evaluaciones.length) * 100) / 100;
  const enRiesgo = evaluaciones.filter((e) => recomendar(e.puntaje_final) === "En riesgo").length;
  res.json({
    postulantes: totalEstudiantes,
    evaluados,
    aprobados: porEstado("Aprobada"),
    rechazados: porEstado("Rechazada"),
    en_observacion: porEstado("En observación"),
    monto_asignado: montoAsignado,
    presupuesto,
    por_carrera: [...porCarrera.entries()]
      .map(([carrera, cantidad]) => ({ carrera, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
    por_tipo: [...porTipo.entries()].map(([tipo, v]) => ({ tipo, ...v })),
    puntaje_promedio: promedio,
    en_riesgo: enRiesgo,
  });
}

function csv(filas: Array<Array<string | number>>): string {
  const escapar = (v: string | number): string => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `﻿${filas.map((f) => f.map(escapar).join(";")).join("\n")}`;
}

/** GET /api/reportes/ranking.csv */
export async function rankingCsv(_req: Request, res: Response): Promise<void> {
  const evals = await prisma.evaluacion.findMany({
    include: { estudiante: { select: { nombre: true, apellido: true, carrera: true } } },
    orderBy: { puntaje_final: "desc" },
  });
  const filas: Array<Array<string | number>> = [["Posición", "Estudiante", "Carrera", "Puntaje", "Recomendación"]];
  evals.forEach((ev, i) => {
    filas.push([
      i + 1,
      `${ev.estudiante?.nombre ?? ""} ${ev.estudiante?.apellido ?? ""}`.trim(),
      ev.estudiante?.carrera ?? "",
      ev.puntaje_final,
      recomendar(ev.puntaje_final),
    ]);
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=ranking.csv");
  res.send(csv(filas));
}

/** GET /api/reportes/asignaciones.csv */
export async function asignacionesCsv(_req: Request, res: Response): Promise<void> {
  const items = await prisma.asignacion.findMany({
    include: {
      estudiante: { select: { nombre: true, apellido: true } },
      convocatoria: { select: { nombre: true } },
      tipoBeca: { select: { nombre: true, monto: true } },
    },
    orderBy: { puntaje: "desc" },
  });
  const filas: Array<Array<string | number>> = [["Estudiante", "Convocatoria", "Beca", "Monto", "Estado"]];
  for (const a of items) {
    filas.push([
      `${a.estudiante.nombre} ${a.estudiante.apellido}`,
      a.convocatoria.nombre,
      a.tipoBeca.nombre,
      a.tipoBeca.monto,
      a.estado,
    ]);
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=asignaciones.csv");
  res.send(csv(filas));
}
