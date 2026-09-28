// Auditoría QA Actividad 8: intenta ROMPER el sistema (casos inválidos, límites,
// integridad, reglas DSS, dashboard vacío). Los ❌ son hallazgos, no regresiones:
// documentan validaciones o reglas ausentes. Ver docs/qa/REPORTE_PRUEBAS_QA.md.
process.env.DATABASE_URL = "file:./prisma/qa.db";

import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let app: (typeof import("../../src/app"))["app"];
let prisma: (typeof import("../../src/config/db"))["prisma"];

function haceAnios(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  const archivo = existsSync("backend") ? "backend/prisma/qa.db" : "prisma/qa.db";
  if (existsSync(archivo)) rmSync(archivo);
  execSync("npx prisma db push --skip-generate", { cwd: existsSync("backend") ? "backend" : ".", stdio: "pipe" });
  ({ app } = await import("../../src/app"));
  ({ prisma } = await import("../../src/config/db"));
}, 120000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("A) CRUD con datos inválidos", () => {
  it("A1: obligatorios vacíos → 400 español con detalles", async () => {
    const r = await request(app).post("/api/estudiantes").send({});
    expect(r.status).toBe(400);
    expect(r.body.error).toBeDefined();
    for (const campo of ["nombre", "carrera", "promedio", "ingreso_familiar"]) {
      expect(r.body.detalles[campo], campo).toBeDefined();
    }
  });

  it("A2: letras en numéricos → 400", async () => {
    for (const cuerpo of [
      { nombre: "A", apellido: "B", carrera: "X", promedio: "abc", ingreso_familiar: 100 },
      { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: "mil" },
      { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100, semestre: "tres" },
    ]) {
      const r = await request(app).post("/api/estudiantes").send(cuerpo);
      expect(r.status).toBe(400);
    }
  });

  it("A3: negativos y cero indebido → 400", async () => {
    const base = { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100 };
    expect((await request(app).post("/api/estudiantes").send({ ...base, ingreso_familiar: -500 })).status).toBe(400);
    expect((await request(app).post("/api/estudiantes").send({ ...base, integrantes_hogar: 0 })).status).toBe(400);
    expect((await request(app).post("/api/tipos-beca").send({ nombre: "T", monto: 100, cupos: -1 })).status).toBe(400);
    expect((await request(app).post("/api/tipos-beca").send({ nombre: "T", monto: -50, cupos: 5 })).status).toBe(400);
  });

  it("A4: límites (promedio, semestre, edad) → 400", async () => {
    const base = { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100 };
    for (const parche of [{ promedio: 100.01 }, { promedio: -1 }, { semestre: 0 }, { semestre: 11 }]) {
      expect((await request(app).post("/api/estudiantes").send({ ...base, ...parche })).status).toBe(400);
    }
    for (const fn of [haceAnios(15), haceAnios(61)]) {
      const r = await request(app).post("/api/estudiantes").send({ ...base, fecha_nacimiento: fn });
      expect(r.status).toBe(400);
    }
    const ok = await request(app).post("/api/estudiantes").send({ ...base, ci: "9000011", fecha_nacimiento: haceAnios(20) });
    expect(ok.status).toBe(201);
  });

  it("A5: nacimiento futuro → 400; convocatoria fin<inicio debería dar 400", async () => {
    const base = { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100 };
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    const r = await request(app).post("/api/estudiantes").send({ ...base, ci: "9000012", fecha_nacimiento: futuro.toISOString().slice(0, 10) });
    expect(r.status).toBe(400);
    // HALLAZGO: sin validación de rango de fechas en convocatorias.
    const conv = await request(app).post("/api/convocatorias").send({
      nombre: "ConvQA", gestion: "2025-QA", inicio: "2025-09-01", fin: "2025-01-01",
    });
    expect(conv.status).toBe(400);
  });

  it("A6: CI y correo duplicados → 409 en español", async () => {
    const base = { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100 };
    await request(app).post("/api/estudiantes").send({ ...base, ci: "9000001", correo: "qa-dup@qa.bo" });
    const dupCi = await request(app).post("/api/estudiantes").send({ ...base, ci: "9000001", correo: "otro@qa.bo" });
    expect(dupCi.status).toBe(409);
    expect(String(dupCi.body.error)).toContain("CI");
    const dupCorreo = await request(app).post("/api/estudiantes").send({ ...base, ci: "9000002", correo: "qa-dup@qa.bo" });
    expect(dupCorreo.status).toBe(409);
  });

  it("A7: textos largos y caracteres especiales", async () => {
    const base = { nombre: "A", apellido: "B", carrera: "X", promedio: 80, ingreso_familiar: 100 };
    expect((await request(app).post("/api/estudiantes").send({ ...base, ci: "9000013", nombre: "x".repeat(500) })).status).toBe(400);
    const motivo = await request(app).post("/api/estudiantes").send({ ...base, ci: "9000014", motivo: "y".repeat(5000) });
    expect(motivo.status).toBe(201); // sin límite documentado: se acepta
    const esp = await request(app).post("/api/estudiantes").send({
      ...base, ci: "9000015", nombre: "Ñandú", apellido: "Pérez O'Connor",
    });
    expect(esp.status).toBe(201);
    const leido = await request(app).get(`/api/estudiantes/${esp.body.id_estudiante}`);
    expect(leido.body.nombre).toBe("Ñandú");
    expect(leido.body.apellido).toBe("Pérez O'Connor");
  });

  it("A8: eliminar tipo/convocatoria con asignaciones → 409", async () => {
    const tipo = await request(app).post("/api/tipos-beca").send({ nombre: "QATmp", monto: 100, cupos: 5 });
    const conv = await request(app).post("/api/convocatorias").send({ nombre: "ConvQATmp", gestion: "2025-QA" });
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "As", apellido: "Ig", ci: "9000016", carrera: "X", promedio: 95, ingreso_familiar: 1000,
    });
    await request(app).post("/api/evaluaciones").send({
      id_estudiante: est.body.id_estudiante, fecha: "2025-09-01",
      puntaje_academico: 95, puntaje_social: 95, puntaje_final: 95,
    });
    await request(app).post("/api/asignaciones/generar").send({ convocatoriaId: conv.body.id, tipoBecaId: tipo.body.id });
    expect((await request(app).delete(`/api/tipos-beca/${tipo.body.id}`)).status).toBe(409);
    expect((await request(app).delete(`/api/convocatorias/${conv.body.id}`)).status).toBe(409);
  });

  it("A9: editar/eliminar inexistente → 404", async () => {
    expect((await request(app).get("/api/estudiantes/999999")).status).toBe(404);
    expect((await request(app).put("/api/estudiantes/999999").send({ promedio: 80 })).status).toBe(404);
    expect((await request(app).delete("/api/estudiantes/999999")).status).toBe(404);
  });
});

describe("B) Integridad", () => {
  it("B1: decimales y ñ se guardan exactos", async () => {
    const r = await request(app).post("/api/estudiantes").send({
      nombre: "Peña", apellido: "Niño", ci: "9000017", carrera: "Derecho",
      promedio: 78.55, ingreso_familiar: 3500.75,
    });
    expect(r.status).toBe(201);
    const leido = await request(app).get(`/api/estudiantes/${r.body.id_estudiante}`);
    expect(leido.body.promedio).toBeCloseTo(78.55, 5);
    expect(leido.body.ingreso_familiar).toBeCloseTo(3500.75, 5);
    expect(leido.body.nombre).toBe("Peña");
  });

  it("B2: la edición persiste", async () => {
    const r = await request(app).post("/api/estudiantes").send({
      nombre: "Ed", apellido: "It", ci: "9000018", carrera: "X", promedio: 70, ingreso_familiar: 100,
    });
    await request(app).put(`/api/estudiantes/${r.body.id_estudiante}`).send({ promedio: 91.25 });
    const leido = await request(app).get(`/api/estudiantes/${r.body.id_estudiante}`);
    expect(leido.body.promedio).toBeCloseTo(91.25, 5);
  });

  it("B3: eliminar no deja huérfanos", async () => {
    const r = await request(app).post("/api/estudiantes").send({
      nombre: "Bo", apellido: "Rrar", ci: "9000019", carrera: "X", promedio: 80, ingreso_familiar: 100,
    });
    const id = r.body.id_estudiante as number;
    await request(app).post("/api/evaluaciones").send({
      id_estudiante: id, fecha: "2025-09-01", puntaje_academico: 80, puntaje_social: 80, puntaje_final: 80,
    });
    await request(app).delete(`/api/estudiantes/${id}`).expect(204);
    expect(await prisma.evaluacion.count({ where: { id_estudiante: id } })).toBe(0);
    expect(await prisma.resultado.count({ where: { id_estudiante: id } })).toBe(0);
    expect(await prisma.evento.count({ where: { id_estudiante: id } })).toBe(0);
    expect((await request(app).get(`/api/estudiantes/${id}`)).status).toBe(404);
  });
});

describe("C) Reglas DSS", () => {
  it("C1: el backend rechaza pesos que rompen la suma 100", async () => {
    // Determinista: un peso 110 siempre rompe cualquier suma válida.
    const malo = await request(app).post("/api/criterios").send({ nombre: "QAPesoMalo", peso: 110 });
    expect(malo.status).toBe(400);
  });

  it("C2: cálculo a mano coincide con el motor (dos casos)", async () => {
    const r1 = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: 1,
      criterios: { rendimiento: 90, asistencia: 80, situacion: 70, carga: 60, vulnerable: 50 },
    });
    expect(r1.body.puntaje_final).toBe(73);
    expect(r1.body.recomendacion).toBe("En revisión");
    const r2 = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: 1,
      criterios: { rendimiento: 100, asistencia: 100, situacion: 100, carga: 100, vulnerable: 100 },
    });
    expect(r2.body.puntaje_final).toBe(100);
    expect(r2.body.recomendacion).toBe("Recomendado");
  });

  it("C3: promedio bajo da No elegible con motivos", async () => {
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "Ba", apellido: "Jo", ci: "9000101", carrera: "X", promedio: 40, ingreso_familiar: 5500,
    });
    const r = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: est.body.id_estudiante,
      criterios: { rendimiento: 10, asistencia: 10, situacion: 10, carga: 10, vulnerable: 10 },
    });
    expect(r.body.elegible).toBe(false);
    expect(r.body.motivos_no_elegible.length).toBeGreaterThan(0);
    expect(r.body.recomendacion).toBe("No elegible");
  });

  it("C4: generar no supera cupos ni presupuesto", async () => {
    const tipo = await request(app).post("/api/tipos-beca").send({ nombre: "QACupo", monto: 500, cupos: 1 });
    const conv = await request(app).post("/api/convocatorias").send({ nombre: "ConvQACupo", gestion: "2025-QA", presupuesto: 10000 });
    for (const [n, ci, p] of [["C1", "9000021", 95], ["C2", "9000022", 90]] as Array<[string, string, number]>) {
      const est = await request(app).post("/api/estudiantes").send({
        nombre: n, apellido: "X", ci, carrera: "X", promedio: p, ingreso_familiar: 1000,
      });
      await request(app).post("/api/evaluaciones").send({
        id_estudiante: est.body.id_estudiante, fecha: "2025-09-01",
        puntaje_academico: p, puntaje_social: p, puntaje_final: p,
      });
    }
    const gen = await request(app).post("/api/asignaciones/generar").send({
      convocatoriaId: conv.body.id, tipoBecaId: tipo.body.id,
    });
    expect(gen.body.generadas).toBeLessThanOrEqual(1);
    const res = await request(app).get(`/api/asignaciones/resumen?convocatoriaId=${conv.body.id}&tipoBecaId=${tipo.body.id}`);
    expect(res.body.ocupados).toBeLessThanOrEqual(res.body.cupos_totales);
    expect(res.body.presupuesto_usado).toBeLessThanOrEqual(res.body.presupuesto_total);
  });

  it("C5: rechazar sin observaciones debería bloquearse (campo inexistente)", async () => {
    const tipo = await request(app).post("/api/tipos-beca").send({ nombre: "QARec", monto: 100, cupos: 5 });
    const conv = await request(app).post("/api/convocatorias").send({ nombre: "ConvQARec", gestion: "2025-QA" });
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "Re", apellido: "Ch", ci: "9000023", carrera: "X", promedio: 80, ingreso_familiar: 1000,
    });
    const asig = await request(app).post("/api/asignaciones").send({
      id_estudiante: est.body.id_estudiante, id_convocatoria: conv.body.id,
      id_tipo_beca: tipo.body.id, puntaje: 80,
    });
    // HALLAZGO: no hay decisión del evaluador con observaciones obligatorias.
    const r = await request(app).put(`/api/asignaciones/${asig.body.id}`).send({ estado: "Rechazada" });
    expect(r.status).toBe(400);
  });
});

describe("D) Dashboard", () => {
  it("D1: base vacía muestra ceros, no NaN", async () => {
    await prisma.asignacion.deleteMany();
    await prisma.documento.deleteMany();
    await prisma.evento.deleteMany();
    await prisma.resultado.deleteMany();
    await prisma.evaluacion.deleteMany();
    await prisma.beca.deleteMany();
    await prisma.estudiante.deleteMany();
    const r = await request(app).get("/api/dashboard/resumen");
    expect(r.status).toBe(200);
    expect(r.body.evaluados).toBe(0);
    expect(r.body.ranking).toEqual([]);
    for (const k of ["evaluados", "recomendados", "en_revision", "en_riesgo"]) {
      expect(Number.isFinite(r.body[k])).toBe(true);
    }
    await request(app).post("/api/dev/reset");
  });

  it("D2: totales coinciden con la base", async () => {
    const r = await request(app).get("/api/dashboard/resumen");
    const [nEst, nEv] = await Promise.all([prisma.estudiante.count(), prisma.evaluacion.count()]);
    expect(r.body.evaluados).toBe(nEv);
    expect(nEst).toBeGreaterThan(0);
  });
});

describe("E) API", () => {
  it("E1: POST válido devuelve 201 con id", async () => {
    const r = await request(app).post("/api/estudiantes").send({
      nombre: "E", apellido: "F", ci: "9000024", carrera: "X", promedio: 75, ingreso_familiar: 2000,
    });
    expect(r.status).toBe(201);
    expect(r.body.id_estudiante).toBeGreaterThan(0);
  });
});

describe("QA cierre módulo 1 (issues #1–#5)", () => {
  it("#1: el resumen muestra una fila por estudiante (mejor puntaje)", async () => {
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "Du", apellido: "Plicado", ci: "9100001", carrera: "X", promedio: 90, ingreso_familiar: 1000,
    });
    const id = est.body.id_estudiante as number;
    for (const final of [70, 90.4]) {
      await request(app).post("/api/evaluaciones").send({
        id_estudiante: id, fecha: "2025-09-01",
        puntaje_academico: final, puntaje_social: final, puntaje_final: final,
      });
    }
    const r = await request(app).get("/api/dashboard/resumen");
    const filas = (r.body.ranking as Array<{ id?: number; estudiante: string; puntaje: number }>);
    const delEst = filas.filter((f) => f.estudiante.includes("Du Plicado"));
    expect(delEst.length).toBe(1);
    expect(delEst[0].puntaje).toBe(90.4);
  });

  it("#4: bulk de pesos válido e inválido", async () => {
    const lista = await request(app).get("/api/criterios");
    const base = (lista.body as Array<{ id: number; peso: number }>).map((c) => ({ id: c.id, peso: c.peso }));
    if (base.length > 0) {
      expect((await request(app).put("/api/criterios/pesos").send({ pesos: base })).status).toBe(200);
      const mal = [{ ...base[0], peso: base[0].peso + 10 }, ...base.slice(1)];
      const r = await request(app).put("/api/criterios/pesos").send({ pesos: mal });
      expect(r.status).toBe(400);
    }
  });

  it("#3: elegibilidad con motivos", async () => {
    const bajo = await request(app).post("/api/estudiantes").send({
      nombre: "Ba", apellido: "Jo", ci: "9100002", carrera: "X", promedio: 40, ingreso_familiar: 5500,
    });
    const r = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: bajo.body.id_estudiante,
      criterios: { rendimiento: 40, asistencia: 60, situacion: 30, carga: 40, vulnerable: 35 },
      tipo_beca: "Social",
    });
    expect(r.body.elegible).toBe(false);
    expect(r.body.motivos_no_elegible.length).toBeGreaterThanOrEqual(2);
    expect(r.body.recomendacion).toBe("No elegible");
    const alto = await request(app).post("/api/estudiantes").send({
      nombre: "Al", apellido: "To", ci: "9100003", carrera: "X", promedio: 90, ingreso_familiar: 2000,
    });
    const r2 = await request(app).post("/api/evaluaciones/calcular").send({
      id_estudiante: alto.body.id_estudiante,
      criterios: { rendimiento: 90, asistencia: 90, situacion: 88, carga: 80, vulnerable: 75 },
    });
    expect(r2.body.elegible).toBe(true);
    expect(r2.body.motivos_no_elegible).toEqual([]);
  });

  it("#2: decisión con observaciones obligatorias", async () => {
    const tipo = await request(app).post("/api/tipos-beca").send({ nombre: "QADec", monto: 100, cupos: 5 });
    const conv = await request(app).post("/api/convocatorias").send({ nombre: "ConvQADec", gestion: "2025-QA" });
    const est = await request(app).post("/api/estudiantes").send({
      nombre: "De", apellido: "Ci", ci: "9100004", carrera: "X", promedio: 85, ingreso_familiar: 2000,
    });
    const asig = await request(app).post("/api/asignaciones").send({
      id_estudiante: est.body.id_estudiante, id_convocatoria: conv.body.id,
      id_tipo_beca: tipo.body.id, puntaje: 85,
    });
    expect(
      (await request(app).put(`/api/asignaciones/${asig.body.id}`).send({ estado: "Rechazada" })).status,
    ).toBe(400);
    expect(
      (await request(app).put(`/api/asignaciones/${asig.body.id}`).send({ estado: "Rechazada", observaciones: "corta" })).status,
    ).toBe(400);
    const ok = await request(app).put(`/api/asignaciones/${asig.body.id}`).send({
      estado: "En observación", observaciones: "Falta certificado de ingresos del hogar.",
    });
    expect(ok.status).toBe(200);
    const hist = await request(app).get(`/api/estudiantes/${est.body.id_estudiante}/historial`);
    expect(JSON.stringify(hist.body)).toContain("En observación");
  });
});
