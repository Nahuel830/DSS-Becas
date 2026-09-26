import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { EstudiantesTable, type EstudianteRow } from "../components/EstudiantesTable";
import { PageHeader } from "../components/PageHeader";
import { ROUTES } from "../routing/routes";
import { fetchDashboard } from "../services/api/dashboard";
import { MOCK_BECAS } from "../services/api/mocks";
import { clasificarPuntaje, codigoEstudiante, getEvaluacion, nombreCompleto } from "../utils/dss";

/** gestion-estudiantes.png → /estudiantes. GET /estudiantes (mock si no hay backend). */
export function EstudiantesPage() {
  const [busqueda, setBusqueda] = useState("");
  const { data, isPending } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isPending || !data) {
    return (
      <div className="page">
        <PageHeader title="Gestión de estudiantes" />
        <p className="muted">Cargando estudiantes…</p>
      </div>
    );
  }

  // Sin GET /becas en el contrato: becas mock. Puntajes desde las evaluaciones.
  const evaluaciones = data.evaluaciones;
  const rows: EstudianteRow[] = data.estudiantes.map((e) => {
    const id = e.id_estudiante ?? 0;
    const ev = getEvaluacion(evaluaciones, id);
    const puntaje = ev?.puntaje_final ?? null;
    const becaActiva = MOCK_BECAS.some((b) => b.id_estudiante === id && b.estado === "Activa");
    return {
      id,
      codigo: codigoEstudiante(e.id_estudiante),
      nombre: nombreCompleto(e),
      carrera: e.carrera ?? "-",
      estadoBeca: becaActiva ? "Activa" : puntaje !== null ? clasificarPuntaje(puntaje) : "Pendiente",
      puntaje,
    };
  });

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? rows.filter((r) => `${r.codigo} ${r.nombre} ${r.carrera}`.toLowerCase().includes(q))
    : rows;

  return (
    <div className="page">
      <PageHeader title="Gestión de estudiantes" />
      <div className="toolbar">
        <Link className="btn btn-primary" to={ROUTES.nuevoEstudiante}>
          + Nuevo estudiante
        </Link>
        <input
          className="input toolbar-search"
          type="search"
          placeholder="Buscar estudiante…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <Card title={`Estudiantes (${filtrados.length})`}>
        <EstudiantesTable rows={filtrados} />
      </Card>
    </div>
  );
}
