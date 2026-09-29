import { API_BASE_URL, USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import { clasificarPuntaje } from "../../utils/dss";

export interface ResumenReportes {
  postulantes: number;
  evaluados: number;
  aprobados: number;
  rechazados: number;
  en_observacion: number;
  monto_asignado: number;
  presupuesto: number;
  por_carrera: Array<{ carrera: string; cantidad: number }>;
  por_tipo: Array<{ tipo: string; cantidad: number; monto: number }>;
  puntaje_promedio: number;
  en_riesgo: number;
}

/** Espejo local del resumen (D44); en modo real manda la API. */
function resumenMock(): ResumenReportes {
  const estudiantes = db.getAll("estudiantes");
  const evaluaciones = db.getAll("evaluaciones");
  const becas = db.getAll("becas");
  const porCarrera = new Map<string, number>();
  let suma = 0;
  let riesgo = 0;
  for (const ev of evaluaciones) {
    const est = estudiantes.find((e) => e.id_estudiante === ev.id_estudiante);
    const c = est?.carrera ?? "Sin carrera";
    porCarrera.set(c, (porCarrera.get(c) ?? 0) + 1);
    suma += ev.puntaje_final ?? 0;
    if (clasificarPuntaje(ev.puntaje_final ?? 0) === "En riesgo") riesgo += 1;
  }
  const porTipo = new Map<string, { cantidad: number; monto: number }>();
  for (const b of becas) {
    const t = b.tipo ?? "Sin tipo";
    const actual = porTipo.get(t) ?? { cantidad: 0, monto: 0 };
    porTipo.set(t, { cantidad: actual.cantidad + 1, monto: actual.monto + (b.monto ?? 0) });
  }
  return {
    postulantes: estudiantes.length,
    evaluados: new Set(evaluaciones.map((e) => e.id_estudiante)).size,
    aprobados: becas.filter((b) => b.estado === "Activa").length,
    rechazados: 0,
    en_observacion: 0,
    monto_asignado: becas.reduce((s, b) => s + (b.monto ?? 0), 0),
    presupuesto: 50000,
    por_carrera: [...porCarrera.entries()]
      .map(([carrera, cantidad]) => ({ carrera, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
    por_tipo: [...porTipo.entries()].map(([tipo, v]) => ({ tipo, ...v })),
    puntaje_promedio: evaluaciones.length === 0 ? 0 : Math.round((suma / evaluaciones.length) * 100) / 100,
    en_riesgo: riesgo,
  };
}

function descargar(nombre: string, contenido: Blob): void {
  const url = URL.createObjectURL(contenido);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export const reportesApi = {
  resumen: async (convocatoriaId?: string): Promise<ResumenReportes> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return resumenMock();
    }
    const q = convocatoriaId ? `?convocatoriaId=${convocatoriaId}` : "";
    return apiClient.get<ResumenReportes>(`/reportes/resumen${q}`);
  },

  rankingCsv: async (): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    const blob = await fetch(`${API_BASE_URL}/reportes/ranking.csv`).then((r) => {
      if (!r.ok) throw new Error("No se pudo descargar el CSV.");
      return r.blob();
    });
    descargar("ranking.csv", blob);
  },

  asignacionesCsv: async (): Promise<void> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return;
    }
    const blob = await fetch(`${API_BASE_URL}/reportes/asignaciones.csv`).then((r) => {
      if (!r.ok) throw new Error("No se pudo descargar el CSV.");
      return r.blob();
    });
    descargar("asignaciones.csv", blob);
  },
};
