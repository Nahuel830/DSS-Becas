/**
 * Datos mock con la MISMA forma del contrato (docs/api/openapi.yaml).
 * Se usan cuando el backend aún no responde; al estar disponible,
 * dashboard.ts devuelve los datos reales y estos mocks dejan de usarse.
 */
import type { Beca, Estudiante, Evaluacion, Resultado } from "./types";

export const MOCK_ESTUDIANTES: Estudiante[] = [
  { id_estudiante: 1, nombre: "María", apellido: "Fernández", carrera: "Ing. Sistemas", promedio: 88.0, ingreso_familiar: 2500 },
  { id_estudiante: 2, nombre: "Jorge", apellido: "Quispe", carrera: "Medicina", promedio: 86.4, ingreso_familiar: 1800 },
  { id_estudiante: 3, nombre: "Ana", apellido: "Rojas", carrera: "Derecho", promedio: 81.0, ingreso_familiar: 3200 },
  { id_estudiante: 4, nombre: "Luis", apellido: "Mamani", carrera: "Contaduría", promedio: 76.5, ingreso_familiar: 4100 },
  { id_estudiante: 5, nombre: "Carla", apellido: "Vega", carrera: "Arquitectura", promedio: 62.0, ingreso_familiar: 5200 },
  // Completan gestion-estudiantes.png (Pedro evaluado 85.6, Sofía pendiente sin puntaje).
  { id_estudiante: 6, nombre: "Pedro", apellido: "Choque", carrera: "Ing. Civil", promedio: 84.2, ingreso_familiar: 2900 },
  { id_estudiante: 7, nombre: "Sofía", apellido: "Aguilar", carrera: "Psicología", promedio: 79.0, ingreso_familiar: 3600 },
];

export const MOCK_EVALUACIONES: Evaluacion[] = [
  { id_evaluacion: 1, id_estudiante: 1, fecha: "2025-08-01", puntaje_academico: 90.0, puntaje_social: 95.0, puntaje_final: 92.5 },
  { id_evaluacion: 2, id_estudiante: 2, fecha: "2025-08-01", puntaje_academico: 88.0, puntaje_social: 90.2, puntaje_final: 89.1 },
  { id_evaluacion: 3, id_estudiante: 3, fecha: "2025-08-02", puntaje_academico: 82.0, puntaje_social: 80.8, puntaje_final: 81.4 },
  { id_evaluacion: 4, id_estudiante: 4, fecha: "2025-08-02", puntaje_academico: 76.0, puntaje_social: 72.0, puntaje_final: 74.0 },
  { id_evaluacion: 5, id_estudiante: 5, fecha: "2025-08-03", puntaje_academico: 64.0, puntaje_social: 52.4, puntaje_final: 58.2 },
];

/** Agregados del mock dashboard-dss.png (sin endpoint de agregados en el YAML). */
export const MOCK_RESUMEN = {
  evaluados: 482,
  recomendados: 210,
  en_revision: 156,
  en_riesgo: 39,
} as const;

export const MOCK_ALERTAS: string[] = [
  "Baja de rendimiento: Carla Vega",
  "Documentación pendiente: 6 estudiantes",
  "Renovaciones por vencer: 12",
  "Nuevas solicitudes: 8",
];

/** Pedro (85.6) solo existe en gestion-estudiantes.png; el ranking del dashboard usa MOCK_EVALUACIONES. */
export const MOCK_EVALUACION_PEDRO: Evaluacion =
  { id_evaluacion: 6, id_estudiante: 6, fecha: "2025-08-03", puntaje_academico: 86.0, puntaje_social: 85.2, puntaje_final: 85.6 };

export const MOCK_EVALUACIONES_GESTION: Evaluacion[] = [...MOCK_EVALUACIONES, MOCK_EVALUACION_PEDRO];

/** Becas mock con forma del contrato (POST /becas). Sin endpoint GET: solo existen estos datos. */
export const MOCK_BECAS: Beca[] = [
  { id_beca: 1, id_estudiante: 1, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 500, estado: "Activa" },
  { id_beca: 2, id_estudiante: 2, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 500, estado: "Activa" },
  { id_beca: 3, id_estudiante: 6, nombre_beca: "Beca Social", tipo: "Social", monto: 350, estado: "Activa" },
];

/** Resultados mock con forma del contrato (GET /resultados/{id_estudiante}). */
export const MOCK_RESULTADOS: Resultado[] = [
  { id_resultado: 1, id_estudiante: 1, resultado: "Recomendado" },
  { id_resultado: 2, id_estudiante: 2, resultado: "Recomendado" },
  { id_resultado: 3, id_estudiante: 3, resultado: "En revisión" },
  { id_resultado: 4, id_estudiante: 4, resultado: "En revisión" },
  { id_resultado: 5, id_estudiante: 5, resultado: "En riesgo" },
  { id_resultado: 6, id_estudiante: 6, resultado: "Recomendado" },
];

/** Criterios por estudiante para detalle-estudiante.png. UI-only: sin endpoint en openapi.yaml. */
export interface CriteriosDetalle {
  rendimiento: number;
  asistencia: number;
  situacion: number;
  carga: number;
  vulnerable: number;
}

export const MOCK_CRITERIOS: Record<number, CriteriosDetalle> = {
  1: { rendimiento: 95, asistencia: 96, situacion: 93, carga: 85, vulnerable: 78 },
  2: { rendimiento: 90, asistencia: 94, situacion: 88, carga: 80, vulnerable: 75 },
  3: { rendimiento: 84, asistencia: 88, situacion: 80, carga: 72, vulnerable: 68 },
  4: { rendimiento: 78, asistencia: 82, situacion: 70, carga: 65, vulnerable: 60 },
  5: { rendimiento: 66, asistencia: 70, situacion: 55, carga: 50, vulnerable: 45 },
};

/** Historial de seguimiento para detalle-estudiante.png. UI-only: sin endpoint en openapi.yaml. */
export interface FilaHistorial {
  gestion: string;
  promedio: number;
  estado: string;
}

export const MOCK_HISTORIAL: Record<number, FilaHistorial[]> = {
  1: [
    { gestion: "2024-I", promedio: 85.0, estado: "Activa" },
    { gestion: "2024-II", promedio: 87.2, estado: "Activa" },
    { gestion: "2025-I", promedio: 88.0, estado: "Activa" },
  ],
};
