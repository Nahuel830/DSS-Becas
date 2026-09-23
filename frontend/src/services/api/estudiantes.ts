import { apiClient } from "./client";
import type { Estudiante } from "./types";

export const estudiantesApi = {
  /** GET /estudiantes */
  list: () => apiClient.get<Estudiante[]>("/estudiantes"),
  /** POST /estudiantes */
  create: (data: Estudiante) => apiClient.post<unknown>("/estudiantes", data),
};
