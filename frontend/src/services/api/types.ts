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
