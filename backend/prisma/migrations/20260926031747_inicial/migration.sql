-- CreateTable
CREATE TABLE "Estudiante" (
    "id_estudiante" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "ci" TEXT,
    "fecha_nacimiento" TEXT,
    "genero" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "carrera" TEXT NOT NULL,
    "codigo_universitario" TEXT,
    "facultad" TEXT,
    "semestre" INTEGER,
    "promedio" REAL NOT NULL,
    "materias_aprobadas" INTEGER,
    "materias_reprobadas" INTEGER,
    "anio_ingreso" INTEGER,
    "ingreso_familiar" REAL NOT NULL,
    "integrantes_hogar" INTEGER,
    "dependientes" INTEGER,
    "tipo_vivienda" TEXT,
    "procedencia" TEXT,
    "discapacidad" TEXT,
    "situacion_laboral" TEXT,
    "motivo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id_evaluacion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER NOT NULL,
    "fecha" TEXT NOT NULL,
    "puntaje_academico" REAL NOT NULL,
    "puntaje_social" REAL NOT NULL,
    "puntaje_final" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evaluacion_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resultado" (
    "id_resultado" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER NOT NULL,
    "resultado" TEXT NOT NULL,
    CONSTRAINT "Resultado_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Beca" (
    "id_beca" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER NOT NULL,
    "nombre_beca" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "estado" TEXT NOT NULL,
    CONSTRAINT "Beca_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Carrera" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "facultad" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "TipoBeca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" REAL NOT NULL,
    "cupos" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "gestion" TEXT NOT NULL,
    "inicio" TEXT,
    "fin" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Abierta',
    "presupuesto" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Criterio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "peso" REAL NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'beneficio',
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Documento_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evento" (
    "id_evento" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    CONSTRAINT "Evento_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_estudiante" INTEGER NOT NULL,
    "id_convocatoria" INTEGER NOT NULL,
    "id_tipo_beca" INTEGER NOT NULL,
    "puntaje" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Aprobada',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asignacion_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "Estudiante" ("id_estudiante") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asignacion_id_convocatoria_fkey" FOREIGN KEY ("id_convocatoria") REFERENCES "Convocatoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Asignacion_id_tipo_beca_fkey" FOREIGN KEY ("id_tipo_beca") REFERENCES "TipoBeca" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_ci_key" ON "Estudiante"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_correo_key" ON "Estudiante"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_codigo_universitario_key" ON "Estudiante"("codigo_universitario");

-- CreateIndex
CREATE INDEX "Evaluacion_id_estudiante_idx" ON "Evaluacion"("id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "Resultado_id_estudiante_key" ON "Resultado"("id_estudiante");

-- CreateIndex
CREATE INDEX "Beca_id_estudiante_idx" ON "Beca"("id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_nombre_key" ON "Carrera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoBeca_nombre_key" ON "TipoBeca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Criterio_nombre_key" ON "Criterio"("nombre");

-- CreateIndex
CREATE INDEX "Documento_id_estudiante_idx" ON "Documento"("id_estudiante");

-- CreateIndex
CREATE INDEX "Evento_id_estudiante_idx" ON "Evento"("id_estudiante");

-- CreateIndex
CREATE UNIQUE INDEX "Asignacion_id_estudiante_id_convocatoria_id_tipo_beca_key" ON "Asignacion"("id_estudiante", "id_convocatoria", "id_tipo_beca");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
