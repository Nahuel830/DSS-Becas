import type { EstadoEstudiante } from "../models/domain";
import type { Estudiante, Evaluacion } from "../services/api/types";

/** Umbrales DSS (evaluacion-dss.png; corrige secuencia que omitía "En riesgo"). */
export const UMBRAL_RECOMENDADO = 80;
export const UMBRAL_REVISION_MIN = 60;

export function clasificarPuntaje(puntaje: number): EstadoEstudiante {
  if (puntaje >= UMBRAL_RECOMENDADO) return "Recomendado";
  if (puntaje >= UMBRAL_REVISION_MIN) return "En revisión";
  return "En riesgo";
}

/** Pesos de criterios ponderados (evaluacion-dss.png). Solo constantes de UI. */
export const PESOS_CRITERIOS = {
  rendimiento_academico: 30,
  asistencia: 15,
  situacion_socioeconomica: 25,
  carga_familiar: 15,
  condicion_vulnerable: 15,
} as const;

/** Código visible EST-001… (los mocks usan código; el contrato usa id_estudiante). */
export function codigoEstudiante(id: number | undefined): string {
  if (!id) return "-";
  return `EST-${String(id).padStart(3, "0")}`;
}

export function nombreCompleto(e: Pick<Estudiante, "nombre" | "apellido">): string {
  return `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim() || "-";
}

export function getEvaluacion(
  evaluaciones: Evaluacion[],
  idEstudiante: number,
): Evaluacion | undefined {
  return evaluaciones.find((ev) => ev.id_estudiante === idEstudiante);
}
