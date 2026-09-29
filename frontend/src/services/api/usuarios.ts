import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { UsuarioRow } from "./types";

export const usuariosApi = {
  listar: async (q = ""): Promise<UsuarioRow[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const texto = q.trim().toLowerCase();
      return db
        .getAll("usuarios")
        .filter(
          (u) =>
            !texto ||
            `${u.usuario ?? ""} ${u.nombre} ${u.correo} ${u.rol}`.toLowerCase().includes(texto),
        );
    }
    const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return apiClient.get<UsuarioRow[]>(`/usuarios${query}`);
  },

  crear: async (d: Omit<UsuarioRow, "id_usuario"> & { password?: string }): Promise<UsuarioRow> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.create("usuarios", d);
    }
    return apiClient.post<UsuarioRow>("/usuarios", d);
  },

  actualizar: async (id: number, d: Partial<UsuarioRow>): Promise<UsuarioRow> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const actualizado = db.update("usuarios", id, d);
      if (!actualizado) throw new Error("Usuario no encontrado");
      return actualizado;
    }
    return apiClient.put<UsuarioRow>(`/usuarios/${id}`, d);
  },

  cambiarEstado: async (id: number, activo: boolean): Promise<UsuarioRow> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const actualizado = db.update("usuarios", id, { activo });
      if (!actualizado) throw new Error("Usuario no encontrado");
      return actualizado;
    }
    return apiClient.put<UsuarioRow>(`/usuarios/${id}/estado`, { activo });
  },

  eliminar: async (id: number): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      db.remove("usuarios", id);
      return;
    }
    await apiClient.del<unknown>(`/usuarios/${id}`);
  },
};
