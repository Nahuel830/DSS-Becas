import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Beca } from "./types";

export const becasApi = {
  /**
   * Lista becas. Sin GET /becas en openapi.yaml: solo db local.
   * En modo real intenta GET /becas y propaga el error (ver D18).
   */
  list: async (): Promise<Beca[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.getAll("becas");
    }
    return apiClient.get<Beca[]>("/becas");
  },
  /** POST /becas (db local con VITE_USE_MOCKS=true). */
  asignar: async (data: Beca): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const { id_beca: _sinId, ...resto } = data;
      void _sinId;
      db.create("becas", resto);
      return;
    }
    await apiClient.post<unknown>("/becas", data);
  },
};
