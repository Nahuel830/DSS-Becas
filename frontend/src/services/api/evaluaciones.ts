import { clasificarPuntaje } from "../../utils/dss";
import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Evaluacion } from "./types";

export interface CriteriosEntrada {
  rendimiento: number;
  asistencia: number;
  situacion: number;
  carga: number;
  vulnerable: number;
}

export interface ResultadoCalculo {
  puntaje_academico: number;
  puntaje_social: number;
  puntaje_final: number;
  recomendacion: string;
  elegible: boolean;
  motivos_no_elegible: string[];
}

export const evaluacionesApi = {
  /** POST /api/evaluaciones/calcular (motor + elegibilidad; en mock usa el cálculo local). */
  calcular: async (
    idEstudiante: number,
    criterios: CriteriosEntrada,
    tipoBeca?: string,
  ): Promise<ResultadoCalculo> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return { puntaje_academico: 0, puntaje_social: 0, puntaje_final: 0, recomendacion: "-", elegible: true, motivos_no_elegible: [] };
    }
    return apiClient.post<ResultadoCalculo>("/evaluaciones/calcular", {
      id_estudiante: idEstudiante,
      criterios,
      ...(tipoBeca ? { tipo_beca: tipoBeca } : {}),
    });
  },
  /** POST /evaluaciones. En mock persiste en db, actualiza el resultado y registra el evento. */
  create: async (data: Evaluacion): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const { id_evaluacion: _sinId, ...resto } = data;
      void _sinId;
      const creada = db.create("evaluaciones", resto);
      const final = creada.puntaje_final ?? 0;
      const previa = db.getAll("resultados").find((r) => r.id_estudiante === creada.id_estudiante);
      const etiqueta = clasificarPuntaje(final);
      if (previa?.id_resultado) {
        db.update("resultados", previa.id_resultado, { resultado: etiqueta });
      } else {
        db.create("resultados", { id_estudiante: creada.id_estudiante, resultado: etiqueta });
      }
      db.registrarEvento({
        tipo: "evaluacion",
        id_estudiante: creada.id_estudiante ?? null,
        detalle: `Evaluación registrada con puntaje ${final}`,
      });
      return;
    }
    await apiClient.post<unknown>("/evaluaciones", data);
  },
  /** POST /api/evaluaciones/evaluar-todos (evalúa pendientes con criterios derivados). */
  evaluarTodos: async (): Promise<{ evaluadas: number }> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return { evaluadas: 0 };
    }
    return apiClient.post<{ evaluadas: number }>("/evaluaciones/evaluar-todos", {});
  },
};
