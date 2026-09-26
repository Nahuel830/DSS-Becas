import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";

export interface Carrera {
  id: number;
  nombre: string;
  facultad?: string | null;
  activa?: boolean;
}

export interface TipoBecaRow {
  id: number;
  nombre: string;
  descripcion?: string | null;
  monto: number;
  cupos: number;
  activa?: boolean;
}

export interface Convocatoria {
  id: number;
  nombre: string;
  gestion: string;
  inicio?: string | null;
  fin?: string | null;
  estado?: string;
  presupuesto?: number;
}

export interface CriterioRow {
  id: number;
  nombre: string;
  descripcion?: string | null;
  peso: number;
  tipo?: string;
  activo?: boolean;
}

async function mockLista<T>(datos: T[]): Promise<T[]> {
  await simularRetardo();
  return datos;
}

/** Carreras distintas de la db local (modo mock; en real: GET /api/carreras). */
async function carrerasNombres(): Promise<string[]> {
  if (USE_MOCKS) {
    await simularRetardo();
    const set = new Set<string>();
    for (const e of db.getAll("estudiantes")) if (e.carrera) set.add(e.carrera);
    return [...set].sort();
  }
  const filas = await apiClient.get<Carrera[]>("/carreras");
  return filas.filter((c) => c.activa !== false).map((c) => c.nombre);
}

export const catalogosApi = {
  carreras: carrerasNombres,

  carrerasCrud: {
    listar: async (): Promise<Carrera[]> => {
      if (USE_MOCKS) {
        const nombres = await carrerasNombres();
        return nombres.map((nombre, i) => ({ id: i + 1, nombre, activa: true }));
      }
      return apiClient.get<Carrera[]>("/carreras");
    },
    crear: (d: Partial<Carrera>) => apiClient.post<Carrera>("/carreras", d),
    actualizar: (id: number, d: Partial<Carrera>) => apiClient.put<Carrera>(`/carreras/${id}`, d),
    eliminar: (id: number) => apiClient.del<unknown>(`/carreras/${id}`),
  },

  tiposBeca: {
    listar: async (): Promise<TipoBecaRow[]> => {
      if (USE_MOCKS) return mockLista(dbTiposBeca());
      return apiClient.get<TipoBecaRow[]>("/tipos-beca");
    },
    crear: (d: Partial<TipoBecaRow>) => apiClient.post<TipoBecaRow>("/tipos-beca", d),
    actualizar: (id: number, d: Partial<TipoBecaRow>) => apiClient.put<TipoBecaRow>(`/tipos-beca/${id}`, d),
    eliminar: (id: number) => apiClient.del<unknown>(`/tipos-beca/${id}`),
  },

  convocatorias: {
    listar: async (): Promise<Convocatoria[]> => {
      if (USE_MOCKS) return mockLista(dbConvocatorias());
      return apiClient.get<Convocatoria[]>("/convocatorias");
    },
    crear: (d: Partial<Convocatoria>) => apiClient.post<Convocatoria>("/convocatorias", d),
    actualizar: (id: number, d: Partial<Convocatoria>) => apiClient.put<Convocatoria>(`/convocatorias/${id}`, d),
    eliminar: (id: number) => apiClient.del<unknown>(`/convocatorias/${id}`),
  },

  criterios: {
    listar: async (): Promise<CriterioRow[]> => {
      if (USE_MOCKS) return mockLista(dbCriterios());
      return apiClient.get<CriterioRow[]>("/criterios");
    },
    crear: (d: Partial<CriterioRow>) => apiClient.post<CriterioRow>("/criterios", d),
    actualizar: (id: number, d: Partial<CriterioRow>) => apiClient.put<CriterioRow>(`/criterios/${id}`, d),
    eliminar: (id: number) => apiClient.del<unknown>(`/criterios/${id}`),
  },
};

function dbTiposBeca(): TipoBecaRow[] {
  return [
    { id: 1, nombre: "Excelencia", descripcion: "Rendimiento académico destacado", monto: 600, cupos: 20, activa: true },
    { id: 2, nombre: "Social", descripcion: "Apoyo socioeconómico", monto: 400, cupos: 30, activa: true },
  ];
}

function dbConvocatorias(): Convocatoria[] {
  return [
    { id: 1, nombre: "Convocatoria Becas 2025-I", gestion: "2025-I", inicio: "2025-07-01", fin: "2025-09-30", estado: "Abierta", presupuesto: 50000 },
  ];
}

function dbCriterios(): CriterioRow[] {
  return [
    { id: 1, nombre: "Rendimiento académico", descripcion: "Promedio ponderado", peso: 30, tipo: "beneficio", activo: true },
    { id: 2, nombre: "Asistencia", descripcion: "Porcentaje de asistencia", peso: 15, tipo: "beneficio", activo: true },
    { id: 3, nombre: "Situación socioeconómica", descripcion: "Ingreso familiar", peso: 25, tipo: "costo", activo: true },
    { id: 4, nombre: "Carga familiar", descripcion: "Dependientes del hogar", peso: 15, tipo: "beneficio", activo: true },
    { id: 5, nombre: "Condición vulnerable", descripcion: "Vulnerabilidad acreditada", peso: 15, tipo: "beneficio", activo: true },
  ];
}
