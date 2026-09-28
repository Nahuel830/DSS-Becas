-- CreateTable
CREATE TABLE "Seguimiento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_asignacion" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "promedio_periodo" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Al día',
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Seguimiento_id_asignacion_fkey" FOREIGN KEY ("id_asignacion") REFERENCES "Asignacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Seguimiento_id_asignacion_idx" ON "Seguimiento"("id_asignacion");
