import { prisma } from "../config/db";

// Reglas de elegibilidad previas del DSS (configurables, ver D40).
// promedioMinimo: escala 0–100. topeIngresoSocial: Bs mensuales máximos
// del ingreso familiar para becas de tipo Social.
export const PROMEDIO_MINIMO = 51;
export const TOPE_INGRESO_SOCIAL = 4000;

export interface VeredictoElegibilidad {
  elegible: boolean;
  motivos_no_elegible: string[];
}

/** Filtros duros previos al puntaje (#3). */
export function evaluarElegibilidad(
  estudiante: { promedio: number; ingreso_familiar: number },
  tipoBeca?: string,
): VeredictoElegibilidad {
  const motivos: string[] = [];
  if (estudiante.promedio < PROMEDIO_MINIMO) {
    motivos.push(`Promedio ${estudiante.promedio} bajo el mínimo ${PROMEDIO_MINIMO}.`);
  }
  if (tipoBeca === "Social" && estudiante.ingreso_familiar > TOPE_INGRESO_SOCIAL) {
    motivos.push(`Ingreso familiar supera el tope Social (Bs ${TOPE_INGRESO_SOCIAL}).`);
  }
  return { elegible: motivos.length === 0, motivos_no_elegible: motivos };
}
