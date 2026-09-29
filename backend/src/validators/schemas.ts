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

/** Vacío ("", "Seleccionar...", nulos) → undefined. Nunca NaN ni "" a Prisma. */
function aVacio(v: unknown): unknown {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" || t === "Seleccionar..." ? undefined : t;
}

/**
 * Decimal flexible: acepta "1499,99" y "1.499,99" como 1499.99.
 * "" → undefined; números pasan; lo demás queda para que zod dé 400.
 */
function aDecimal(v: unknown): unknown {
  const base = aVacio(v);
  if (base === undefined || typeof base === "number") return base;
  if (typeof base !== "string") return base;
  const t = base.includes(",") ? base.replace(/\./g, "").replace(",", ".") : base;
  const n = Number(t);
  return Number.isFinite(n) ? n : base;
}

const optStr = (schema: z.ZodString = z.string()): z.ZodType<string | undefined> =>
  z.preprocess(aVacio, schema.optional()) as z.ZodType<string | undefined>;

const numFlex = (schema: z.ZodNumber): z.ZodType<number | undefined> =>
  z.preprocess(aDecimal, schema) as z.ZodType<number | undefined>;

const optNumFlex = (schema: z.ZodNumber): z.ZodType<number | undefined> =>
  z.preprocess(aDecimal, schema.optional()) as z.ZodType<number | undefined>;

/** Mismas reglas que el formulario (Módulo 6): CI/correo únicos (vía Prisma P2002). */
export const estudianteSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100, "Máximo 100 caracteres."),
  apellido: z.string().min(1, "Requerido.").max(100, "Máximo 100 caracteres."),
  ci: z.preprocess(aVacio, z.string().regex(CI_RE, "Formato inválido.").optional()) as z.ZodType<string | undefined>,
  fecha_nacimiento: z
    .preprocess(aVacio, z.string().refine((v) => v === undefined || edadValida(v), "La edad debe estar entre 16 y 60 años.").optional()) as z.ZodType<string | undefined>,
  genero: optStr(),
  telefono: optStr(),
  correo: z.preprocess(aVacio, z.string().email("Correo inválido.").optional()) as z.ZodType<string | undefined>,
  direccion: optStr(),
  ciudad: optStr(),
  carrera: z.string().min(1, "Requerida.").max(100, "Máximo 100 caracteres."),
  codigo_universitario: optStr(),
  facultad: optStr(),
  semestre: optNumFlex(z.number().int().min(1, "Debe estar entre 1 y 10.").max(10, "Debe estar entre 1 y 10.")),
  promedio: numFlex(z.number().min(0, "Debe estar entre 0 y 100.").max(100, "Debe estar entre 0 y 100.")),
  materias_aprobadas: optNumFlex(z.number().int().min(0)),
  materias_reprobadas: optNumFlex(z.number().int().min(0)),
  anio_ingreso: optNumFlex(z.number().int().min(1980).max(new Date().getFullYear())),
  ingreso_familiar: numFlex(z.number().min(0, "Debe ser mayor o igual a 0.")),
  integrantes_hogar: optNumFlex(z.number().int().min(1)),
  dependientes: optNumFlex(z.number().int().min(0)),
  tipo_vivienda: optStr(),
  procedencia: z.preprocess(aVacio, z.enum(["urbano", "rural"]).optional()) as z.ZodType<"urbano" | "rural" | undefined>,
  discapacidad: optStr(),
  situacion_laboral: optStr(),
  motivo: optStr(),
  tipo_beca_solicitada: optStr(),
  fecha_solicitud: optStr(),
});

export const criteriosSchema = z.object({
  rendimiento: numFlex(z.number().min(0).max(100)),
  asistencia: numFlex(z.number().min(0).max(100)),
  situacion: numFlex(z.number().min(0).max(100)),
  carga: numFlex(z.number().min(0).max(100)),
  vulnerable: numFlex(z.number().min(0).max(100)),
});

export const evaluacionSchema = z.object({
  id_estudiante: z.number().int().positive(),
  fecha: z.string().min(1, "Requerida."),
  puntaje_academico: numFlex(z.number().min(0).max(100)),
  puntaje_social: numFlex(z.number().min(0).max(100)),
  puntaje_final: numFlex(z.number().min(0).max(100)),
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
  monto: numFlex(z.number().min(0, "Debe ser mayor o igual a 0.")),
  estado: z.enum(["Activa", "Inactiva"]),
});

export const carreraSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  facultad: optStr(),
  activa: z.boolean().optional(),
});

export const tipoBecaSchema = z.object({
  nombre: z.string().min(1, "Requerido.").max(100),
  descripcion: optStr(),
  monto: numFlex(z.number().min(0, "Debe ser mayor o igual a 0.")),
  cupos: z.preprocess(aDecimal, z.number().int().min(1, "Debe ser al menos 1.")) as z.ZodType<number | undefined>,
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
  inicio: optStr(),
  fin: optStr(),
  estado: z.enum(["Abierta", "Cerrada", "En curso"]).optional(),
  presupuesto: optNumFlex(z.number().min(0)),
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
  descripcion: optStr(),
  peso: numFlex(z.number().min(0, "Debe ser mayor o igual a 0.").max(100)),
  tipo: z.enum(["beneficio", "costo"]).optional(),
  activo: z.boolean().optional(),
});

export const asignacionSchema = z.object({
  id_estudiante: z.number().int().positive(),
  id_convocatoria: z.number().int().positive(),
  id_tipo_beca: z.number().int().positive(),
  puntaje: numFlex(z.number().min(0).max(100)),
  estado: z.enum(["Aprobada", "En espera", "Rechazada", "En observación"]).optional(),
  observaciones: optStr(),
});

export const generarSchema = z.object({
  convocatoriaId: z.number().int().positive(),
  tipoBecaId: z.number().int().positive(),
});

export const seguimientoSchema = z.object({
  id_asignacion: z.number().int().positive(),
  fecha: z.string().min(1, "Requerida."),
  periodo: z.string().min(1, "Requerido."),
  promedio_periodo: numFlex(z.number().min(0, "Debe estar entre 0 y 100.").max(100, "Debe estar entre 0 y 100.")),
  observaciones: optStr(),
});
