/** Enums de dominio (espejo de SQL/diccionario + openapi.yaml Beca). */
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
