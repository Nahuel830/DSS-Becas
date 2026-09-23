import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { CriterioBar } from "../components/CriterioBar";
import { EstadoBadge } from "../components/EstadoBadge";
import { PageHeader } from "../components/PageHeader";
import type { EstadoEstudiante } from "../models/domain";
import { ROUTES } from "../routing/routes";
import { fetchDashboard } from "../services/api/dashboard";
import { MOCK_BECAS, MOCK_CRITERIOS, MOCK_EVALUACION_PEDRO, MOCK_HISTORIAL } from "../services/api/mocks";
import { resultadosApi } from "../services/api/resultados";
import { clasificarPuntaje, codigoEstudiante, nombreCompleto } from "../utils/dss";
import { formatPuntaje } from "../utils/format";

const ESTADOS_VALIDOS: EstadoEstudiante[] = ["Recomendado", "En revisión", "En riesgo", "Pendiente"];

/** detalle-estudiante.png → /estudiantes/:idEstudiante. GET /resultados/{id} (+ bundle). */
export function DetalleEstudiantePage() {
  const { idEstudiante } = useParams();
  const id = Number(idEstudiante);
  const valido = Number.isInteger(id) && id > 0;

  const dash = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const res = useQuery({
    queryKey: ["resultado", id],
    queryFn: () => resultadosApi.getByEstudianteConFallback(id),
    enabled: valido,
  });

  if (!valido) return <div className="page error">ID de estudiante inválido.</div>;
  if (dash.isPending || res.isPending || !dash.data || !res.data) {
    return (
      <div className="page">
        <PageHeader title="Detalle del estudiante" />
        <p className="muted">Cargando ficha…</p>
      </div>
    );
  }

  const estudiante = dash.data.estudiantes.find((e) => e.id_estudiante === id);
  if (!estudiante) {
    return (
      <div className="page">
        <PageHeader title="Detalle del estudiante" />
        <p className="error">Estudiante no encontrado.</p>
        <p><Link to={ROUTES.estudiantes}>Volver a gestión</Link></p>
      </div>
    );
  }

  const evaluacion = [...dash.data.evaluaciones, MOCK_EVALUACION_PEDRO].find((ev) => ev.id_estudiante === id);
  const puntaje = evaluacion?.puntaje_final ?? null;
  const beca = MOCK_BECAS.find((b) => b.id_estudiante === id);
  const criterios = MOCK_CRITERIOS[id];
  const historial = MOCK_HISTORIAL[id] ?? [];

  const etiquetado = res.data.data?.resultado;
  const estado: EstadoEstudiante =
    (etiquetado && ESTADOS_VALIDOS.includes(etiquetado as EstadoEstudiante)
      ? (etiquetado as EstadoEstudiante)
      : puntaje !== null ? clasificarPuntaje(puntaje) : "Pendiente");

  return (
    <div className="page">
      <PageHeader title="Detalle del estudiante" />
      <p><Link to={ROUTES.estudiantes}>← Volver a gestión</Link></p>
      <div className="cols-2">
        <Card title="Ficha del estudiante">
          <div className="profile">
            <Avatar nombre={estudiante.nombre} apellido={estudiante.apellido} />
            <strong className="profile-name">{nombreCompleto(estudiante)}</strong>
            <span className="muted">{codigoEstudiante(id)} / {estudiante.carrera ?? "-"}</span>
            <EstadoBadge estado={estado} />
          </div>
          <dl className="stats">
            <div><dt>Puntaje DSS</dt><dd>{formatPuntaje(puntaje)}</dd></div>
            <div><dt>Asistencia</dt><dd>{criterios ? `${criterios.asistencia}%` : "-"}</dd></div>
            <div><dt>Promedio</dt><dd>{estudiante.promedio !== undefined ? formatPuntaje(estudiante.promedio) : "-"}</dd></div>
            <div><dt>Beca actual</dt><dd>{beca ? beca.tipo : "-"}</dd></div>
          </dl>
        </Card>

        <div>
          <Card title="Evaluación DSS">
            {criterios ? (
              <>
                <CriterioBar label="Rendimiento académico" value={criterios.rendimiento} />
                <CriterioBar label="Asistencia" value={criterios.asistencia} />
                <CriterioBar label="Situación socioeconómica" value={criterios.situacion} />
                <CriterioBar label="Carga familiar" value={criterios.carga} />
                <CriterioBar label="Condición vulnerable" value={criterios.vulnerable} />
              </>
            ) : (
              <p className="muted">Sin evaluación registrada para este estudiante.</p>
            )}
          </Card>

          <Card title="Historial de seguimiento">
            {historial.length === 0 ? (
              <p className="muted">Sin historial registrado.</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr><th>Gestión</th><th>Promedio</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.gestion}>
                        <td>{h.gestion}</td>
                        <td>{formatPuntaje(h.promedio)}</td>
                        <td>{h.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
