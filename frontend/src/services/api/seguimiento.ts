import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { BecarioSeguimiento, SeguimientoRow } from "./types";

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
  becarios: async (f: FiltrosSeguimiento = {}): Promise<BecarioSeguimiento[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      const porAsig = new Map<number, SeguimientoRow[]>();
      for (const s of db.getAll("seguimientos")) {
        const lista = porAsig.get(s.id_asignacion) ?? [];
        lista.push(s);
        porAsig.set(s.id_asignacion, lista);
      }
      const filas: BecarioSeguimiento[] = db.getAll("becas")
        .filter((b) => b.estado === "Activa")
        .map((b) => {
          const est = db.getAll("estudiantes").find((e) => e.id_estudiante === b.id_estudiante);
          const grupo = (porAsig.get(b.id_beca ?? -1) ?? [])
            .sort((x, y) => (x.periodo < y.periodo ? -1 : x.periodo > y.periodo ? 1 : x.id - y.id));
          const ultimo = grupo.length > 0 ? grupo[grupo.length - 1] : undefined;
          const ultimos2 = grupo.slice(-2).map((g) => g.estado);
          return {
            id_asignacion: b.id_beca ?? 0,
            estudiante: {
              id_estudiante: b.id_estudiante ?? 0,
              nombre: est?.nombre ?? "",
              apellido: est?.apellido ?? "",
              carrera: est?.carrera ?? "",
            },
            convocatoria: { id: 0, nombre: grupo[0]?.asignacion?.convocatoria?.nombre ?? "" },
            tipoBeca: { id: 0, nombre: b.tipo ?? b.nombre_beca ?? "" },
            total_periodos: grupo.length,
            ultimo_periodo: ultimo?.periodo ?? null,
            ultimo_promedio: ultimo?.promedio_periodo ?? null,
            estado: ultimo?.estado ?? "Sin registros",
            sugerencia_suspension: ultimos2.length === 2 && ultimos2.every((e) => e === "En riesgo"),
          };
        })
        .filter(
          (r) =>
            (!f.estado || r.estado === f.estado) &&
            (!f.carrera || r.estudiante.carrera === f.carrera),
        );
      return filas;
    }
    const p = new URLSearchParams();
    if (f.convocatoriaId) p.set("convocatoriaId", f.convocatoriaId);
    if (f.estado) p.set("estado", f.estado);
    if (f.carrera) p.set("carrera", f.carrera);
    const q = p.toString();
    return apiClient.get<BecarioSeguimiento[]>(`/seguimiento/becarios${q ? `?${q}` : ""}`);
  },

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
