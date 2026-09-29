// Pruebas de la matriz de permisos por rol (base permisos.db aislada).
// Ruta ABSOLUTA: Prisma resuelve file: relativo al schema, no al cwd.
import { existsSync } from "fs";
import path from "path";
const dirPrismaPerm = path.resolve(existsSync("backend") ? "backend/prisma" : "prisma");
process.env.DATABASE_URL = `file:${dirPrismaPerm.replace(/\\/g, "/")}/permisos.db`;

import bcryptjs from "bcryptjs";
import type { Express } from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prepararDb, req } from "./helpers";

let app: Express;
let prisma: (typeof import("../src/config/db"))["prisma"];
let admin = "";
let evaluador = "";
let consulta = "";

async function sembrar(usuario: string, rol: string, password: string): Promise<void> {
  await prisma.usuario.upsert({
    where: { correo: `${usuario}@perm.bo` },
    update: { password_hash: bcryptjs.hashSync(password, 10), activo: true, token_version: 0 },
    create: {
      usuario, nombre: usuario, correo: `${usuario}@perm.bo`, rol,
      password_hash: bcryptjs.hashSync(password, 10),
    },
  });
}

async function token(usuario: string, password: string): Promise<string> {
  const { default: request } = await import("supertest");
  const r = await request(app).post("/api/auth/login").send({ usuario, password });
  if (r.status !== 200) throw new Error(`login ${usuario}: ${r.status}`);
  return r.body.token as string;
}

beforeAll(async () => {
  const archivo = path.join(dirPrismaPerm, "permisos.db");
  prepararDb(archivo, existsSync("backend") ? "backend" : ".");
  ({ app } = await import("../src/app"));
  ({ prisma } = await import("../src/config/db"));
  await sembrar("admperm", "Administrador", "Admin1234");
  await sembrar("evaperm", "Evaluador", "Eva12345");
  await sembrar("conperm", "Consulta", "Con12345");
  admin = await token("admperm", "Admin1234");
  evaluador = await token("evaperm", "Eva12345");
  consulta = await token("conperm", "Con12345");
  console.log("DBG-USUARIOS:", JSON.stringify(await prisma.usuario.findMany({
    select: { id_usuario: true, usuario: true, rol: true, activo: true },
  })));
}, 120000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("matriz de permisos", () => {
  it("Evaluador: 403 en eliminar estudiante, crear carrera y pesos; 201 al evaluar", async () => {
    const ev = () => req(app, evaluador);
    expect((await ev().delete("/api/estudiantes/1")).status).toBe(403);
    expect((await ev().post("/api/carreras").send({ nombre: "X" })).status).toBe(403);
    expect((await ev().put("/api/criterios/pesos").send({ pesos: [] })).status).toBe(403);
    const est = await req(app, admin).post("/api/estudiantes").send({
      nombre: "P", apellido: "Q", carrera: "X", promedio: 80, ingreso_familiar: 100,
    });
    const ok = await ev().post("/api/evaluaciones").send({
      id_estudiante: est.body.id_estudiante, fecha: "2025-09-01",
      puntaje_academico: 80, puntaje_social: 80, puntaje_final: 80,
    });
    expect(ok.status).toBe(201);
  });

  it("Consulta: 403 al calcular; 200 en reportes", async () => {
    const co = () => req(app, consulta);
    expect(
      (await co().post("/api/evaluaciones/calcular").send({
        id_estudiante: 1,
        criterios: { rendimiento: 80, asistencia: 80, situacion: 80, carga: 80, vulnerable: 80 },
      })).status,
    ).toBe(403);
    expect((await co().get("/api/reportes/resumen")).status).toBe(200);
    expect((await co().get("/api/estudiantes")).status).toBe(200);
    expect((await co().post("/api/estudiantes").send({})).status).toBe(403);
  });

  it("Admin: todo 2xx (muestra)", async () => {
    const ad = () => req(app, admin);
    expect((await ad().get("/api/usuarios")).status).toBe(200);
    expect((await ad().post("/api/dev/reset")).status).toBe(200);
  });

  it("toda ruta registrada tiene permiso (salvo públicas)", async () => {
    // Import dinámico: un import estático evaluaría config/db antes de
    // fijar DATABASE_URL y apuntaría a dev.db (D62).
    const { router } = await import("../src/routes");
    const PUBLICAS = ["/health", "/auth/login", "/auth/me", "/auth/cambiar-password"];
    const sinPermiso: string[] = [];
    const stack = (router.stack ?? []) as Array<{
      route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle?: unknown }> };
    }>;
    for (const layer of stack) {
      const route = layer.route;
      if (!route) continue;
      const metodos = Object.keys(route.methods)
        .filter((m) => route.methods[m] && m !== "_all")
        .map((m) => m.toUpperCase())
        .join(",");
      const tiene = route.stack.some(
        (l) => typeof (l.handle as { permiso?: unknown } | undefined)?.permiso === "string",
      );
      if (!tiene && !PUBLICAS.includes(route.path)) {
        sinPermiso.push(`${metodos} ${route.path}`);
      }
    }
    expect(sinPermiso).toEqual([]);
  });
});
