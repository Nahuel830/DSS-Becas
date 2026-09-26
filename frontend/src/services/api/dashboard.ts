import { clasificarPuntaje } from "../../utils/dss";
import { USE_MOCKS, simularRetardo } from "./client";
import { estudiantesApi } from "./estudiantes";
import { MOCK_ALERTAS, MOCK_ESTUDIANTES, MOCK_EVALUACIONES } from "./mocks";
import type { Estudiante, Evaluacion } from "./types";

export interface ResumenDashboard {
  evaluados: number;
  recomendados: number;
  en_revision: number;
  en_riesgo: number;
}

export interface DashboardData {
  estudiantes: Estudiante[];
  evaluaciones: Evaluacion[];
  resumen: ResumenDashboard;
  alertas: string[];
  /** true cuando viene del backend real, false cuando es mock local. */
  live: boolean;
}

/** Calcula los indicadores del dashboard desde las evaluaciones (nunca hardcodeados). */
export function calcularResumen(evaluaciones: Evaluacion[]): ResumenDashboard {
  const resumen: ResumenDashboard = { evaluados: 0, recomendados: 0, en_revision: 0, en_riesgo: 0 };
  for (const ev of evaluaciones) {
    resumen.evaluados += 1;
    const estado = clasificarPuntaje(ev.puntaje_final ?? 0);
    if (estado === "Recomendado") resumen.recomendados += 1;
    else if (estado === "En revisión") resumen.en_revision += 1;
    else if (estado === "En riesgo") resumen.en_riesgo += 1;
  }
  return resumen;
}

/** Dashboard: GET /estudiantes real, o bundle mock con VITE_USE_MOCKS=true. */
export async function fetchDashboard(): Promise<DashboardData> {
  if (USE_MOCKS) {
    await simularRetardo();
    return {
      estudiantes: MOCK_ESTUDIANTES,
      evaluaciones: MOCK_EVALUACIONES,
      resumen: calcularResumen(MOCK_EVALUACIONES),
      alertas: MOCK_ALERTAS,
      live: false,
    };
  }
  const estudiantes = await estudiantesApi.list();
  return {
    estudiantes,
    evaluaciones: MOCK_EVALUACIONES,
    resumen: calcularResumen(MOCK_EVALUACIONES),
    alertas: MOCK_ALERTAS,
    live: true,
  };
}
