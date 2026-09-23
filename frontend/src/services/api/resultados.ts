import { apiClient } from "./client";
import { MOCK_RESULTADOS } from "./mocks";
import type { Resultado } from "./types";

export const resultadosApi = {
  /** GET /resultados/{id_estudiante} */
  getByEstudiante: (idEstudiante: number) =>
    apiClient.get<Resultado>(`/resultados/${idEstudiante}`),

  /** Igual que getByEstudiante, con fallback al mock si no hay backend. */
  getByEstudianteConFallback: async (idEstudiante: number): Promise<{ data: Resultado | undefined; live: boolean }> => {
    try {
      const data = await apiClient.get<Resultado>(`/resultados/${idEstudiante}`);
      return { data, live: true };
    } catch {
      return { data: MOCK_RESULTADOS.find((r) => r.id_estudiante === idEstudiante), live: false };
    }
  },
};
