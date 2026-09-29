import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { SeguimientoRow } from "./types";

export interface FiltrosSeguimiento {
  convocatoriaId?: string;
  estado?: string;
  carrera?: string;
}

export interface HistorialSeguimiento {
  historial: SeguimientoRow[];
  sugerencia_suspension: boolean;
}

// Espejo local de la regla del backend (D42); en modo real manda la API.
const PROMEDIO_MINIMO_LOCAL = 51;

export const seguimientoApi = {
  listar: async (f: FiltrosSeguimiento = {}): Promise<SeguimientoRow[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db
        .getAll("seguimientos")
        .filter(
          (s) =>
            (!f.estado || s.estado === f.estado) &&
            (!f.carrera || s.asignacion?.estudiante?.carrera === f.carrera) &&
            (!f.convocatoriaId || s.asignacion?.convocatoria?.nombre === f.convocatoriaId),
        );
    }
    const p = new URLSearchParams();
    if (f.convocatoriaId) p.set("convocatoriaId", f.convocatoriaId);
    if (f.estado) p.set("estado", f.estado);
    if (f.carrera) p.set("carrera", f.carrera);
    const q = p.toString();
    return apiClient.get<SeguimientoRow[]>(`/seguimiento${q ? `?${q}` : ""}`);
  },

  porAsignacion: async (idAsignacion: number): Promise<HistorialSeguimiento> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const historial = db
        .getAll("seguimientos")
        .filter((s) => s.id_asignacion === idAsignacion)
        .sort((a, b) => (a.periodo < b.periodo ? -1 : 1));
      const ultimos = historial.slice(-2).map((h) => h.estado);
      return {
        historial,
        sugerencia_suspension: ultimos.length === 2 && ultimos.every((e) => e === "En riesgo"),
      };
    }
    return apiClient.get<HistorialSeguimiento>(`/seguimiento/asignacion/${idAsignacion}`);
  },

  crear: async (d: {
    id_asignacion: number;
    fecha: string;
    periodo: string;
    promedio_periodo: number;
    observaciones?: string;
  }): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      db.create("seguimientos", {
        ...d,
        estado: d.promedio_periodo < PROMEDIO_MINIMO_LOCAL ? "En riesgo" : "Al día",
      });
      return;
    }
    await apiClient.post<unknown>("/seguimiento", d);
  },
};
