/**
 * Datos mock con la MISMA forma del contrato (docs/api/openapi.yaml).
 * Con VITE_USE_MOCKS=true los servicios devuelven estos datos con retardo
 * simulado; con false llaman a la API real. 30 estudiantes coherentes
 * (universidad boliviana) con evaluaciones, resultados y becas.
 */
import { clasificarPuntaje } from "../../utils/dss";
import type { Beca, Estudiante, Evaluacion, Resultado, SeguimientoRow, UsuarioRow } from "./types";

function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const MOCK_ESTUDIANTES: Estudiante[] = [
  { id_estudiante: 1, nombre: "María", apellido: "Fernández", carrera: "Ing. Sistemas", promedio: 88.0, ingreso_familiar: 2500 },
  { id_estudiante: 2, nombre: "Jorge", apellido: "Quispe", carrera: "Medicina", promedio: 86.4, ingreso_familiar: 1800 },
  { id_estudiante: 3, nombre: "Ana", apellido: "Rojas", carrera: "Derecho", promedio: 81.0, ingreso_familiar: 3200 },
  { id_estudiante: 4, nombre: "Luis", apellido: "Mamani", carrera: "Contaduría", promedio: 76.5, ingreso_familiar: 4100 },
  { id_estudiante: 5, nombre: "Carla", apellido: "Vega", carrera: "Arquitectura", promedio: 62.0, ingreso_familiar: 5200 },
  { id_estudiante: 6, nombre: "Pedro", apellido: "Choque", carrera: "Ing. Civil", promedio: 84.2, ingreso_familiar: 2900 },
  { id_estudiante: 7, nombre: "Sofía", apellido: "Aguilar", carrera: "Psicología", promedio: 79.0, ingreso_familiar: 3600 },
  { id_estudiante: 8, nombre: "Diego", apellido: "Condori", carrera: "Ing. Sistemas", promedio: 85.1, ingreso_familiar: 2200 },
  { id_estudiante: 9, nombre: "Lucía", apellido: "Huanca", carrera: "Medicina", promedio: 78.3, ingreso_familiar: 3500 },
  { id_estudiante: 10, nombre: "Marco", apellido: "Apaza", carrera: "Derecho", promedio: 90.2, ingreso_familiar: 1500 },
  { id_estudiante: 11, nombre: "Elena", apellido: "Flores", carrera: "Contaduría", promedio: 77.8, ingreso_familiar: 3900 },
  { id_estudiante: 12, nombre: "Raúl", apellido: "Ticona", carrera: "Arquitectura", promedio: 58.9, ingreso_familiar: 4800 },
  { id_estudiante: 13, nombre: "Carmen", apellido: "Poma", carrera: "Ing. Civil", promedio: 83.5, ingreso_familiar: 2700 },
  { id_estudiante: 14, nombre: "David", apellido: "Limachi", carrera: "Psicología", promedio: 72.4, ingreso_familiar: 3300 },
  { id_estudiante: 15, nombre: "Paola", apellido: "Vargas", carrera: "Enfermería", promedio: 86.9, ingreso_familiar: 2100 },
  { id_estudiante: 16, nombre: "Andrés", apellido: "Ríos", carrera: "Economía", promedio: 89.5, ingreso_familiar: 1900 },
  { id_estudiante: 17, nombre: "Gabriela", apellido: "Salazar", carrera: "Medicina", promedio: 81.2, ingreso_familiar: 3000 },
  { id_estudiante: 18, nombre: "Hugo", apellido: "Copa", carrera: "Agronomía", promedio: 75.0, ingreso_familiar: 4200 },
  { id_estudiante: 19, nombre: "Daniela", apellido: "Miranda", carrera: "Ing. Sistemas", promedio: 84.0, ingreso_familiar: 2400 },
  { id_estudiante: 20, nombre: "Sergio", apellido: "Siles", carrera: "Derecho", promedio: 69.8, ingreso_familiar: 4400 },
  { id_estudiante: 21, nombre: "Natalia", apellido: "Ortiz", carrera: "Contaduría", promedio: 85.7, ingreso_familiar: 2600 },
  { id_estudiante: 22, nombre: "Pablo", apellido: "Ramos", carrera: "Arquitectura", promedio: 77.1, ingreso_familiar: 3700 },
  { id_estudiante: 23, nombre: "Verónica", apellido: "Castro", carrera: "Psicología", promedio: 60.5, ingreso_familiar: 5000 },
  { id_estudiante: 24, nombre: "Martín", apellido: "Paredes", carrera: "Ing. Civil", promedio: 82.9, ingreso_familiar: 2800 },
  { id_estudiante: 25, nombre: "Camila", apellido: "Villca", carrera: "Enfermería", promedio: 74.6, ingreso_familiar: 3400 },
  { id_estudiante: 26, nombre: "Rodrigo", apellido: "Yujra", carrera: "Economía", promedio: 79.8, ingreso_familiar: 3100 },
  { id_estudiante: 27, nombre: "Fernanda", apellido: "Calle", carrera: "Medicina", promedio: 88.8, ingreso_familiar: 2000 },
  { id_estudiante: 28, nombre: "Gonzalo", apellido: "Pérez", carrera: "Derecho", promedio: 73.2, ingreso_familiar: 3800 },
  { id_estudiante: 29, nombre: "Alejandra", apellido: "Gonzales", carrera: "Arquitectura", promedio: 61.4, ingreso_familiar: 4600 },
  { id_estudiante: 30, nombre: "Beatriz", apellido: "Mamani", carrera: "Psicología", promedio: 80.9, ingreso_familiar: 2900 },
];

/** [id_estudiante, puntaje_final, fecha] de los evaluados extra (7, 17 y 26 pendientes). */
const FINALES_EXTRA: Array<[number, number, string]> = [
  [6, 85.6, "2025-08-03"],
  [8, 88.3, "2025-08-03"], [9, 71.2, "2025-08-04"], [10, 91.0, "2025-08-04"],
  [11, 78.5, "2025-08-04"], [12, 52.6, "2025-08-05"], [13, 84.5, "2025-08-05"],
  [14, 68.9, "2025-08-05"], [15, 87.2, "2025-08-06"], [16, 90.4, "2025-08-06"],
  [18, 76.3, "2025-08-06"], [19, 82.8, "2025-08-07"], [20, 63.4, "2025-08-07"],
  [21, 86.1, "2025-08-07"], [22, 79.1, "2025-08-08"], [23, 47.3, "2025-08-08"],
  [24, 83.7, "2025-08-08"], [25, 66.7, "2025-08-09"], [27, 89.9, "2025-08-09"],
  [28, 72.0, "2025-08-09"], [29, 59.8, "2025-08-10"], [30, 80.5, "2025-08-10"],
];

function evaluacionExtra(idEvaluacion: number, idEstudiante: number, final: number, fecha: string): Evaluacion {
  const deltaAc = ((idEstudiante * 7) % 5) - 2;
  const deltaSo = ((idEstudiante * 3) % 5) - 2;
  return {
    id_evaluacion: idEvaluacion,
    id_estudiante: idEstudiante,
    fecha,
    puntaje_academico: redondear1(final + deltaAc),
    puntaje_social: redondear1(final + deltaSo),
    puntaje_final: final,
  };
}

export const MOCK_EVALUACIONES: Evaluacion[] = [
  { id_evaluacion: 1, id_estudiante: 1, fecha: "2025-08-01", puntaje_academico: 90.0, puntaje_social: 95.0, puntaje_final: 92.5 },
  { id_evaluacion: 2, id_estudiante: 2, fecha: "2025-08-01", puntaje_academico: 88.0, puntaje_social: 90.2, puntaje_final: 89.1 },
  { id_evaluacion: 3, id_estudiante: 3, fecha: "2025-08-02", puntaje_academico: 82.0, puntaje_social: 80.8, puntaje_final: 81.4 },
  { id_evaluacion: 4, id_estudiante: 4, fecha: "2025-08-02", puntaje_academico: 76.0, puntaje_social: 72.0, puntaje_final: 74.0 },
  { id_evaluacion: 5, id_estudiante: 5, fecha: "2025-08-03", puntaje_academico: 64.0, puntaje_social: 52.4, puntaje_final: 58.2 },
  ...FINALES_EXTRA.map(([id, final, fecha], i) => evaluacionExtra(6 + i, id, final, fecha)),
];

/** Resultados derivados por umbral (ver D16: 81.4 → Recomendado por regla ≥80). */
export const MOCK_RESULTADOS: Resultado[] = MOCK_EVALUACIONES.map((ev, i) => ({
  id_resultado: i + 1,
  id_estudiante: ev.id_estudiante,
  resultado: clasificarPuntaje(ev.puntaje_final ?? 0),
}));

/** Becas mock con forma del contrato (POST /becas). Sin endpoint GET: solo existen estos datos. */
export const MOCK_BECAS: Beca[] = [
  { id_beca: 1, id_estudiante: 1, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 500, estado: "Activa" },
  { id_beca: 2, id_estudiante: 2, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 500, estado: "Activa" },
  { id_beca: 3, id_estudiante: 6, nombre_beca: "Beca Social", tipo: "Social", monto: 350, estado: "Activa" },
  { id_beca: 4, id_estudiante: 8, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 600, estado: "Activa" },
  { id_beca: 5, id_estudiante: 10, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 600, estado: "Activa" },
  { id_beca: 6, id_estudiante: 15, nombre_beca: "Beca Social", tipo: "Social", monto: 400, estado: "Activa" },
  { id_beca: 7, id_estudiante: 21, nombre_beca: "Beca Excelencia", tipo: "Excelencia", monto: 600, estado: "Activa" },
];

/** Criterios por estudiante para detalle-estudiante.png. UI-only: sin endpoint en openapi.yaml. */
export interface CriteriosDetalle {
  rendimiento: number;
  asistencia: number;
  situacion: number;
  carga: number;
  vulnerable: number;
}

const CRITERIOS_BASE: Record<number, CriteriosDetalle> = {
  1: { rendimiento: 95, asistencia: 96, situacion: 93, carga: 85, vulnerable: 78 },
  2: { rendimiento: 90, asistencia: 94, situacion: 88, carga: 80, vulnerable: 75 },
  3: { rendimiento: 84, asistencia: 88, situacion: 80, carga: 72, vulnerable: 68 },
  4: { rendimiento: 78, asistencia: 82, situacion: 70, carga: 65, vulnerable: 60 },
  5: { rendimiento: 66, asistencia: 70, situacion: 55, carga: 50, vulnerable: 45 },
};

function criteriosPara(final: number, asistencia: number): CriteriosDetalle {
  const v = (d: number) => Math.max(0, Math.min(100, Math.round(final + d)));
  return { rendimiento: v(2), asistencia, situacion: v(-1), carga: v(-6), vulnerable: v(-10) };
}

export const MOCK_CRITERIOS: Record<number, CriteriosDetalle> = { ...CRITERIOS_BASE };
for (const [id, final] of FINALES_EXTRA) {
  MOCK_CRITERIOS[id] = criteriosPara(final, 90 + ((id * 13) % 9));
}

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
  2: [
    { gestion: "2024-I", promedio: 83.5, estado: "Activa" },
    { gestion: "2024-II", promedio: 85.0, estado: "Activa" },
    { gestion: "2025-I", promedio: 86.4, estado: "Activa" },
  ],
};

export const MOCK_ALERTAS: string[] = [
  "Baja de rendimiento: Carla Vega",
  "Documentación pendiente: 6 estudiantes",
  "Renovaciones por vencer: 12",
  "Nuevas solicitudes: 8",
  "Promedio en descenso: Raúl Ticona",
  "Renovación próxima: Beca Social de Paola Vargas",
];

/** Usuarios semilla (sin login/JWT: siguiente fase, D28). */
export const MOCK_USUARIOS: UsuarioRow[] = [
  { id_usuario: 1, nombre: "Admin Bienestar", correo: "admin@universidad.bo", rol: "Administrador", activo: true },
  { id_usuario: 2, nombre: "Evaluador DSS", correo: "evaluador@universidad.bo", rol: "Evaluador", activo: true },
  { id_usuario: 3, nombre: "Consulta Rectorado", correo: "consulta@universidad.bo", rol: "Consulta", activo: true },
];

/** Seguimiento mock (periodos de María Fernández, becaria Excelencia). */
export const MOCK_SEGUIMIENTOS: SeguimientoRow[] = [
  {
    id: 1, id_asignacion: 1, fecha: "2025-02-10", periodo: "2024-II", promedio_periodo: 86.0,
    estado: "Al día",
    asignacion: {
      estudiante: { nombre: "María", apellido: "Fernández", carrera: "Ing. Sistemas" },
      convocatoria: { nombre: "Convocatoria Becas 2025-I" },
      tipoBeca: { nombre: "Excelencia" },
    },
  },
  {
    id: 2, id_asignacion: 1, fecha: "2025-08-10", periodo: "2025-I", promedio_periodo: 88.0,
    estado: "Al día",
    asignacion: {
      estudiante: { nombre: "María", apellido: "Fernández", carrera: "Ing. Sistemas" },
      convocatoria: { nombre: "Convocatoria Becas 2025-I" },
      tipoBeca: { nombre: "Excelencia" },
    },
  },
];
