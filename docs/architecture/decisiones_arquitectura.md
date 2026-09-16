# Decisiones de Arquitectura

## 1. Uso de Arquitectura por Capas
Se optó por separar la presentación, la lógica de negocio y los datos para facilitar el mantenimiento y la escalabilidad del sistema.

## 2. API RESTful
Se implementa una API REST utilizando formato JSON para permitir la integración futura con otras plataformas universitarias.

## 3. Base de Datos Relacional
Dado el modelo de datos estructurado (Estudiantes, Evaluaciones, Becas), se decidió utilizar una base de datos relacional que asegure la integridad transaccional.
