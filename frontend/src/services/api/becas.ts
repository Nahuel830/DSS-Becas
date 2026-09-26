import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { MOCK_BECAS } from "./mocks";
import type { Beca } from "./types";

export const becasApi = {
  /**
   * Lista becas. Sin GET /becas en openapi.yaml: solo mock.
   * En modo real intenta GET /becas y propaga el error (ver D18).
   */
  list: async (): Promise<Beca[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return MOCK_BECAS;
    }
    return apiClient.get<Beca[]>("/becas");
  },
  /** POST /becas (simulado con VITE_USE_MOCKS=true; no persiste). */
  asignar: async (data: Beca): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    await apiClient.post<unknown>("/becas", data);
  },
};
