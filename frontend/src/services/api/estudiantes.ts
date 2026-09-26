import type { EstudianteExtendido } from "../../models/domain";
import { nombreCompleto } from "../../utils/dss";
import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Estudiante } from "./types";

/** Subconjunto del contrato para la API real (D21: los extras solo viven en local). */
function aContrato(e: EstudianteExtendido): Estudiante {
  return {
    id_estudiante: e.id_estudiante,
    nombre: e.nombre,
    apellido: e.apellido,
    carrera: e.carrera,
    promedio: e.promedio,
    ingreso_familiar: e.ingreso_familiar,
  };
}

export const estudiantesApi = {
  /** GET /estudiantes (db local con VITE_USE_MOCKS=true). */
  list: async (): Promise<EstudianteExtendido[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.getAll("estudiantes");
    }
    return apiClient.get<EstudianteExtendido[]>("/estudiantes");
  },

  getById: async (id: number): Promise<EstudianteExtendido | undefined> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.getById("estudiantes", id);
    }
    const lista = await apiClient.get<EstudianteExtendido[]>("/estudiantes");
    return lista.find((e) => e.id_estudiante === id);
  },

  /** POST /estudiantes. En mock persiste en db y devuelve la entidad con id. */
  create: async (data: EstudianteExtendido): Promise<EstudianteExtendido> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const { id_estudiante: _sinId, ...resto } = data;
      void _sinId;
      const creado = db.create("estudiantes", resto);
      db.registrarEvento({
        tipo: "creacion",
        id_estudiante: creado.id_estudiante ?? null,
        detalle: `Estudiante registrado: ${nombreCompleto(creado)}`,
      });
      return creado;
    }
    await apiClient.post<unknown>("/estudiantes", aContrato(data));
    return data;
  },

  /** PUT /estudiantes/:id (mock: db; real: supone endpoint, propaga error si no existe). */
  update: async (id: number, cambios: Partial<EstudianteExtendido>): Promise<EstudianteExtendido | undefined> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.update("estudiantes", id, cambios, {
        tipo: "edicion",
        id_estudiante: id,
        detalle: "Datos del estudiante actualizados",
      });
    }
    return apiClient.put<EstudianteExtendido>(`/estudiantes/${id}`, cambios);
  },

  /** DELETE /estudiantes/:id (mock: db; real: supone endpoint). */
  remove: async (id: number): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      db.remove("estudiantes", id, {
        tipo: "eliminacion",
        id_estudiante: id,
        detalle: "Estudiante eliminado",
      });
      return;
    }
    await apiClient.del<unknown>(`/estudiantes/${id}`);
  },
};
