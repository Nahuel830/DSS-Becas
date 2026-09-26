import { API_BASE_URL, USE_MOCKS, apiClient, simularRetardo } from "./client";

export interface DocumentoRow {
  id: number;
  nombre: string;
  tamanio: number;
  mime: string;
}

export const documentosApi = {
  /** GET /estudiantes/:id/documentos (en mock se usan los de la entidad). */
  listar: async (idEstudiante: number): Promise<DocumentoRow[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return [];
    }
    return apiClient.get<DocumentoRow[]>(`/estudiantes/${idEstudiante}/documentos`);
  },

  /** Subida con barra de progreso (campo "archivo"). En mock solo simula. */
  subir: (
    idEstudiante: number,
    archivo: File,
    onProgreso?: (porcentaje: number) => void,
  ): Promise<DocumentoRow> => {
    if (USE_MOCKS) {
      return simularRetardo().then(() => ({
        id: Date.now(),
        nombre: archivo.name,
        tamanio: archivo.size,
        mime: archivo.type,
      }));
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/estudiantes/${idEstudiante}/documentos`);
      const datos = new FormData();
      datos.append("archivo", archivo);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgreso?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as DocumentoRow);
        } else {
          try {
            const cuerpo = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(cuerpo.error ?? "No se pudo subir el archivo."));
          } catch {
            reject(new Error("No se pudo subir el archivo."));
          }
        }
      };
      xhr.onerror = () =>
        reject(new Error("No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."));
      xhr.send(datos);
    });
  },

  eliminar: async (id: number): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    await apiClient.del<unknown>(`/documentos/${id}`);
  },
};
