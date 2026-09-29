/*
  Warnings:

  - Made the column `usuario` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "password_hash" TEXT,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acceso" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Usuario" ("activo", "correo", "createdAt", "debe_cambiar_password", "id_usuario", "nombre", "password_hash", "rol", "token_version", "ultimo_acceso", "usuario") SELECT "activo", "correo", "createdAt", "debe_cambiar_password", "id_usuario", "nombre", "password_hash", "rol", "token_version", "ultimo_acceso", "usuario" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
