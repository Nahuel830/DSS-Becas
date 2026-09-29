// Seed inicial: mismos datos que frontend/src/services/api/mocks.ts.
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { recomendar } from "./dss/criterios";

const prisma = new PrismaClient();

const redondear1 = (n: number): number => Math.round(n * 10) / 10;

// [nombre, apellido, carrera, promedio, ingreso]
const ESTUDIANTES: Array<[string, string, string, number, number]> = [
  ["María", "Fernández", "Ing. Sistemas", 88.0, 2500],
  ["Jorge", "Quispe", "Medicina", 86.4, 1800],
  ["Ana", "Rojas", "Derecho", 81.0, 3200],
  ["Luis", "Mamani", "Contaduría", 76.5, 4100],
  ["Carla", "Vega", "Arquitectura", 62.0, 5200],
  ["Pedro", "Choque", "Ing. Civil", 84.2, 2900],
  ["Sofía", "Aguilar", "Psicología", 79.0, 3600],
  ["Diego", "Condori", "Ing. Sistemas", 85.1, 2200],
  ["Lucía", "Huanca", "Medicina", 78.3, 3500],
  ["Marco", "Apaza", "Derecho", 90.2, 1500],
  ["Elena", "Flores", "Contaduría", 77.8, 3900],
  ["Raúl", "Ticona", "Arquitectura", 58.9, 4800],
  ["Carmen", "Poma", "Ing. Civil", 83.5, 2700],
  ["David", "Limachi", "Psicología", 72.4, 3300],
  ["Paola", "Vargas", "Enfermería", 86.9, 2100],
  ["Andrés", "Ríos", "Economía", 89.5, 1900],
  ["Gabriela", "Salazar", "Medicina", 81.2, 3000],
  ["Hugo", "Copa", "Agronomía", 75.0, 4200],
  ["Daniela", "Miranda", "Ing. Sistemas", 84.0, 2400],
  ["Sergio", "Siles", "Derecho", 69.8, 4400],
  ["Natalia", "Ortiz", "Contaduría", 85.7, 2600],
  ["Pablo", "Ramos", "Arquitectura", 77.1, 3700],
  ["Verónica", "Castro", "Psicología", 60.5, 5000],
  ["Martín", "Paredes", "Ing. Civil", 82.9, 2800],
  ["Camila", "Villca", "Enfermería", 74.6, 3400],
  ["Rodrigo", "Yujra", "Economía", 79.8, 3100],
  ["Fernanda", "Calle", "Medicina", 88.8, 2000],
  ["Gonzalo", "Pérez", "Derecho", 73.2, 3800],
  ["Alejandra", "Gonzales", "Arquitectura", 61.4, 4600],
  ["Beatriz", "Mamani", "Psicología", 80.9, 2900],
];

// [id_estudiante, puntaje_final, fecha] (7, 17 y 26 pendientes)
const FINALES: Array<[number, number, string]> = [
  [1, 92.5, "2025-08-01"], [2, 89.1, "2025-08-01"], [3, 81.4, "2025-08-02"],
  [4, 74.0, "2025-08-02"], [5, 58.2, "2025-08-03"], [6, 85.6, "2025-08-03"],
  [8, 88.3, "2025-08-03"], [9, 71.2, "2025-08-04"], [10, 91.0, "2025-08-04"],
  [11, 78.5, "2025-08-04"], [12, 52.6, "2025-08-05"], [13, 84.5, "2025-08-05"],
  [14, 68.9, "2025-08-05"], [15, 87.2, "2025-08-06"], [16, 90.4, "2025-08-06"],
  [18, 76.3, "2025-08-06"], [19, 82.8, "2025-08-07"], [20, 63.4, "2025-08-07"],
  [21, 86.1, "2025-08-07"], [22, 79.1, "2025-08-08"], [23, 47.3, "2025-08-08"],
  [24, 83.7, "2025-08-08"], [25, 66.7, "2025-08-09"], [27, 89.9, "2025-08-09"],
  [28, 72.0, "2025-08-09"], [29, 59.8, "2025-08-10"], [30, 80.5, "2025-08-10"],
];

const BECAS: Array<[number, string, "Excelencia" | "Social", number]> = [
  [1, "Beca Excelencia", "Excelencia", 500],
  [2, "Beca Excelencia", "Excelencia", 500],
  [6, "Beca Social", "Social", 350],
  [8, "Beca Excelencia", "Excelencia", 600],
  [10, "Beca Excelencia", "Excelencia", 600],
  [15, "Beca Social", "Social", 400],
  [21, "Beca Excelencia", "Excelencia", 600],
];

export async function seedDatabase(): Promise<void> {
  const carreras = [...new Set(ESTUDIANTES.map((e) => e[2]))];
  for (const nombre of carreras) {
    await prisma.carrera.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
  await prisma.tipoBeca.upsert({
    where: { nombre: "Excelencia" },
    update: {},
    create: { nombre: "Excelencia", descripcion: "Rendimiento académico destacado", monto: 600, cupos: 20, activa: true },
  });
  await prisma.tipoBeca.upsert({
    where: { nombre: "Social" },
    update: {},
    create: { nombre: "Social", descripcion: "Apoyo socioeconómico", monto: 400, cupos: 30, activa: true },
  });
  await prisma.convocatoria.findFirst({ where: { nombre: "Convocatoria Becas 2025-I" } }).then(async (existe) => {
    if (!existe) {
      await prisma.convocatoria.create({
        data: { nombre: "Convocatoria Becas 2025-I", gestion: "2025-I", inicio: "2025-07-01", fin: "2025-09-30", estado: "Abierta", presupuesto: 50000 },
      });
    }
  });
  const criterios = [
    { nombre: "Rendimiento académico", descripcion: "Promedio ponderado", peso: 30, tipo: "beneficio" },
    { nombre: "Asistencia", descripcion: "Porcentaje de asistencia", peso: 15, tipo: "beneficio" },
    { nombre: "Situación socioeconómica", descripcion: "Ingreso familiar", peso: 25, tipo: "costo" },
    { nombre: "Carga familiar", descripcion: "Dependientes del hogar", peso: 15, tipo: "beneficio" },
    { nombre: "Condición vulnerable", descripcion: "Vulnerabilidad acreditada", peso: 15, tipo: "beneficio" },
  ];
  for (const c of criterios) {
    await prisma.criterio.upsert({ where: { nombre: c.nombre }, update: {}, create: { ...c, activo: true } });
  }

  for (let i = 0; i < ESTUDIANTES.length; i += 1) {
    const [nombre, apellido, carrera, promedio, ingreso] = ESTUDIANTES[i];
    const id = i + 1;
    const extra =
      id === 1
        ? {
            ci: "1000001", fecha_nacimiento: "2000-05-14", telefono: "70000001",
            correo: "maria.fernandez@universidad.bo", direccion: "Av. Principal 123", ciudad: "La Paz",
            codigo_universitario: "UNIV-001", facultad: "Ingeniería", semestre: 8,
            materias_aprobadas: 42, materias_reprobadas: 3, anio_ingreso: 2021,
            integrantes_hogar: 4, dependientes: 2, tipo_vivienda: "propia", procedencia: "urbano",
            discapacidad: "no", situacion_laboral: "estudiante", motivo: "Apoyo para concluir la carrera",
          }
        : { ci: `1000${String(id).padStart(3, "0")}`, correo: `estudiante${id}@universidad.bo` };
    // Idempotente: se puede ejecutar varias veces sin duplicar (ver setup).
    await prisma.estudiante.upsert({
      where: { ci: extra.ci },
      update: {},
      create: { nombre, apellido, carrera, promedio, ingreso_familiar: ingreso, ...extra },
    });
  }
  for (const [idEst, final, fecha] of FINALES) {
    const existente = await prisma.evaluacion.findFirst({ where: { id_estudiante: idEst, fecha } });
    if (!existente) {
      const ac = redondear1(final + ((idEst * 7) % 5) - 2);
      const so = redondear1(final + ((idEst * 3) % 5) - 2);
      await prisma.evaluacion.create({
        data: { id_estudiante: idEst, fecha, puntaje_academico: ac, puntaje_social: so, puntaje_final: final },
      });
    }
    await prisma.resultado.upsert({
      where: { id_estudiante: idEst },
      update: {},
      create: { id_estudiante: idEst, resultado: recomendar(final) },
    });
  }
  for (const [idEst, nombre, tipo, monto] of BECAS) {
    const existente = await prisma.beca.findFirst({ where: { id_estudiante: idEst, nombre_beca: nombre } });
    if (!existente) {
      await prisma.beca.create({
        data: { id_estudiante: idEst, nombre_beca: nombre, tipo, monto, estado: "Activa" },
      });
    }
  }
  // Asignaciones + seguimiento de ejemplo (idempotente).
  const conv = await prisma.convocatoria.findFirst({ where: { nombre: "Convocatoria Becas 2025-I" } });
  const tipoExc = await prisma.tipoBeca.findFirst({ where: { nombre: "Excelencia" } });
  if (conv && tipoExc) {
    const asig = await prisma.asignacion.findFirst({
      where: { id_estudiante: 1, id_convocatoria: conv.id, id_tipo_beca: tipoExc.id },
    });
    const asigId =
      asig?.id ??
      (
        await prisma.asignacion.create({
          data: { id_estudiante: 1, id_convocatoria: conv.id, id_tipo_beca: tipoExc.id, puntaje: 92.5, estado: "Aprobada" },
        })
      ).id;
    for (const [periodo, promedio] of [["2024-II", 86.0], ["2025-I", 88.0]] as Array<[string, number]>) {
      const existe = await prisma.seguimiento.findFirst({ where: { id_asignacion: asigId, periodo } });
      if (!existe) {
        await prisma.seguimiento.create({
          data: {
            id_asignacion: asigId, fecha: "2025-08-10", periodo, promedio_periodo: promedio,
            estado: promedio < 51 ? "En riesgo" : "Al día",
          },
        });
      }
    }
  }
  if ((await prisma.evento.count()) === 0) {
    await prisma.evento.create({
      data: { id_estudiante: null, tipo: "creacion", detalle: "Base de datos inicializada (seed)" },
    });
  }
  for (const [usuario, nombre, correo, rol, password] of [
    ["admin", "Admin Bienestar", "admin@universidad.bo", "Administrador", "Admin2026!"],
    ["evaluador", "Evaluador DSS", "evaluador@universidad.bo", "Evaluador", "Evaluador2026!"],
    ["consulta", "Consulta Rectorado", "consulta@universidad.bo", "Consulta", "Consulta2026!"],
  ] as Array<[string, string, string, string, string]>) {
    await prisma.usuario.upsert({
      where: { correo },
      update: {},
      create: { usuario, nombre, correo, rol, password_hash: bcryptjs.hashSync(password, 10) },
    });
  }
}

async function main(): Promise<void> {
  await seedDatabase();
  // eslint-disable-next-line no-console
  console.log("Seed completado.");
}

const esEjecucionDirecta = process.argv[1]?.endsWith("seed.ts") ?? false;
if (esEjecucionDirecta) {
  main()
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      process.exit(1);
    })
    .finally(() => void prisma.$disconnect());
}
