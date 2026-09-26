// Pruebas de la API y del motor DSS (base test.db aislada).
process.env.DATABASE_URL = "file:./prisma/test.db";

import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calcular } from "../src/dss/motor";
import { ordenarRanking } from "../src/dss/ranking";

let app: (typeof import("../src/app"))["app"];

beforeAll(async () => {
  const db = "backend/prisma/test.db";
  const desdeRaiz = existsSync("backend");
  const cwd = desdeRaiz ? "backend" : ".";
  const archivo = desdeRaiz ? "backend/prisma/test.db" : "prisma/test.db";
  void db;
  if (existsSync(archivo)) rmSync(archivo);
  execSync("npx prisma db push --skip-generate", { cwd, stdio: "pipe" });
  ({ app } = await import("../src/app"));
}, 120000);

afterAll(async () => {
  const { prisma } = await import("../src/config/db");
  await prisma.$disconnect();
});

describe("motor DSS", () => {
  it("calcula suma ponderada 30/15/25/15/15", () => {
    const r = calcular({ rendimiento: 90, asistencia: 80, situacion: 70, carga: 60, vulnerable: 50 });
    expect(r.puntaje_academico).toBe(85);
    expect(r.puntaje_social).toBeCloseTo(60, 5);
    expect(r.puntaje_final).toBe(73);
    expect(r.recomendacion).toBe("En revisión");
  });

  it("umbrales: 80 Recomendado, 60 revisión, menos riesgo", () => {
    expect(calcular({ rendimiento: 90, asistencia: 90, situacion: 90, carga: 90, vulnerable: 90 }).recomendacion).toBe("Recomendado");
    expect(calcular({ rendimiento: 10, asistencia: 10, situacion: 10, carga: 10, vulnerable: 10 }).recomendacion).toBe("En riesgo");
  });

  it("ranking desempata por promedio y luego por menor ingreso", () => {
    const filas = ordenarRanking([
      { id_estudiante: 1, puntaje_final: 80, promedio: 70, ingreso_familiar: 5000 },
      { id_estudiante: 2, puntaje_final: 80, promedio: 90, ingreso_familiar: 5000 },
      { id_estudiante: 3, puntaje_final: 80, promedio: 90, ingreso_familiar: 1000 },
    ]);
    expect(filas.map((f) => f.id_estudiante)).toEqual([3, 2, 1]);
  });
});

describe("API", () => {
  it("GET /api/health", async () => {
    const r = await request(app).get("/api/health");
    expect(r.status).toBe(200);
    expect(r.body.estado).toBe("ok");
  });

  it("CRUD de estudiantes", async () => {
    const creado = await request(app).post("/api/estudiantes").send({
      nombre: "Prueba", apellido: "Api", ci: "9999999", carrera: "Derecho",
      promedio: 85, ingreso_familiar: 3000,
    });
    expect(creado.status).toBe(201);
    const id = creado.body.id_estudiante as number;

    const dup = await request(app).post("/api/estudiantes").send({
      nombre: "Otro", apellido: "Dup", ci: "9999999", carrera: "Derecho",
      promedio: 70, ingreso_familiar: 2000,
    });
    expect(dup.status).toBe(409);
    expect(String(dup.body.error)).toContain("CI");

    const malo = await request(app).post("/api/estudiantes").send({
      nombre: "", apellido: "X", carrera: "Derecho", promedio: 150, ingreso_familiar: -1,
    });
    expect(malo.status).toBe(400);
    expect(malo.body.detalles.promedio).toBeDefined();

    const lista = await request(app).get("/api/estudiantes?page=1&pageSize=10");
    expect(lista.status).toBe(200);
    expect(lista.body.total).toBeGreaterThanOrEqual(1);
    expect(lista.body.data.length).toBeLessThanOrEqual(10);

    const uno = await request(app).get(`/api/estudiantes/${id}`);
    expect(uno.status).toBe(200);
    expect(uno.body.nombre).toBe("Prueba");

    const edit = await request(app).put(`/api/estudiantes/${id}`).send({ promedio: 90 });
    expect(edit.status).toBe(200);
    expect(edit.body.promedio).toBe(90);

    const hist = await request(app).get(`/api/estudiantes/${id}/historial`);
    expect(hist.status).toBe(200);
    expect(hist.body.length).toBeGreaterThanOrEqual(2);
  });

  it("evaluación: calcular, guardar y dashboard", async () => {
    const calc = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: 1,
      criterios: { rendimiento: 90, asistencia: 80, situacion: 70, carga: 60, vulnerable: 50 },
    });
    expect(calc.status).toBe(200);
    expect(calc.body.puntaje_final).toBe(73);

    const creada = await request(app).post("/api/estudiantes").send({
      nombre: "Eval", apellido: "Test", ci: "8888888", carrera: "Medicina",
      promedio: 88, ingreso_familiar: 2500,
    });
    const id = creada.body.id_estudiante as number;
    const ev = await request(app).post("/api/evaluaciones").send({
      id_estudiante: id, fecha: "2025-09-01",
      puntaje_academico: 88, puntaje_social: 84, puntaje_final: 86.2,
    });
    expect(ev.status).toBe(201);

    const dash = await request(app).get("/api/dashboard/resumen");
    expect(dash.status).toBe(200);
    expect(dash.body.evaluados).toBeGreaterThanOrEqual(1);
    expect(dash.body.ranking.length).toBeGreaterThanOrEqual(1);

    const rank = await request(app).get("/api/ranking");
    expect(rank.status).toBe(200);
    expect(rank.body[0].posicion).toBe(1);

    await request(app).delete(`/api/estudiantes/${id}`).expect(204);
    const evBorrada = await request(app).get("/api/evaluaciones");
    expect(evBorrada.body.some((e: { id_estudiante: number }) => e.id_estudiante === id)).toBe(false);
  });

  it("catálogos con guarda 409", async () => {
    const tipo = await request(app).post("/api/tipos-beca").send({
      nombre: "PruebaTmp", monto: 100, cupos: 1,
    });
    expect(tipo.status).toBe(201);
    const conv = await request(app).post("/api/convocatorias").send({
      nombre: "ConvTmp", gestion: "2025-T",
    });
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "Asig", apellido: "Tmp", ci: "7777777", carrera: "Derecho",
      promedio: 95, ingreso_familiar: 1000,
    });
    await request(app).post("/api/evaluaciones").send({
      id_estudiante: est.body.id_estudiante, fecha: "2025-09-01",
      puntaje_academico: 95, puntaje_social: 95, puntaje_final: 95,
    });
    const gen = await request(app).post("/api/asignaciones/generar").send({
      convocatoriaId: conv.body.id, tipoBecaId: tipo.body.id,
    });
    expect(gen.status).toBe(201);
    expect(gen.body.generadas).toBe(1);

    const del = await request(app).delete(`/api/tipos-beca/${tipo.body.id}`);
    expect(del.status).toBe(409);

    const resumen = await request(app).get(
      `/api/asignaciones/resumen?convocatoriaId=${conv.body.id}&tipoBecaId=${tipo.body.id}`,
    );
    expect(resumen.body.ocupados).toBe(1);
    expect(resumen.body.disponibles).toBe(0);
  });

  it("POST /api/dev/reset restaura el seed", async () => {
    const r = await request(app).post("/api/dev/reset");
    expect(r.status).toBe(200);
    const lista = await request(app).get("/api/estudiantes?pageSize=50");
    expect(lista.body.total).toBe(30);
  });
});
