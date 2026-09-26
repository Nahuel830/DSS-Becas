import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import type { Evaluacion } from "./types";

export const evaluacionesApi = {
  /** POST /evaluaciones (simulado con VITE_USE_MOCKS=true; no persiste). */
  create: async (data: Evaluacion): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    await apiClient.post<unknown>("/evaluaciones", data);
  },
};
