/** Rutas 1:1 con prototypes/ + diagrama-navegacion.png (ver plan §3). */
export const ROUTES = {
  dashboard: "/dashboard",
  estudiantes: "/estudiantes",
  nuevoEstudiante: "/estudiantes/nuevo",
  detalleEstudiante: (id: number | string = ":idEstudiante") => `/estudiantes/${id}`,
  editarEstudiante: (id: number | string = ":idEstudiante") => `/estudiantes/${id}/editar`,
  nuevaEvaluacion: "/evaluaciones/nueva",
  evaluacionPorId: (id: number | string = ":idEstudiante") => `/evaluacion/${id}`,
  becas: "/becas",
  seguimiento: "/seguimiento",
  configuracion: "/configuracion",
  reportes: "/reportes",
  administracion: "/administracion",
} as const;
