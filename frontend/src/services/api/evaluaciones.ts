import { apiClient } from "./client";
import type { Evaluacion } from "./types";

export const evaluacionesApi = {
  /** POST /evaluaciones */
  create: (data: Evaluacion) => apiClient.post<unknown>("/evaluaciones", data),
};
