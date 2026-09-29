// Pruebas de autenticación y roles (base auth.db aislada).
// Ruta ABSOLUTA: Prisma resuelve file: relativo al schema, no al cwd.
import { existsSync } from "fs";
import path from "path";
const dirPrismaAuth = path.resolve(existsSync("backend") ? "backend/prisma" : "prisma");
process.env.DATABASE_URL = `file:${dirPrismaAuth.replace(/\\/g, "/")}/auth.db`;

import bcryptjs from "bcryptjs";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loginAdmin, prepararDb, req } from "./helpers";

let app: Express;
let prisma: (typeof import("../src/config/db"))["prisma"];
let adminToken = "";

const PASS = { admin: "Admin2026!", evaluador: "Evaluador2026!", consulta: "Consulta2026!" };

async function sembrar(usuario: string, nombre: string, correo: string, rol: string, password: string, activo = true): Promise<void> {
  await prisma.usuario.upsert({
    where: { correo },
    update: { password_hash: bcryptjs.hashSync(password, 10), activo, token_version: 0 },
    create: { usuario, nombre, correo, rol, password_hash: bcryptjs.hashSync(password, 10), activo },
  });
}

beforeAll(async () => {
  const archivo = path.join(dirPrismaAuth, "auth.db");
  prepararDb(archivo, existsSync("backend") ? "backend" : ".");
  ({ app } = await import("../src/app"));
  ({ prisma } = await import("../src/config/db"));
  await sembrar("admin", "Admin", "admin@universidad.bo", "Administrador", PASS.admin);
  await sembrar("evaluador", "Evaluador", "evaluador@universidad.bo", "Evaluador", PASS.evaluador);
  await sembrar("consulta", "Consulta", "consulta@universidad.bo", "Consulta", PASS.consulta);
  adminToken = await loginAdmin(app, prisma);
}, 120000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth: login", () => {
  it("ingresan los 3 usuarios y también por correo", async () => {
    for (const [usuario, password] of [["admin", PASS.admin], ["evaluador", PASS.evaluador], ["consulta", PASS.consulta]]) {
      const r = await request(app).post("/api/auth/login").send({ usuario, password });
      expect(r.status).toBe(200);
      expect(r.body.token).toBeDefined();
      expect(r.body.usuario.usuario).toBe(usuario);
      expect(r.body.password_hash).toBeUndefined();
      expect(r.body.usuario.password_hash).toBeUndefined();
    }
    const porCorreo = await request(app).post("/api/auth/login").send({ usuario: "  ADMIN@universidad.bo ", password: PASS.admin });
    expect(porCorreo.status).toBe(200);
  });

  it("contraseña mala → 401; inactivo → 403", async () => {
    expect((await request(app).post("/api/auth/login").send({ usuario: "admin", password: "mala" })).status).toBe(401);
    await prisma.usuario.update({ where: { correo: "consulta@universidad.bo" }, data: { activo: false } });
    expect(
      (await request(app).post("/api/auth/login").send({ usuario: "consulta", password: PASS.consulta })).status,
    ).toBe(403);
    await prisma.usuario.update({ where: { correo: "consulta@universidad.bo" }, data: { activo: true } });
  });

  it("sin password_hash en respuestas", async () => {
    const r = await req(app, adminToken).get("/api/usuarios");
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toContain("password_hash");
    const me = await req(app, adminToken).get("/api/auth/me");
    expect(me.body.password_hash).toBeUndefined();
  });
});

describe("auth: sesiones y roles", () => {
  it("usuario nuevo puede ingresar", async () => {
    const creado = await req(app, adminToken).post("/api/usuarios").send({
      usuario: "nuevo.eval", nombre: "Nuevo", correo: "nuevo@qa.bo", rol: "Evaluador", password: "Nuevo1234",
    });
    expect(creado.status).toBe(201);
    const login = await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval", password: "Nuevo1234" });
    expect(login.status).toBe(200);
  });

  it("cambiar usuario invalida el viejo y el token viejo", async () => {
    const login1 = await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval", password: "Nuevo1234" });
    const tokenViejo = login1.body.token as string;
    const u = await prisma.usuario.findUniqueOrThrow({ where: { correo: "nuevo@qa.bo" } });
    await req(app, adminToken).put(`/api/usuarios/${u.id_usuario}`).send({ usuario: "nuevo.eval2" });
    expect((await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval", password: "Nuevo1234" })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval2", password: "Nuevo1234" })).status).toBe(200);
    expect((await req(app, tokenViejo).get("/api/auth/me")).status).toBe(401);
  });

  it("cambiar contraseña invalida la vieja", async () => {
    const login = await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval2", password: "Nuevo1234" });
    const token = login.body.token as string;
    const r = await req(app, token).post("/api/auth/cambiar-password").send({ actual: "Nuevo1234", nueva: "Cambiada99" });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
    expect((await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval2", password: "Nuevo1234" })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ usuario: "nuevo.eval2", password: "Cambiada99" })).status).toBe(200);
    expect((await req(app, token).get("/api/auth/me")).status).toBe(401);
  });

  it("duplicado → 409; roles restringen", async () => {
    expect(
      (await req(app, adminToken).post("/api/usuarios").send({
        usuario: "admin", nombre: "X", correo: "x@qa.bo", rol: "Consulta", password: "Xxxx1234",
      })).status,
    ).toBe(409);
    const loginCon = await request(app).post("/api/auth/login").send({ usuario: "consulta", password: PASS.consulta });
    const tokenCon = loginCon.body.token as string;
    expect((await req(app, tokenCon).post("/api/estudiantes").send({})).status).toBe(403);
    const loginEv = await request(app).post("/api/auth/login").send({ usuario: "evaluador", password: PASS.evaluador });
    expect((await req(app, loginEv.body.token as string).get("/api/usuarios")).status).toBe(403);
    expect((await request(app).get("/api/estudiantes")).status).toBe(401);
  });

  it("no eliminar/desactivar al último admin ni a uno mismo", async () => {
    const me = await req(app, adminToken).get("/api/auth/me");
    const yo = me.body.id_usuario as number;
    // Solo hay un admin: desactivarse a sí mismo → 400 (regla uno mismo).
    expect((await req(app, adminToken).put(`/api/usuarios/${yo}/estado`).send({ activo: false })).status).toBe(400);
    // Crear segundo admin y eliminar al primero: el restante queda como último.
    const otro = await req(app, adminToken).post("/api/usuarios").send({
      usuario: "admin2", nombre: "A2", correo: "admin2@qa.bo", rol: "Administrador", password: "Admin2123",
    });
    expect((await req(app, adminToken).delete(`/api/usuarios/${otro.body.id_usuario}`)).status).toBe(204);
  });
});
