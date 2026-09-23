/** Enums de dominio (espejo de SQL/diccionario + openapi.yaml Beca). */
export const TIPO_BECA = ["Excelencia", "Social"] as const;
export type TipoBeca = (typeof TIPO_BECA)[number];

export const ESTADO_BECA = ["Activa", "Inactiva"] as const;
export type EstadoBeca = (typeof ESTADO_BECA)[number];

/** Estado DSS de un estudiante (prototipos + evaluacion-dss.png). */
export const ESTADO_ESTUDIANTE = ["Recomendado", "En revisión", "En riesgo", "Pendiente"] as const;
export type EstadoEstudiante = (typeof ESTADO_ESTUDIANTE)[number];
