import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertsPanel } from "../components/AlertsPanel";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { EstadoChart } from "../components/EstadoChart";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { RankingTable, type RankingRow } from "../components/RankingTable";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { fetchDashboard } from "../services/api/dashboard";
import { clasificarPuntaje, nombreCompleto } from "../utils/dss";

/** dashboard-dss.png → /dashboard. GET /estudiantes (mock con VITE_USE_MOCKS=true). */
export function DashboardPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isPending) {
    return (
      <div className="page">
        <PageHeader title="Dashboard DSS - Panel principal" />
        <Spinner texto="Cargando panel…" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page">
        <PageHeader title="Dashboard DSS - Panel principal" />
        <EmptyState
          titulo="No se pudo cargar el panel"
          detalle="Verificá VITE_API_URL o activá VITE_USE_MOCKS=true."
          accion={
            <Button type="button" onClick={() => void refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const porEstudiante = new Map(data.estudiantes.map((e) => [e.id_estudiante, e]));
  // #1: una fila por estudiante con su mejor puntaje.
  const mejores = new Map<number, (typeof data.evaluaciones)[number]>();
  for (const ev of data.evaluaciones) {
    const actual = mejores.get(ev.id_estudiante ?? -1);
    if (!actual || (ev.puntaje_final ?? 0) > (actual.puntaje_final ?? 0)) {
      mejores.set(ev.id_estudiante ?? -1, ev);
    }
  }
  const ranking: RankingRow[] = [...mejores.values()]
    .sort((a, b) => (b.puntaje_final ?? 0) - (a.puntaje_final ?? 0))
    .slice(0, 5)
    .map((ev, i) => {
      const e = porEstudiante.get(ev.id_estudiante);
      const puntaje = ev.puntaje_final ?? 0;
      return {
        posicion: i + 1,
        estudiante: e ? nombreCompleto(e) : `ID ${ev.id_estudiante}`,
        puntaje,
        estado: clasificarPuntaje(puntaje),
      };
    });

  return (
    <div className="page">
      <PageHeader title="Dashboard DSS - Panel principal" />
      {!data.live && <p className="muted">Datos de demostración (VITE_USE_MOCKS=true).</p>}

      <div className="kpi-grid">
        <KpiCard label="Estudiantes evaluados" value={data.resumen.evaluados} tone="teal" />
        <KpiCard label="Candidatos recomendados" value={data.resumen.recomendados} tone="navy" />
        <KpiCard label="En revisión" value={data.resumen.en_revision} tone="gold" />
        <KpiCard label="En riesgo" value={data.resumen.en_riesgo} tone="red" />
      </div>

      <div className="cols-2">
        <Card title="Ranking de candidatos">
          {ranking.length === 0 ? (
            <EmptyState
              titulo="Sin evaluaciones"
              detalle="Todavía no hay puntajes para mostrar."
              accion={<Link to={ROUTES.nuevaEvaluacion}>Ir a evaluar</Link>}
            />
          ) : (
            <RankingTable rows={ranking} />
          )}
        </Card>
        <Card title="Alertas">
          <AlertsPanel alertas={data.alertas} />
        </Card>
      </div>

      <Card title="Distribución de estudiantes por estado">
        <EstadoChart
          items={[
            { label: "Recomendado", value: data.resumen.recomendados, tone: "teal" },
            { label: "En revisión", value: data.resumen.en_revision, tone: "gold" },
            { label: "En riesgo", value: data.resumen.en_riesgo, tone: "red" },
          ]}
        />
      </Card>
    </div>
  );
}
