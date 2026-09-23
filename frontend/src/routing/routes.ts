/** Rutas 1:1 con prototypes/ + diagrama-navegacion.png (ver plan §3). */
export const ROUTES = {
  dashboard: "/dashboard",
  estudiantes: "/estudiantes",
  nuevoEstudiante: "/estudiantes/nuevo",
  detalleEstudiante: (id: number | string = ":idEstudiante") => `/estudiantes/${id}`,
  nuevaEvaluacion: "/evaluaciones/nueva",
  becas: "/becas",
  seguimiento: "/seguimiento",
  reportes: "/reportes",
  administracion: "/administracion",
} as const;
