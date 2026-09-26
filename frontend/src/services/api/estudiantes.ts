import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { MOCK_ESTUDIANTES } from "./mocks";
import type { Estudiante } from "./types";

export const estudiantesApi = {
  /** GET /estudiantes (mock con VITE_USE_MOCKS=true). */
  list: async (): Promise<Estudiante[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return MOCK_ESTUDIANTES;
    }
    return apiClient.get<Estudiante[]>("/estudiantes");
  },
  /** POST /estudiantes (simulado con VITE_USE_MOCKS=true; no persiste). */
  create: async (data: Estudiante): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    await apiClient.post<unknown>("/estudiantes", data);
  },
};
