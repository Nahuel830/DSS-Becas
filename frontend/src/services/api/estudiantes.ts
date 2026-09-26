import type { EstudianteExtendido } from "../../models/domain";
import { clasificarPuntaje, nombreCompleto } from "../../utils/dss";
import { USE_MOCKS, apiClient, simularRetardo } from "./client";
import { db } from "./db";
import type { Estudiante, FiltrosEstudiantes, Pagina } from "./types";

/** Fila de gestión: estudiante + puntaje y estado derivados. */
export interface EstudianteListado extends EstudianteExtendido {
  puntaje_final: number | null;
  estado_beca: string;
}

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

/** Emula el listado del servidor sobre la db local (misma forma de respuesta). */
function listarMock(f: FiltrosEstudiantes): Pagina<EstudianteListado> {
  const texto = (f.q ?? "").trim().toLowerCase();
  const evaluaciones = db.getAll("evaluaciones");
  const becasActivas = new Set(
    db.getAll("becas").filter((b) => b.estado === "Activa").map((b) => b.id_estudiante),
  );
  let filas: EstudianteListado[] = db.getAll("estudiantes").map((e) => {
    const id = e.id_estudiante ?? 0;
    const puntaje = evaluaciones.find((ev) => ev.id_estudiante === id)?.puntaje_final ?? null;
    return {
      ...e,
      puntaje_final: puntaje,
      estado_beca: becasActivas.has(id) ? "Activa" : puntaje !== null ? clasificarPuntaje(puntaje) : "Pendiente",
    };
  });
  if (texto) {
    filas = filas.filter((r) =>
      `${r.id_estudiante} ${r.nombre} ${r.apellido} ${r.carrera} ${r.ci ?? ""}`.toLowerCase().includes(texto),
    );
  }
  if (f.carrera) filas = filas.filter((r) => r.carrera === f.carrera);
  if (f.estado) filas = filas.filter((r) => r.estado_beca === f.estado);
  const clave: Record<string, (r: EstudianteListado) => string | number> = {
    codigo: (r) => r.id_estudiante ?? 0,
    nombre: (r) => nombreCompleto(r),
    carrera: (r) => r.carrera ?? "",
    promedio: (r) => r.promedio ?? 0,
    puntaje: (r) => r.puntaje_final ?? -1,
  };
  const get = clave[f.orden ?? "codigo"] ?? clave.codigo;
  const dir = f.dir === "desc" ? -1 : 1;
  filas.sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    const cmp =
      typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
    return cmp * dir;
  });
  const porPagina = [10, 20, 50].includes(f.porPagina ?? 10) ? (f.porPagina ?? 10) : 10;
  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const pagina = Math.min(Math.max(1, f.pagina ?? 1), totalPaginas);
  return { data: filas.slice((pagina - 1) * porPagina, pagina * porPagina), total: filas.length, page: pagina, pageSize: porPagina };
}

export const estudiantesApi = {
  /** GET /estudiantes (db local con VITE_USE_MOCKS=true). */
  list: async (): Promise<EstudianteExtendido[]> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.getAll("estudiantes");
    }
    const pagina = await apiClient.get<Pagina<EstudianteExtendido>>("/estudiantes?page=1&pageSize=50");
    return pagina.data;
  },

  /** GET /estudiantes con búsqueda, filtros, orden y paginación del servidor. */
  listar: async (f: FiltrosEstudiantes): Promise<Pagina<EstudianteListado>> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return listarMock(f);
    }
    const p = new URLSearchParams();
    if (f.q?.trim()) p.set("q", f.q.trim());
    if (f.carrera) p.set("carrera", f.carrera);
    if (f.estado) p.set("estado", f.estado);
    p.set("orden", f.orden ?? "codigo");
    p.set("dir", f.dir ?? "asc");
    p.set("page", String(f.pagina ?? 1));
    p.set("pageSize", String(f.porPagina ?? 10));
    return apiClient.get<Pagina<EstudianteListado>>(`/estudiantes?${p.toString()}`);
  },

  getById: async (id: number): Promise<EstudianteExtendido | undefined> => {
    if (USE_MOCKS) {
      await simularRetardo();
      return db.getById("estudiantes", id);
    }
    try {
      return await apiClient.get<EstudianteExtendido>(`/estudiantes/${id}`);
    } catch {
      return undefined;
    }
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
    return apiClient.post<EstudianteExtendido>("/estudiantes", aContrato(data));
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
