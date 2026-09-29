import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { seguimientoApi } from "../services/api/seguimiento";
import { useToast } from "../state/ToastContext";
import { useAuth } from "../state/AuthContext";
import { formatFecha, formatPuntaje } from "../utils/format";

/** Seguimiento académico de becarios (#6). */
export function SeguimientoPage() {
  const [estado, setEstado] = useState("");
  const [carrera, setCarrera] = useState("");
  const [verHistorial, setVerHistorial] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [promedio, setPromedio] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const toast = useToast();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const lista = useQuery({
    queryKey: ["seguimiento", estado, carrera],
    queryFn: () => seguimientoApi.listar({ estado: estado || undefined, carrera: carrera || undefined }),
  });
  const hist = useQuery({
    queryKey: ["seguimiento-hist", verHistorial],
    queryFn: () => seguimientoApi.porAsignacion(verHistorial ?? 0),
    enabled: verHistorial !== null,
  });

  const registrar = useMutation({
    mutationFn: () =>
      seguimientoApi.crear({
        id_asignacion: verHistorial ?? 0,
        fecha,
        periodo: periodo.trim(),
        promedio_periodo: Number(promedio),
        observaciones: observaciones.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seguimiento"] });
      queryClient.invalidateQueries({ queryKey: ["seguimiento-hist"] });
      toast.exito("Periodo registrado.");
      setPeriodo("");
      setPromedio("");
      setObservaciones("");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo registrar."),
  });

  const guardarPeriodo = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (verHistorial === null || !periodo.trim()) {
      toast.advertencia("Indicá el periodo.");
      return;
    }
    const v = Number(promedio);
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      toast.advertencia("El promedio debe estar entre 0 y 100.");
      return;
    }
    registrar.mutate();
  };

  const carreras = [...new Set((lista.data ?? []).map((s) => s.asignacion?.estudiante?.carrera).filter(Boolean))];

  return (
    <div className="page">
      <PageHeader title="Seguimiento académico" />
      <div className="filters">
        <select className="input" aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {["Al día", "En riesgo", "Suspendida"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input" aria-label="Filtrar por carrera" value={carrera} onChange={(e) => setCarrera(e.target.value)}>
          <option value="">Todas las carreras</option>
          {carreras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(estado || carrera) && (
          <Button variant="secondary" type="button" onClick={() => { setEstado(""); setCarrera(""); }}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <Card title={`Registros (${lista.data?.length ?? 0})`}>
        {lista.isPending && <Spinner texto="Cargando seguimiento…" />}
        {lista.isError && (
          <EmptyState
            titulo="No se pudo cargar"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={<Button type="button" onClick={() => void lista.refetch()}>Reintentar</Button>}
          />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length === 0 && (
          <EmptyState titulo="Sin registros" detalle="Todavía no hay periodos registrados." />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Becario</th>
                  <th>Carrera</th>
                  <th>Periodo</th>
                  <th>Promedio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((s) => (
                  <tr key={s.id}>
                    <td>{s.asignacion?.estudiante ? `${s.asignacion.estudiante.nombre ?? ""} ${s.asignacion.estudiante.apellido ?? ""}`.trim() : "-"}</td>
                    <td>{s.asignacion?.estudiante?.carrera ?? "-"}</td>
                    <td>{s.periodo}</td>
                    <td>{formatPuntaje(s.promedio_periodo)}</td>
                    <td>{s.estado}</td>
                    <td>
                      <button className="link-btn" type="button" onClick={() => setVerHistorial(s.id_asignacion)}>
                        Ver historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {verHistorial !== null && (
        <Card title="Historial del becario">
          {hist.isPending && <Spinner texto="Cargando historial…" />}
          {hist.data && hist.data.historial.length === 0 && (
            <p className="muted">Sin periodos registrados para esta asignación.</p>
          )}
          {hist.data && hist.data.historial.length > 0 && (
            <ul className="timeline">
              {hist.data.historial.map((h) => (
                <li key={h.id}>
                  {h.periodo}: promedio {formatPuntaje(h.promedio_periodo)} — {h.estado}
                  <small className="muted">{formatFecha(h.fecha)}</small>
                </li>
              ))}
            </ul>
          )}
          {hist.data?.sugerencia_suspension && (
            <p className="error">Sugerencia: dos periodos en riesgo seguidos — evaluar "Suspendida".</p>
          )}
          {auth.puedeEditar && (
          <form onSubmit={guardarPeriodo} noValidate>
            <h4>Registrar periodo</h4>
            <div className="form-grid">
              <FormField label="Periodo *">
                <input className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2025-II" />
              </FormField>
              <FormField label="Promedio *">
                <input className="input" type="number" min={0} max={100} step="0.01" value={promedio} onChange={(e) => setPromedio(e.target.value)} />
              </FormField>
              <FormField label="Fecha">
                <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Observaciones">
              <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </FormField>
            <div className="form-actions">
              <Button type="submit" disabled={registrar.isPending}>
                {registrar.isPending ? "Guardando…" : "Guardar periodo"}
              </Button>
              <Button variant="secondary" type="button" onClick={() => setVerHistorial(null)}>
                Cerrar
              </Button>
            </div>
          </form>
          )}
          {!auth.puedeEditar && (
            <Button variant="secondary" type="button" onClick={() => setVerHistorial(null)}>
              Cerrar
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
