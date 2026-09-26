# Pruebas manuales — Módulos 4 a 7

> Precondición: `cd frontend`, `.env` con `VITE_USE_MOCKS=true`, `npm run dev` (:8080). Los datos viven en localStorage (`dss-becas-db`); "Restablecer datos de prueba" está en el menú del avatar PB.

## CP-01 Dashboard con datos (RF-03/04/05, RF-08)

Pasos: abrir `/dashboard`. Esperado: 4 KPI calculados (27 evaluados, 14 recomendados, 9 en revisión, 4 en riesgo), ranking top 5 ordenado, 6 alertas, barras Recomendado/En revisión/En riesgo, nota de demostración.

## CP-02 Gestión: buscar y filtrar (RF-01, RF-08)

Pasos: ir a `/estudiantes`; escribir "quispe" en el buscador; filtrar carrera "Medicina"; limpiar filtros. Esperado: filtrado en tiempo real, URL con `?q=quispe`, "Limpiar filtros" restaura los 30.

## CP-03 Gestión: orden y paginación (RF-08)

Pasos: clic en "Puntaje DSS" (ordena asc/desc con ▲▼); cambiar a 20 por página; ir a página 2. Esperado: orden correcto (sin puntaje al final en asc), texto "Mostrando X–Y de Z".

## CP-04 Alta con errores (RF-01)

Pasos: "+ Nuevo estudiante"; Guardar vacío; CI "ABC"; CI de otro estudiante (p. ej. `87654321` si existe); correo inválido; promedio 150; nacimiento 2020. Esperado: un error en español por campo, scroll al primero, sin Toast de éxito.

## CP-05 Alta correcta (RF-01)

Entrada: Nombres "Prueba", Apellidos "Manual", CI "9999999", nacimiento 2000-01-01, carrera "Derecho", promedio 85, ingreso 3000. Esperado: Toast de éxito, navega a `/estudiantes/31`, estado Pendiente sin puntaje, aparece en el listado y el dashboard sigue en 27 evaluados.

## CP-06 Edición (RF-02)

Pasos: en el detalle del CP-05, "Editar"; cambiar promedio a 90; Guardar cambios. Esperado: Toast, detalle actualizado, evento en el historial.

## CP-07 Detalle completo (RF-06, RF-08)

Pasos: abrir `/estudiantes/1`. Esperado: ficha (María Fernández, EST-001, Recomendado, 92.5, 96 %, 88.0, Excelencia Bs 500.00), barras de evaluación, historial con eventos, secciones personal/académica/socioeconómica/postulación.

## CP-08 Evaluación desde el detalle (RF-03/04/05)

Pasos: "Evaluar con DSS" preselecciona al estudiante; completar criterios; Calcular. Esperado: `POST /evaluaciones` persiste en db, resultado y ranking del dashboard se actualizan, evento en historial.

## CP-09 Baja con confirmación (RF-01)

Pasos: en gestión, Eliminar al estudiante del CP-05; confirmar. Esperado: ConfirmDialog, Toast, la tabla se actualiza, el dashboard vuelve a sus totales.

## CP-10 Persistencia y restablecimiento

Pasos: tras CP-05, recargar la página (el estudiante 31 sigue); avatar PB → Restablecer datos de prueba → confirmar. Esperado: vuelven los 30 iniciales y el dashboard original.

## CP-11 Estudiante inexistente

Pasos: abrir `/estudiantes/9999`. Esperado: "Estudiante no encontrado" con botón al listado.

## CP-12 Asignación y reportes (RF-07, RF-08)

Pasos: con backend en marcha, ir a `/becas`; elegir convocatoria "2025-I" y tipo "Excelencia"; "Generar asignación". Esperado: Toast con cantidad, ranking con marcas, tarjetas de cupos/presupuesto actualizadas, fila en Asignaciones. Luego Exportar CSV y PDF (archivos descargados con encabezado y fecha).

## CP-13 Revocar asignación (RF-07)

Pasos: en Asignaciones, Revocar → confirmar. Esperado: Toast, cupos liberados, evento en el historial del estudiante.

## CP-14 Recorrido completo de aceptación

1. Avatar PB → Restablecer datos (quedan 30 estudiantes).
2. Revisar `/dashboard` (27 evaluados, top 5, barras).
3. Registrar estudiante: Ana Prueba, CI `11223344`, Derecho, promedio 91, ingreso 1500 → **Recomendado** (≈86.4 con criterios 92/90/88/80/75).
4. Registrar estudiante: Baja Nota, CI `44332211`, promedio 40, ingreso 5500 → **No recomendado** (≈41.3 con criterios 45/60/30/40/35).
5. Evaluar a ambos desde su detalle (botón "Evaluar con DSS").
6. En `/becas`, generar asignación Excelencia: Ana queda posicionada arriba.
7. Exportar ranking a CSV y abrirlo.
8. Comprobar dashboard actualizado; detener backend (`Ctrl+C`) y volver a iniciar: todo sigue guardado (SQLite).
