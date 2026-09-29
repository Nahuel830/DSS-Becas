import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { catalogosApi } from "../services/api/catalogos";
import { reportesApi } from "../services/api/reportes";
import { useToast } from "../state/ToastContext";
import { formatMonedaBs } from "../utils/format";

const COLORES = ["#0e7c7b", "#0f2a3d", "#8a6d00", "#b03a2e", "#5a6975"];

/** Reportes de la convocatoria (#7). */
export function ReportesPage() {
  const [convocatoriaId, setConvocatoriaId] = useState("");
  const toast = useToast();

  const convs = useQuery({ queryKey: ["cfg-convocatorias"], queryFn: catalogosApi.convocatorias.listar });
  const resumen = useQuery({
    queryKey: ["reporte-resumen", convocatoriaId],
    queryFn: () => reportesApi.resumen(convocatoriaId || undefined),
  });

  const descargar = async (cual: "ranking" | "asignaciones") => {
    try {
      if (cual === "ranking") await reportesApi.rankingCsv();
      else await reportesApi.asignacionesCsv();
      toast.exito("Descarga iniciada.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo descargar.");
    }
  };

  const d = resumen.data;

  return (
    <div className="page">
      <PageHeader title="Reportes" />
      <div className="toolbar no-print">
        <select className="input toolbar-search" aria-label="Convocatoria" value={convocatoriaId} onChange={(e) => setConvocatoriaId(e.target.value)}>
          <option value="">Todas las convocatorias</option>
          {(convs.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} ({c.gestion})</option>
          ))}
        </select>
        <Button variant="secondary" type="button" onClick={() => void descargar("ranking")}>
          Descargar CSV ranking
        </Button>
        <Button variant="secondary" type="button" onClick={() => void descargar("asignaciones")}>
          Descargar CSV asignaciones
        </Button>
        <Button variant="secondary" type="button" onClick={() => window.print()}>
          Imprimir
        </Button>
      </div>

      {resumen.isPending && <Spinner texto="Cargando reporte…" />}
      {resumen.isError && (
        <EmptyState
          titulo="No se pudo cargar el reporte"
          detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
          accion={<Button type="button" onClick={() => void resumen.refetch()}>Reintentar</Button>}
        />
      )}
      {d && (
        <>
          <div className="kpi-grid">
            <KpiCard label="Postulantes" value={d.postulantes} tone="teal" />
            <KpiCard label="Evaluados" value={d.evaluados} tone="navy" />
            <KpiCard label="Aprobados" value={d.aprobados} tone="gold" />
            <KpiCard label="En riesgo" value={d.en_riesgo} tone="red" />
          </div>
          <p className="muted">
            Monto asignado: {formatMonedaBs(d.monto_asignado)} de {formatMonedaBs(d.presupuesto)} ·
            Puntaje promedio: {d.puntaje_promedio} · Rechazados: {d.rechazados} · En observación: {d.en_observacion}
          </p>

          <div className="cols-2">
            <Card title="Evaluados por carrera">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.por_carrera} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <XAxis dataKey="carrera" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" radius={[2, 2, 0, 0]}>
                    {d.por_carrera.map((r, i) => (
                      <Cell key={r.carrera} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Monto por tipo de beca">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.por_tipo} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`Bs ${v}`, "Monto"]} />
                  <Bar dataKey="monto" radius={[2, 2, 0, 0]}>
                    {d.por_tipo.map((r, i) => (
                      <Cell key={r.tipo} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Estados de asignación">
            {d.aprobados + d.rechazados + d.en_observacion === 0 ? (
              <p className="muted">Sin asignaciones registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Aprobados", value: d.aprobados, fill: COLORES[0] },
                      { name: "Rechazados", value: d.rechazados, fill: COLORES[3] },
                      { name: "En observación", value: d.en_observacion, fill: COLORES[2] },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {[
                      { name: "Aprobados", value: d.aprobados },
                      { name: "Rechazados", value: d.rechazados },
                      { name: "En observación", value: d.en_observacion },
                    ].map((s, i) => (
                      <Cell key={s.name} fill={COLORES[[0, 3, 2][i]]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
