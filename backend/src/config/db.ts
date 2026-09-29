import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

/**
 * SQLite: WAL + espera de 5 s ante bloqueo (varios usuarios o Prisma Studio).
 * Idempotente y tolerante (p. ej. base en memoria de tests).
 */
async function aplicarPragmas(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
  } catch {
    // Sin SQLite persistente: se continúa sin WAL.
  }
}

export const dbLista = aplicarPragmas();
