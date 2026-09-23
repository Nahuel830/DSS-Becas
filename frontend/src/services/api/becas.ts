import { apiClient } from "./client";
import type { Beca } from "./types";

export const becasApi = {
  /** POST /becas */
  asignar: (data: Beca) => apiClient.post<unknown>("/becas", data),
};
