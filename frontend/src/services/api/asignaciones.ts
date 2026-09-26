import { USE_MOCKS, apiClient, simularRetardo } from "./client";

export interface FilaRanking {
  posicion: number;
  id_estudiante: number;
  nombre: string;
  carrera: string;
  puntaje_final: number;
  promedio: number;
  ingreso_familiar: number;
  recomendacion: string;
  asignado: boolean;
}

export interface ResumenAsignacion {
  cupos_totales: number;
  ocupados: number;
  disponibles: number;
  presupuesto_total: number;
  presupuesto_usado: number;
  presupuesto_disponible: number;
}

export interface Asignacion {
  id: number;
  id_estudiante: number;
  id_convocatoria: number;
  id_tipo_beca: number;
  puntaje: number;
  estado: string;
  estudiante?: { nombre: string; apellido: string; carrera: string };
}

export const asignacionesApi = {
  ranking: async (convocatoriaId?: number, tipoBecaId?: number): Promise<FilaRanking[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return [];
    }
    const p = new URLSearchParams();
    if (convocatoriaId) p.set("convocatoriaId", String(convocatoriaId));
    if (tipoBecaId) p.set("tipoBecaId", String(tipoBecaId));
    const q = p.toString();
    return apiClient.get<FilaRanking[]>(`/ranking${q ? `?${q}` : ""}`);
  },

  resumen: async (convocatoriaId: number, tipoBecaId: number): Promise<ResumenAsignacion> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return {
        cupos_totales: 0, ocupados: 0, disponibles: 0,
        presupuesto_total: 0, presupuesto_usado: 0, presupuesto_disponible: 0,
      };
    }
    return apiClient.get<ResumenAsignacion>(
      `/asignaciones/resumen?convocatoriaId=${convocatoriaId}&tipoBecaId=${tipoBecaId}`,
    );
  },

  generar: async (convocatoriaId: number, tipoBecaId: number): Promise<{ generadas: number }> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return { generadas: 0 };
    }
    return apiClient.post<{ generadas: number }>("/asignaciones/generar", { convocatoriaId, tipoBecaId });
  },

  listar: async (convocatoriaId?: number, tipoBecaId?: number): Promise<Asignacion[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return [];
    }
    const p = new URLSearchParams();
    if (convocatoriaId) p.set("convocatoriaId", String(convocatoriaId));
    if (tipoBecaId) p.set("tipoBecaId", String(tipoBecaId));
    const q = p.toString();
    return apiClient.get<Asignacion[]>(`/asignaciones${q ? `?${q}` : ""}`);
  },

  revocar: async (id: number): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    await apiClient.del<unknown>(`/asignaciones/${id}`);
  },
};
