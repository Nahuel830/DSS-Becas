import { useQuery } from "@tanstack/react-query";
import { AlertsPanel } from "../components/AlertsPanel";
import { Card } from "../components/Card";
import { EstadoChart } from "../components/EstadoChart";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { RankingTable, type RankingRow } from "../components/RankingTable";
import { fetchDashboard } from "../services/api/dashboard";
import { clasificarPuntaje } from "../utils/dss";

/** dashboard-dss.png → /dashboard. GET /estudiantes (mock local si no hay backend). */
export function DashboardPage() {
  const { data, isPending } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  if (isPending || !data) {
    return (
      <div className="page">
        <PageHeader title="Dashboard DSS - Panel principal" />
        <p className="muted">Cargando panel…</p>
      </div>
    );
  }

  const porEstudiante = new Map(data.estudiantes.map((e) => [e.id_estudiante, e]));
  const rows: RankingRow[] = [...data.evaluaciones]
    .sort((a, b) => (b.puntaje_final ?? 0) - (a.puntaje_final ?? 0))
    .map((ev, i) => {
      const e = porEstudiante.get(ev.id_estudiante);
      const puntaje = ev.puntaje_final ?? 0;
      return {
        posicion: i + 1,
        estudiante: e ? `${e.nombre ?? ""} ${e.apellido ?? ""}`.trim() : `ID ${ev.id_estudiante}`,
        puntaje,
        estado: clasificarPuntaje(puntaje),
      };
    });

  return (
    <div className="page">
      <PageHeader title="Dashboard DSS - Panel principal" />
      {!data.live && <p className="muted">Datos de demostración (sin backend en VITE_API_URL).</p>}

      <div className="kpi-grid">
        <KpiCard label="Estudiantes evaluados" value={data.resumen.evaluados} tone="teal" />
        <KpiCard label="Candidatos recomendados" value={data.resumen.recomendados} tone="navy" />
        <KpiCard label="En revisión" value={data.resumen.en_revision} tone="gold" />
        <KpiCard label="En riesgo" value={data.resumen.en_riesgo} tone="red" />
      </div>

      <div className="cols-2">
        <Card title="Ranking de candidatos">
          <RankingTable rows={rows} />
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
