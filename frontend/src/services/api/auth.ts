import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import type { SesionUsuario } from "../../state/AuthContext";

export const authApi = {
  me: async (): Promise<SesionUsuario> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const crudo = localStorage.getItem("dss-becas-usuario");
      if (!crudo) throw new Error("Sin sesión.");
      return JSON.parse(crudo) as SesionUsuario;
    }
    return apiClient.get<SesionUsuario>("/auth/me");
  },

  cambiarPassword: async (actual: string, nueva: string): Promise<{ token: string }> => {
    if (USE_MOCKS) {
      await simularRetardo();
      if (actual !== "demo") throw new Error("La contraseña actual es incorrecta.");
      return { token: localStorage.getItem("dss-becas-token") ?? "mock" };
    }
    return apiClient.post<{ token: string }>("/auth/cambiar-password", { actual, nueva });
  },
};
