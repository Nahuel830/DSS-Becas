// Pruebas de GET /api/seguimiento/becarios (una fila por asignación Aprobada).
// Ruta ABSOLUTA: Prisma resuelve file: relativo al schema, no al cwd.
import { existsSync } from "fs";
import path from "path";
const dirPrismaSeg = path.resolve(existsSync("backend") ? "backend/prisma" : "prisma");
process.env.DATABASE_URL = `file:${dirPrismaSeg.replace(/\\/g, "/")}/seguimiento-becarios.db`;

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loginAdmin, prepararDb, req } from "../helpers";

let app: (typeof import("../../src/app"))["app"];
let prisma: (typeof import("../../src/config/db"))["prisma"];
let admin = "";
let idA = 0;
let idB = 0;
let idD = 0;

async function crearEstudiante(nombre: string, ci: string): Promise<number> {
  const r = await req(app, admin).post("/api/estudiantes").send({
    nombre, apellido: "Prueba", ci, carrera: "Ing. Sistemas", promedio: 85, ingreso_familiar: 2000,
  });
  if (r.status !== 201) throw new Error(`crear estudiante: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.id_estudiante as number;
}

beforeAll(async () => {
  const archivo = path.join(dirPrismaSeg, "seguimiento-becarios.db");
  prepararDb(archivo, existsSync("backend") ? "backend" : ".");
  ({ app } = await import("../../src/app"));
  ({ prisma } = await import("../../src/config/db"));
  admin = await loginAdmin(app, prisma);

  const conv = await req(app, admin).post("/api/convocatorias").send({ nombre: "Conv Seg", gestion: "2025" });
  const tipo = await req(app, admin).post("/api/tipos-beca").send({ nombre: "Beca Seg", monto: 500, cupos: 10 });
  const convocatoriaId = conv.body.id as number;
  const tipoBecaId = tipo.body.id as number;

  const eA = await crearEstudiante("AnaSeg", "9000101");
  const eB = await crearEstudiante("BrunoSeg", "9000102");
  const eC = await crearEstudiante("CarlaSeg", "9000103");
  const eD = await crearEstudiante("DavidSeg", "9000104");

  const asig = async (idEst: number, estado?: string) => {
    const r = await req(app, admin).post("/api/asignaciones").send({
      id_estudiante: idEst, id_convocatoria: convocatoriaId, id_tipo_beca: tipoBecaId,
      puntaje: 85, ...(estado ? { estado } : {}),
    });
    if (r.status !== 201) throw new Error(`crear asignación: ${r.status} ${JSON.stringify(r.body)}`);
    return r.body.id as number;
  };
  idA = await asig(eA);
  idB = await asig(eB);
  await asig(eC, "Rechazada");
  idD = await asig(eD);

  const periodo = async (idAsig: number, periodo: string, promedio: number) => {
    const r = await req(app, admin).post("/api/seguimiento").send({
      id_asignacion: idAsig, fecha: "2025-08-10", periodo, promedio_periodo: promedio,
    });
    if (r.status !== 201) throw new Error(`crear periodo: ${r.status} ${JSON.stringify(r.body)}`);
  };
  await periodo(idA, "2025-I", 80);
  await periodo(idA, "2025-II", 90);
  await periodo(idB, "2025-I", 40);
  await periodo(idB, "2025-II", 45);
}, 120000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/seguimiento/becarios", () => {
  it("(a) aprobado sin periodos aparece con Sin registros", async () => {
    const r = await req(app, admin).get("/api/seguimiento/becarios");
    expect(r.status).toBe(200);
    const d = r.body.find((f: { id_asignacion: number }) => f.id_asignacion === idD);
    expect(d).toBeDefined();
    expect(d.estado).toBe("Sin registros");
    expect(d.total_periodos).toBe(0);
    expect(d.ultimo_periodo).toBeNull();
    expect(d.ultimo_promedio).toBeNull();
  });

  it("(b) con 2 periodos hay UNA fila con el último y total 2", async () => {
    const r = await req(app, admin).get("/api/seguimiento/becarios");
    const filas = r.body.filter((f: { id_asignacion: number }) => f.id_asignacion === idA);
    expect(filas).toHaveLength(1);
    expect(filas[0].total_periodos).toBe(2);
    expect(filas[0].ultimo_periodo).toBe("2025-II");
    expect(filas[0].ultimo_promedio).toBe(90);
    expect(filas[0].estado).toBe("Al día");
  });

  it("(c) dos periodos en riesgo devuelven sugerencia true", async () => {
    const r = await req(app, admin).get("/api/seguimiento/becarios");
    const b = r.body.find((f: { id_asignacion: number }) => f.id_asignacion === idB);
    expect(b.estado).toBe("En riesgo");
    expect(b.sugerencia_suspension).toBe(true);
  });

  it("(d) asignaciones no Aprobadas no aparecen", async () => {
    const r = await req(app, admin).get("/api/seguimiento/becarios");
    const nombres = (r.body as Array<{ estudiante: { nombre: string } }>).map((f) => f.estudiante.nombre);
    expect(nombres).not.toContain("CarlaSeg");
    expect(nombres).toContain("AnaSeg");
  });

  it("(e) Consulta lee (200) y sin token da 401", async () => {
    const creado = await req(app, admin).post("/api/usuarios").send({
      usuario: "con.seg", nombre: "Con", correo: "con.seg@test.bo",
      rol: "Consulta", password: "Con12345",
    });
    expect(creado.status).toBe(201);
    const { default: request } = await import("supertest");
    const login = await request(app).post("/api/auth/login").send({ usuario: "con.seg", password: "Con12345" });
    expect(login.status).toBe(200);
    const r = await req(app, login.body.token as string).get("/api/seguimiento/becarios");
    expect(r.status).toBe(200);
    const sin = await request(app).get("/api/seguimiento/becarios");
    expect(sin.status).toBe(401);
  });
});
