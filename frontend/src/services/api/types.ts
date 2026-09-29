/**
 * Tipos basados en docs/api/openapi.yaml v1.0.0 (fuente del contrato).
 * Naming snake_case del contrato: no usar codigo/ingresoFamiliar/tipoBeca.
 * Regenerar con openapi-typescript cuando el YAML cambie (ver plan_frontend.md §4).
 */
import type { EstadoBeca, TipoBeca } from "../../models/domain";

export interface Estudiante {
  id_estudiante?: number;
  nombre?: string;
  apellido?: string;
  carrera?: string;
  promedio?: number;
  ingreso_familiar?: number;
}

export interface Evaluacion {
  id_evaluacion?: number;
  id_estudiante?: number;
  fecha?: string;
  puntaje_academico?: number;
  puntaje_social?: number;
  puntaje_final?: number;
}

export interface Resultado {
  id_resultado?: number;
  id_estudiante?: number;
  resultado?: string;
}

export interface Beca {
  id_beca?: number;
  id_estudiante?: number;
  nombre_beca?: string;
  tipo?: TipoBeca;
  monto?: number;
  estado?: EstadoBeca;
}

/** Respuesta paginada del backend (GET /estudiantes). */
export interface Pagina<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Filtros de la gestión (se envían al servidor o se emulan en mock). */
export interface FiltrosEstudiantes {
  q?: string;
  carrera?: string;
  estado?: string;
  orden?: "codigo" | "nombre" | "carrera" | "promedio" | "puntaje";
  dir?: "asc" | "desc";
  pagina?: number;
  porPagina?: number;
}

/** Evento del historial (GET /estudiantes/:id/historial o db local). */
export interface EventoHistorial {
  id_evento: number;
  fecha: string;
  tipo: string;
  detalle: string;
}

/** Usuario administrativo (sin login/JWT: siguiente fase, D28). */
export interface UsuarioRow {
  id_usuario: number;
  usuario: string;
  nombre: string;
  correo: string;
  rol: string;
  activo?: boolean;
  ultimo_acceso?: string | null;
}

/** Seguimiento académico por periodo (GET /api/seguimiento). */
export interface SeguimientoRow {
  id: number;
  id_asignacion: number;
  fecha: string;
  periodo: string;
  promedio_periodo: number;
  estado: string;
  observaciones?: string | null;
  asignacion?: {
    estudiante?: { nombre?: string; apellido?: string; carrera?: string };
    convocatoria?: { nombre?: string };
    tipoBeca?: { nombre?: string };
  };
}
