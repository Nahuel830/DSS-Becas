import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { ordenarRanking } from "../dss/ranking";
import { recomendar } from "../dss/criterios";

/** GET /api/dashboard/resumen (indicadores y gráficos calculados con consultas reales). */
export async function resumen(_req: Request, res: Response): Promise<void> {
  const [estudiantes, evaluaciones] = await Promise.all([
    prisma.estudiante.findMany({ select: { id_estudiante: true, nombre: true, apellido: true } }),
    prisma.evaluacion.findMany({ include: { estudiante: { select: { nombre: true, apellido: true } } } }),
  ]);
  const porEstudiante = new Map(estudiantes.map((e) => [e.id_estudiante, e]));
  const resumen = { evaluados: 0, recomendados: 0, en_revision: 0, en_riesgo: 0 };
  for (const ev of evaluaciones) {
    resumen.evaluados += 1;
    const r = recomendar(ev.puntaje_final);
    if (r === "Recomendado") resumen.recomendados += 1;
    else if (r === "En revisión") resumen.en_revision += 1;
    else resumen.en_riesgo += 1;
  }
  const ranking = ordenarRanking(
    evaluaciones.map((ev) => ({
      id_estudiante: ev.id_estudiante,
      nombre: `${ev.estudiante?.nombre ?? ""} ${ev.estudiante?.apellido ?? ""}`.trim() || `ID ${ev.id_estudiante}`,
      puntaje_final: ev.puntaje_final,
      promedio: 0,
      ingreso_familiar: 0,
    })),
  )
    .slice(0, 5)
    .map((f, i) => ({
      posicion: i + 1,
      estudiante: f.nombre,
      puntaje: f.puntaje_final,
      estado: recomendar(f.puntaje_final),
    }));
  const peores = [...evaluaciones].sort((a, b) => a.puntaje_final - b.puntaje_final).slice(0, 3);
  const pendientes = estudiantes.length - new Set(evaluaciones.map((e) => e.id_estudiante)).size;
  const alertas = [
    ...peores.map((ev) => {
      const e = porEstudiante.get(ev.id_estudiante);
      return `Baja de rendimiento: ${e ? `${e.nombre} ${e.apellido}` : `ID ${ev.id_estudiante}`}`;
    }),
    `Sin evaluar: ${pendientes} estudiantes`,
  ];
  res.json({
    ...resumen,
    ranking,
    distribucion: [
      { estado: "Recomendado", cantidad: resumen.recomendados },
      { estado: "En revisión", cantidad: resumen.en_revision },
      { estado: "En riesgo", cantidad: resumen.en_riesgo },
    ],
    alertas,
  });
}
