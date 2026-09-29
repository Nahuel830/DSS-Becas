import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { seguimientoApi } from "../services/api/seguimiento";
import { useToast } from "../state/ToastContext";
import { usePermiso } from "../state/Permisos";
import { formatFecha, formatPuntaje } from "../utils/format";

/** Seguimiento académico: una fila por becario con historial expandible. */
export function SeguimientoPage() {
  const [estado, setEstado] = useState("");
  const [carrera, setCarrera] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [promedio, setPromedio] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const toast = useToast();
  const puedeRegistrar = usePermiso("seguimiento:editar");
  const queryClient = useQueryClient();

  const lista = useQuery({
    queryKey: ["seguimiento-becarios", estado, carrera],
    queryFn: () => seguimientoApi.becarios({ estado: estado || undefined, carrera: carrera || undefined }),
  });
  const hist = useQuery({
    queryKey: ["seguimiento-hist", expandido],
    queryFn: () => seguimientoApi.porAsignacion(expandido ?? 0),
    enabled: expandido !== null,
  });

  const registrar = useMutation({
    mutationFn: () =>
      seguimientoApi.crear({
        id_asignacion: expandido ?? 0,
        fecha,
        periodo: periodo.trim(),
        promedio_periodo: Number(promedio),
        observaciones: observaciones.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seguimiento-becarios"] });
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
    if (expandido === null || !periodo.trim()) {
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

  const alternar = (idAsignacion: number) => {
    setExpandido((actual) => (actual === idAsignacion ? null : idAsignacion));
  };

  const carreras = [...new Set((lista.data ?? []).map((b) => b.estudiante.carrera).filter(Boolean))];

  return (
    <div className="page">
      <PageHeader title="Seguimiento académico" />
      <div className="filters">
        <select className="input" aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {["Al día", "En riesgo", "Suspendida", "Sin registros"].map((s) => (
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

      <Card title={`Becarios (${lista.data?.length ?? 0})`}>
        {lista.isPending && <Spinner texto="Cargando seguimiento…" />}
        {lista.isError && (
          <EmptyState
            titulo="No se pudo cargar"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={<Button type="button" onClick={() => void lista.refetch()}>Reintentar</Button>}
          />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length === 0 && (
          <EmptyState titulo="Sin becarios" detalle="Todavía no hay asignaciones aprobadas." />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Becario</th>
                  <th>Carrera</th>
                  <th>Beca</th>
                  <th>Último periodo</th>
                  <th>Último promedio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((b) => (
                  <Fragment key={b.id_asignacion}>
                    <tr>
                      <td>{`${b.estudiante.nombre} ${b.estudiante.apellido}`.trim() || "-"}</td>
                      <td>{b.estudiante.carrera || "-"}</td>
                      <td>{b.tipoBeca.nombre || "-"}</td>
                      <td>{b.ultimo_periodo ?? "-"}</td>
                      <td>{b.ultimo_promedio === null ? "-" : formatPuntaje(b.ultimo_promedio)}</td>
                      <td>{b.estado}</td>
                      <td>
                        <button className="link-btn" type="button" onClick={() => alternar(b.id_asignacion)}>
                          {expandido === b.id_asignacion ? "Ocultar historial" : "Ver historial"}
                        </button>
                      </td>
                    </tr>
                    {expandido === b.id_asignacion && (
                      <tr key={`hist-${b.id_asignacion}`} className="fila-expandida">
                        <td colSpan={7}>
                          {hist.isPending && <Spinner texto="Cargando historial…" />}
                          {hist.data && hist.data.historial.length === 0 && (
                            <p className="muted">Sin periodos registrados para este becario.</p>
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
                          {puedeRegistrar && (
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
                              </div>
                            </form>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
