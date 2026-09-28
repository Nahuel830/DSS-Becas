import { z } from "zod";

const CI_RE = /^[0-9]+(-[0-9A-Za-z]{1,2})?$/;

function edadValida(fechaISO: string): boolean {
  const nac = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return false;
  const hoy = new Date();
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e -= 1;
  return e >= 16 && e <= 60;
}

/** Mismas reglas que el formulario (Módulo 6): CI/correo únicos (vía Prisma P2002). */
export const estudianteSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100, "Máximo 100 caracteres."),
  apellido: z.string().min(1, "Requerido.").max(100, "Máximo 100 caracteres."),
  ci: z.string().regex(CI_RE, "Formato inválido.").optional(),
  fecha_nacimiento: z
    .string()
    .refine((v) => v === undefined || v === "" || edadValida(v), "La edad debe estar entre 16 y 60 años.")
    .optional(),
  genero: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido.").optional().or(z.literal("")),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  carrera: z.string().min(1, "Requerida.").max(100, "Máximo 100 caracteres."),
  codigo_universitario: z.string().optional(),
  facultad: z.string().optional(),
  semestre: z.number().int().min(1).max(10).optional(),
  promedio: z.number().min(0, "Debe estar entre 0 y 100.").max(100, "Debe estar entre 0 y 100."),
  materias_aprobadas: z.number().int().min(0).optional(),
  materias_reprobadas: z.number().int().min(0).optional(),
  anio_ingreso: z.number().int().min(1980).max(new Date().getFullYear()).optional(),
  ingreso_familiar: z.number().min(0, "Debe ser mayor o igual a 0."),
  integrantes_hogar: z.number().int().min(1).optional(),
  dependientes: z.number().int().min(0).optional(),
  tipo_vivienda: z.string().optional(),
  procedencia: z.enum(["urbano", "rural"]).optional(),
  discapacidad: z.string().optional(),
  situacion_laboral: z.string().optional(),
  motivo: z.string().optional(),
});

export const criteriosSchema = z.object({
  rendimiento: z.number().min(0).max(100),
  asistencia: z.number().min(0).max(100),
  situacion: z.number().min(0).max(100),
  carga: z.number().min(0).max(100),
  vulnerable: z.number().min(0).max(100),
});

export const evaluacionSchema = z.object({
  id_estudiante: z.number().int().positive(),
  fecha: z.string().min(1, "Requerida."),
  puntaje_academico: z.number().min(0).max(100),
  puntaje_social: z.number().min(0).max(100),
  puntaje_final: z.number().min(0).max(100),
});

export const calcularSchema = z.object({
  id_estudiante: z.number().int().positive(),
  criterios: criteriosSchema,
  tipo_beca: z.enum(["Excelencia", "Social"]).optional(),
});

export const becaSchema = z.object({
  id_estudiante: z.number().int().positive(),
  nombre_beca: z.string().min(1, "Requerido."),
  tipo: z.enum(["Excelencia", "Social"]),
  monto: z.number().min(0),
  estado: z.enum(["Activa", "Inactiva"]),
});

export const carreraSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  facultad: z.string().max(100).optional(),
  activa: z.boolean().optional(),
});

export const tipoBecaSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  descripcion: z.string().optional(),
  monto: z.number().min(0, "Debe ser mayor o igual a 0."),
  cupos: z.number().int().min(1, "Debe ser al menos 1."),
  activa: z.boolean().optional(),
});

function refinarFechas(
  v: { inicio?: string; fin?: string },
  ctx: { addIssue: (p: { code: "custom"; path: string[]; message: string }) => void },
): void {
  // #5: fin posterior a inicio (solo cuando ambas fechas están presentes).
  if (v.inicio && v.fin && v.fin <= v.inicio) {
    ctx.addIssue({ code: "custom", path: ["fin"], message: "La fecha de fin debe ser posterior a la de inicio." });
  }
}

const convocatoriaBase = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  gestion: z.string().min(1, "Requerida."),
  inicio: z.string().optional(),
  fin: z.string().optional(),
  estado: z.enum(["Abierta", "Cerrada", "En curso"]).optional(),
  presupuesto: z.number().min(0).optional(),
});

export const convocatoriaSchema = convocatoriaBase.superRefine((v, ctx) => {
  refinarFechas(v, { addIssue: (p) => ctx.addIssue({ ...p, code: z.ZodIssueCode.custom }) });
});

export const convocatoriaParcialSchema = convocatoriaBase.partial().superRefine((v, ctx) => {
  refinarFechas(v, { addIssue: (p) => ctx.addIssue({ ...p, code: z.ZodIssueCode.custom }) });
});

export const pesosSchema = z.object({  pesos: z
    .array(z.object({ id: z.number().int().positive(), peso: z.number().min(0).max(100) }))
    .min(1, "Se requiere al menos un criterio."),
}).superRefine((v, ctx) => {
  // #4: los pesos activos deben sumar 100.
  const suma = v.pesos.reduce((s, p) => s + p.peso, 0);
  if (Math.abs(suma - 100) > 0.001) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pesos"], message: `Los pesos deben sumar 100 % (actual: ${suma} %).` });
  }
});

export const criterioSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  descripcion: z.string().optional(),
  peso: z.number().min(0, "Debe ser mayor o igual a 0.").max(100),
  tipo: z.enum(["beneficio", "costo"]).optional(),
  activo: z.boolean().optional(),
});

export const asignacionSchema = z.object({
  id_estudiante: z.number().int().positive(),
  id_convocatoria: z.number().int().positive(),
  id_tipo_beca: z.number().int().positive(),
  puntaje: z.number().min(0).max(100),
  estado: z.enum(["Aprobada", "En espera", "Rechazada", "En observación"]).optional(),
  observaciones: z.string().optional(),
});

export const generarSchema = z.object({
  convocatoriaId: z.number().int().positive(),
  tipoBecaId: z.number().int().positive(),
});

export const seguimientoSchema = z.object({
  id_asignacion: z.number().int().positive(),
  fecha: z.string().min(1, "Requerida."),
  periodo: z.string().min(1, "Requerido."),
  promedio_periodo: z.number().min(0, "Debe estar entre 0 y 100.").max(100, "Debe estar entre 0 y 100."),
  observaciones: z.string().optional(),
});
