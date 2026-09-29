import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { ObservacionDialog } from "../components/ObservacionDialog";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { USE_MOCKS } from "../services/api/client";
import { asignacionesApi, type FilaRanking } from "../services/api/asignaciones";
import { catalogosApi } from "../services/api/catalogos";
import { fetchDashboard } from "../services/api/dashboard";
import { evaluacionesApi } from "../services/api/evaluaciones";
import { useToast } from "../state/ToastContext";
import { usePermiso } from "../state/Permisos";
import { clasificarPuntaje, nombreCompleto } from "../utils/dss";
import { exportarCSV, exportarPDF } from "../utils/export";
import { formatMonedaBs, formatPuntaje } from "../utils/format";

/** Gestión de becas: ranking, cupos/presupuesto, asignación y exportación. */
export function BecasPage() {
  const [convocatoriaId, setConvocatoriaId] = useState("");
  const [tipoBecaId, setTipoBecaId] = useState("");
  const [revocarId, setRevocarId] = useState<number | null>(null);
  const [decision, setDecision] = useState<{ id: number; estado: string } | null>(null);
  const toast = useToast();
  const puedeGenerar = usePermiso("asignaciones:generar");
  const puedeDecidir = usePermiso("asignaciones:decidir");
  const puedeRevocar = usePermiso("asignaciones:revocar");
  const puedeEvaluar = usePermiso("evaluaciones:crear");
  const puedeAccionar = puedeDecidir || puedeRevocar;
  const queryClient = useQueryClient();

  const convs = useQuery({ queryKey: ["cfg-convocatorias"], queryFn: catalogosApi.convocatorias.listar });
  const tipos = useQuery({ queryKey: ["cfg-tipos"], queryFn: catalogosApi.tiposBeca.listar });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  const conv = convocatoriaId || (convs.data?.[0] ? String(convs.data[0].id) : "");
  const tipo = tipoBecaId || (tipos.data?.[0] ? String(tipos.data[0].id) : "");
  const paramsListos = conv !== "" && tipo !== "" && !USE_MOCKS;

  const ranking = useQuery({
    queryKey: ["ranking", conv, tipo],
    queryFn: () => asignacionesApi.ranking(Number(conv), Number(tipo)),
    enabled: paramsListos,
  });
  const resumen = useQuery({
    queryKey: ["resumen-asig", conv, tipo],
    queryFn: () => asignacionesApi.resumen(Number(conv), Number(tipo)),
    enabled: paramsListos,
  });
  const asignadas = useQuery({
    queryKey: ["asignaciones", conv, tipo],
    queryFn: () => asignacionesApi.listar(Number(conv), Number(tipo)),
    enabled: paramsListos,
  });

  const filas: FilaRanking[] = ranking.data ?? (USE_MOCKS && dash.data
    ? [...dash.data.evaluaciones]
      .sort((a, b) => (b.puntaje_final ?? 0) - (a.puntaje_final ?? 0))
      .map((ev, i) => {
        const e = dash.data.estudiantes.find((x) => x.id_estudiante === ev.id_estudiante);
        const puntaje = ev.puntaje_final ?? 0;
        return {
          posicion: i + 1,
          id_estudiante: ev.id_estudiante ?? 0,
          nombre: e ? nombreCompleto(e) : `ID ${ev.id_estudiante}`,
          carrera: e?.carrera ?? "-",
          puntaje_final: puntaje,
          promedio: e?.promedio ?? 0,
          ingreso_familiar: e?.ingreso_familiar ?? 0,
          recomendacion: clasificarPuntaje(puntaje),
          asignado: false,
        };
      })
    : []);

  const generar = useMutation({
    mutationFn: () => asignacionesApi.generar(Number(conv), Number(tipo)),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["resumen-asig"] });
      queryClient.invalidateQueries({ queryKey: ["asignaciones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.exito(`Asignación generada: ${r.generadas} becas.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo generar."),
  });

  const evaluarPendientes = useMutation({
    mutationFn: () => evaluacionesApi.evaluarTodos(),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      queryClient.invalidateQueries({ queryKey: ["resumen-asig"] });
      queryClient.invalidateQueries({ queryKey: ["asignaciones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      queryClient.invalidateQueries({ queryKey: ["resultado"] });
      toast.exito(`Evaluación masiva: ${r.evaluadas} pendientes evaluados.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo evaluar."),
  });

  const refrescarAsignaciones = () => {
    queryClient.invalidateQueries({ queryKey: ["ranking"] });
    queryClient.invalidateQueries({ queryKey: ["resumen-asig"] });
    queryClient.invalidateQueries({ queryKey: ["asignaciones"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const revocar = useMutation({
    mutationFn: (id: number) => asignacionesApi.revocar(id),
    onSuccess: () => {
      refrescarAsignaciones();
      toast.exito("Asignación revocada.");
      setRevocarId(null);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo revocar.");
      setRevocarId(null);
    },
  });

  const decidir = useMutation({
    mutationFn: ({ id, estado, observaciones }: { id: number; estado: string; observaciones?: string }) =>
      asignacionesApi.decidir(id, estado, observaciones),
    onSuccess: (_data, vars) => {
      refrescarAsignaciones();
      toast.exito(`Decisión registrada: ${vars.estado}.`);
      setDecision(null);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar la decisión.");
      setDecision(null);
    },
  });

  const columnas = ["Posición", "Estudiante", "Carrera", "Puntaje", "Recomendación"];
  const filasPlan = filas.map((f) => [f.posicion, f.nombre, f.carrera, f.puntaje_final, f.recomendacion]);

  return (
    <div className="page">
      <PageHeader title="Gestión de becas" />
      {USE_MOCKS && (
        <p className="muted">Vista de demostración: la asignación por cupos requiere backend real.</p>
      )}

      <div className="filters">
        <select className="input" aria-label="Convocatoria" value={conv} onChange={(e) => setConvocatoriaId(e.target.value)}>
          {(convs.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} ({c.gestion})</option>
          ))}
        </select>
        <select className="input" aria-label="Tipo de beca" value={tipo} onChange={(e) => setTipoBecaId(e.target.value)}>
          {(tipos.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        {!USE_MOCKS && paramsListos && puedeGenerar && (
          <Button type="button" onClick={() => generar.mutate()} disabled={generar.isPending}>
            {generar.isPending ? "Generando…" : "Generar asignación"}
          </Button>
        )}
        {!USE_MOCKS && puedeEvaluar && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => evaluarPendientes.mutate()}
            disabled={evaluarPendientes.isPending}
          >
            {evaluarPendientes.isPending ? "Evaluando…" : "Evaluar pendientes"}
          </Button>
        )}
        {filas.length > 0 && (
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => exportarCSV("ranking.csv", columnas, filasPlan)}
            >
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => exportarPDF("ranking.pdf", "Ranking de candidatos", columnas, filasPlan)}
            >
              Exportar PDF
            </Button>
          </>
        )}
      </div>

      {!USE_MOCKS && resumen.data && (
        <div className="kpi-grid">
          <KpiCard label="Cupos ocupados" value={resumen.data.ocupados} tone="teal" />
          <KpiCard label="Cupos disponibles" value={resumen.data.disponibles} tone="navy" />
          <KpiCard label="Presupuesto usado (Bs)" value={Math.round(resumen.data.presupuesto_usado)} tone="gold" />
          <KpiCard label="Presupuesto disponible (Bs)" value={Math.round(resumen.data.presupuesto_disponible)} tone="red" />
        </div>
      )}

      <Card title={`Ranking de candidatos (${filas.length})`}>
        {ranking.isPending && !USE_MOCKS && <Spinner texto="Cargando ranking…" />}
        {ranking.isError && !USE_MOCKS && (
          <EmptyState
            titulo="No se pudo cargar el ranking"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={<Button type="button" onClick={() => void ranking.refetch()}>Reintentar</Button>}
          />
        )}
        {(USE_MOCKS || (!ranking.isPending && !ranking.isError)) && filas.length === 0 && (
          <EmptyState titulo="Sin ranking" detalle="Todavía no hay evaluaciones para mostrar." />
        )}
        {filas.length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Carrera</th>
                  <th>Puntaje</th>
                  <th>Recomendación</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id_estudiante}>
                    <td>{f.posicion}</td>
                    <td>{f.nombre}</td>
                    <td>{f.carrera}</td>
                    <td>{formatPuntaje(f.puntaje_final)}</td>
                    <td>{f.recomendacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!USE_MOCKS && (asignadas.data ?? []).length > 0 && (
        <Card title={`Asignaciones (${asignadas.data?.length ?? 0})`}>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Puntaje</th>
                  <th>Estado</th>
                  {puedeAccionar && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {(asignadas.data ?? []).map((a) => (
                  <tr key={a.id}>
                    <td>{a.estudiante ? `${a.estudiante.nombre} ${a.estudiante.apellido}` : `ID ${a.id_estudiante}`}</td>
                    <td>{formatPuntaje(a.puntaje)}</td>
                    <td>{a.estado}</td>
                    {puedeAccionar && (
                    <td>
                      <span className="row-actions">
                        {puedeDecidir && (
                          <>
                            <button className="link-btn" type="button" onClick={() => decidir.mutate({ id: a.id, estado: "Aprobada" })}>
                              Aprobar
                            </button>
                            <button className="link-btn" type="button" onClick={() => setDecision({ id: a.id, estado: "Rechazada" })}>
                              Rechazar
                            </button>
                            <button className="link-btn" type="button" onClick={() => setDecision({ id: a.id, estado: "En observación" })}>
                              Observar
                            </button>
                          </>
                        )}
                        {puedeRevocar && (
                          <button className="link-btn danger" type="button" onClick={() => setRevocarId(a.id)}>
                            Revocar
                          </button>
                        )}
                      </span>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">Monto por beca: {formatMonedaBs(tipos.data?.find((t) => String(t.id) === tipo)?.monto)}</p>
        </Card>
      )}

      {revocarId !== null && (
        <ConfirmDialog
          titulo="Revocar asignación"
          mensaje="Se revocará la beca asignada. ¿Continuar?"
          textoConfirmar="Revocar"
          onConfirmar={() => revocar.mutate(revocarId)}
          onCancelar={() => setRevocarId(null)}
        />
      )}

      {decision !== null && (
        <ObservacionDialog
          titulo={`${decision.estado === "Aprobada" ? "Aprobar" : decision.estado === "Rechazada" ? "Rechazar" : "Dejar en observación"}`}
          mensaje="La decisión quedará registrada en el historial del estudiante."
          textoConfirmar="Guardar decisión"
          onConfirmar={(obs) => decidir.mutate({ id: decision.id, estado: decision.estado, observaciones: obs })}
          onCancelar={() => setDecision(null)}
        />
      )}
    </div>
  );
}
