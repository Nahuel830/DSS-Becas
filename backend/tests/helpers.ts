import type { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { execSync } from "child_process";
import type { Express } from "express";
import { existsSync, rmSync } from "fs";
import request, { type Test } from "supertest";

type Metodo = "get" | "post" | "put" | "delete";

/**
 * Prepara una base SQLite aislada: borra el archivo y sus sidecars WAL
 * (si no, frames viejos contaminan el próximo run).
 */
export function prepararDb(archivo: string, cwd: string): void {
  for (const f of [archivo, `${archivo}-wal`, `${archivo}-shm`, `${archivo}-journal`]) {
    if (existsSync(f)) rmSync(f);
  }
  execSync("npx prisma db push --skip-generate", { cwd, stdio: "pipe" });
}

/** Crea (o actualiza) un admin de prueba y devuelve un JWT válido. */
export async function loginAdmin(
  app: Express,
  prisma: PrismaClient,
  usuario = "admintest",
  password = "Test1234",
): Promise<string> {
  await prisma.usuario.upsert({
    where: { correo: `${usuario}@test.bo` },
    update: { password_hash: bcryptjs.hashSync(password, 10), activo: true, token_version: 0 },
    create: {
      usuario,
      nombre: "Admin Test",
      correo: `${usuario}@test.bo`,
      rol: "Administrador",
      password_hash: bcryptjs.hashSync(password, 10),
    },
  });
  const r = await request(app).post("/api/auth/login").send({ usuario, password });
  if (r.status !== 200 || !r.body.token) {
    throw new Error(`login helper falló: ${r.status} ${JSON.stringify(r.body)}`);
  }
  return r.body.token as string;
}

/** Cliente supertest con Authorization Bearer precargado. */
export function req(app: Express, token: string): Record<Metodo, (url: string) => Test> {
  const m =
    (metodo: Metodo) =>
    (url: string): Test =>
      (request(app)[metodo](url) as Test).set("Authorization", `Bearer ${token}`);
  return { get: m("get"), post: m("post"), put: m("put"), delete: m("delete") };
}
