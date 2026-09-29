/** Enums de dominio (espejo de SQL/diccionario + openapi.yaml Beca). */
import type { Estudiante } from "../services/api/types";
export const TIPO_BECA = ["Excelencia", "Social"] as const;
export type TipoBeca = (typeof TIPO_BECA)[number];

export const ESTADO_BECA = ["Activa", "Inactiva"] as const;
export type EstadoBeca = (typeof ESTADO_BECA)[number];

/** Estado DSS de un estudiante (prototipos + evaluacion-dss.png). */
export const ESTADO_ESTUDIANTE = ["Recomendado", "En revisión", "En riesgo", "Pendiente"] as const;
export type EstadoEstudiante = (typeof ESTADO_ESTUDIANTE)[number];

/**
 * Usuario administrativo (docs/database/modelo_entidad.puml).
 * Sin tabla en script_bd.sql ni endpoint: solo modela el dominio futuro.
 */
export interface Usuario {
  id_usuario?: number;
  nombre?: string;
  correo?: string;
  rol?: "operativo" | "estrategico" | "administrador";
}

/**
 * Criterio de evaluación DSS (docs/uml/clases.puml).
 * Sin tabla ni endpoint: los pesos viven como constantes en utils/dss.ts.
 */
export interface Criterio {
  nombre?: string;
  peso?: number;
  valor?: number;
}

/** Documento adjunto simulado (solo se guarda nombre y tamaño). */
export interface DocumentoAdjunto {
  nombre: string;
  tamanio: number;
}

/**
 * Estudiante extendido con campos del formulario (Módulo 6).
 * Solo existe en localStorage (D21): a la API viaja el subconjunto del contrato.
 */
export interface EstudianteExtendido extends Estudiante {
  ci?: string;
  fecha_nacimiento?: string;
  genero?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  ciudad?: string;
  codigo_universitario?: string;
  facultad?: string;
  semestre?: number;
  materias_aprobadas?: number;
  materias_reprobadas?: number;
  anio_ingreso?: number;
  integrantes_hogar?: number;
  dependientes?: number;
  tipo_vivienda?: string;
  procedencia?: "urbano" | "rural";
  discapacidad?: string;
  situacion_laboral?: string;
  motivo?: string;
  tipo_beca_solicitada?: string;
  fecha_solicitud?: string;
  documentos?: DocumentoAdjunto[];
}
