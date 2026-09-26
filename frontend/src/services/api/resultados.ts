import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Resultado } from "./types";

export const resultadosApi = {
  /** GET /resultados/{id_estudiante} (db local con VITE_USE_MOCKS=true). */
  getByEstudiante: async (idEstudiante: number): Promise<Resultado> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const mock = db.getAll("resultados").find((r) => r.id_estudiante === idEstudiante);
      if (!mock) throw new Error(`Sin resultado para el estudiante ${idEstudiante}`);
      return mock;
    }
    return apiClient.get<Resultado>(`/resultados/${idEstudiante}`);
  },

  /** Igual que getByEstudiante, indicando si el dato es real o mock. */
  getByEstudianteConFallback: async (idEstudiante: number): Promise<{ data: Resultado | undefined; live: boolean }> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return { data: db.getAll("resultados").find((r) => r.id_estudiante === idEstudiante), live: false };
    }
    try {
      const data = await apiClient.get<Resultado>(`/resultados/${idEstudiante}`);
      return { data, live: true };
    } catch {
      return { data: db.getAll("resultados").find((r) => r.id_estudiante === idEstudiante), live: false };
    }
  },
};
