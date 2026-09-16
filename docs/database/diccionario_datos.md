# Diccionario de Datos - DSS Becas

## Tabla: ESTUDIANTE
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_estudiante | INT | PK, Auto Increment | Identificador único del estudiante |
| nombre | VARCHAR(100) | NOT NULL | Nombre del estudiante |
| apellido | VARCHAR(100) | NOT NULL | Apellido del estudiante |
| carrera | VARCHAR(100) | NOT NULL | Carrera que cursa |
| promedio | DECIMAL(5,2) | NOT NULL | Promedio académico |
| ingreso_familiar | DECIMAL(10,2) | NOT NULL | Ingreso mensual familiar |

## Tabla: EVALUACION
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_evaluacion | INT | PK, Auto Increment | Identificador de la evaluación |
| id_estudiante | INT | FK, NOT NULL | Estudiante evaluado |
| fecha | DATE | NOT NULL | Fecha de la evaluación |
| puntaje_academico | DECIMAL(5,2) | NOT NULL | Puntaje académico calculado |
| puntaje_social | DECIMAL(5,2) | NOT NULL | Puntaje social calculado |
| puntaje_final | DECIMAL(5,2) | NOT NULL | Puntaje total DSS |

## Tabla: RESULTADO
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_resultado | INT | PK, Auto Increment | Identificador del resultado |
| id_estudiante | INT | FK, NOT NULL | Estudiante evaluado |
| resultado | VARCHAR(100) | NOT NULL | Descripción del resultado (Recomendado, etc.) |

## Tabla: BECA
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id_beca | INT | PK, Auto Increment | Identificador de la beca |
| id_estudiante | INT | FK, NOT NULL | Estudiante beneficiado |
| nombre_beca | VARCHAR(100) | NOT NULL | Nombre de la beca |
| tipo | VARCHAR(50) | NOT NULL | Tipo de beca (Excelencia, Social) |
| monto | DECIMAL(10,2) | NOT NULL | Monto asignado |
| estado | VARCHAR(50) | NOT NULL | Estado (Activa, Inactiva) |
