import type { EstudianteExtendido } from "../../models/domain";
import { clasificarPuntaje } from "../../utils/dss";
import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import { estudiantesApi } from "./estudiantes";
import { MOCK_ALERTAS } from "./mocks";
import type { Beca, Estudiante, Evaluacion } from "./types";

export interface ResumenDashboard {
  evaluados: number;
  recomendados: number;
  en_revision: number;
  en_riesgo: number;
}

export interface DashboardData {
  estudiantes: EstudianteExtendido[];
  evaluaciones: Evaluacion[];
  becas: Beca[];
  resumen: ResumenDashboard;
  alertas: string[];
  /** true cuando viene del backend real, false cuando es mock local. */
  live: boolean;
}

interface ResumenApi {
  evaluados: number;
  recomendados: number;
  en_revision: number;
  en_riesgo: number;
  ranking: Array<{ posicion: number; estudiante: string; puntaje: number; estado: string }>;
  distribucion: Array<{ estado: string; cantidad: number }>;
  alertas: string[];
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

/** Dashboard: resumen calculado por el backend, o bundle mock con VITE_USE_MOCKS=true. */
export async function fetchDashboard(): Promise<DashboardData> {
  if (USE_MOCKS) {
    await simularRetardo();
    const estudiantes = db.getAll("estudiantes");
    const evaluaciones = db.getAll("evaluaciones");
    return {
      estudiantes,
      evaluaciones,
      becas: db.getAll("becas"),
      resumen: calcularResumen(evaluaciones),
      alertas: MOCK_ALERTAS,
      live: false,
    };
  }
  const [estudiantes, evaluaciones, becas, resumen] = await Promise.all([
    estudiantesApi.list(),
    apiClient.get<Evaluacion[]>("/evaluaciones"),
    apiClient.get<Beca[]>("/becas"),
    apiClient.get<ResumenApi>("/dashboard/resumen"),
  ]);
  return {
    estudiantes: estudiantes as EstudianteExtendido[],
    evaluaciones,
    becas,
    resumen: {
      evaluados: resumen.evaluados,
      recomendados: resumen.recomendados,
      en_revision: resumen.en_revision,
      en_riesgo: resumen.en_riesgo,
    },
    alertas: resumen.alertas,
    live: true,
  };
}

export type { Estudiante };
