import { estudiantesApi } from "./estudiantes";
import { MOCK_ALERTAS, MOCK_ESTUDIANTES, MOCK_EVALUACIONES, MOCK_RESUMEN } from "./mocks";
import type { Estudiante, Evaluacion } from "./types";

export interface DashboardData {
  estudiantes: Estudiante[];
  evaluaciones: Evaluacion[];
  resumen: { evaluados: number; recomendados: number; en_revision: number; en_riesgo: number };
  alertas: string[];
  /** true cuando viene del backend real, false cuando es mock local. */
  live: boolean;
}

/**
 * Dashboard: GET /estudiantes (+ resultados en caché en fase 2).
 * Sin backend disponible devuelve el bundle mock con forma del contrato.
 */
export async function fetchDashboard(): Promise<DashboardData> {
  try {
    const estudiantes = await estudiantesApi.list();
    if (!Array.isArray(estudiantes) || estudiantes.length === 0) throw new Error("empty");
    return {
      estudiantes,
      evaluaciones: MOCK_EVALUACIONES,
      resumen: MOCK_RESUMEN,
      alertas: MOCK_ALERTAS,
      live: true,
    };
  } catch {
    return {
      estudiantes: MOCK_ESTUDIANTES,
      evaluaciones: MOCK_EVALUACIONES,
      resumen: MOCK_RESUMEN,
      alertas: MOCK_ALERTAS,
      live: false,
    };
  }
}
