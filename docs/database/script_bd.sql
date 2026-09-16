CREATE DATABASE IF NOT EXISTS dss_becas;
USE dss_becas;

CREATE TABLE ESTUDIANTE (
    id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    carrera VARCHAR(100) NOT NULL,
    promedio DECIMAL(5,2) NOT NULL,
    ingreso_familiar DECIMAL(10,2) NOT NULL
);

CREATE TABLE EVALUACION (
    id_evaluacion INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    fecha DATE NOT NULL,
    puntaje_academico DECIMAL(5,2) NOT NULL,
    puntaje_social DECIMAL(5,2) NOT NULL,
    puntaje_final DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante)
);

CREATE TABLE RESULTADO (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    resultado VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante)
);

CREATE TABLE BECA (
    id_beca INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    nombre_beca VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_estudiante) REFERENCES ESTUDIANTE(id_estudiante)
);
