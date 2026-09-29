import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { catalogosApi } from "../services/api/catalogos";
import { estudiantesApi, type EstudianteListado } from "../services/api/estudiantes";
import { usePermiso } from "../state/Permisos";
import type { FiltrosEstudiantes } from "../services/api/types";
import { useDebounce } from "../state/useDebounce";
import { useToast } from "../state/ToastContext";
import { codigoEstudiante, nombreCompleto } from "../utils/dss";
import { formatPuntaje } from "../utils/format";

type Columna = "codigo" | "nombre" | "carrera" | "puntaje";

const POR_PAGINA_OPCIONES = [10, 20, 50];

function numero(param: string | null, defecto: number): number {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : defecto;
}

/** gestion-estudiantes.png → /estudiantes. Búsqueda, filtros, orden y paginación del servidor. */
export function EstudiantesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const puedeCrear = usePermiso("estudiantes:crear");
  const puedeEditar = usePermiso("estudiantes:editar");
  const puedeEvaluar = usePermiso("evaluaciones:crear");
  const puedeEliminar = usePermiso("estudiantes:eliminar");
  const puedeAccionar = puedeEditar || puedeEvaluar || puedeEliminar;
  const queryClient = useQueryClient();
  const [eliminarId, setEliminarId] = useState<number | null>(null);

  const q = params.get("q") ?? "";
  const carrera = params.get("carrera") ?? "";
  const estado = params.get("estado") ?? "";
  const pagina = numero(params.get("pagina"), 1);
  const porPagina = POR_PAGINA_OPCIONES.includes(numero(params.get("porPagina"), 10))
    ? numero(params.get("porPagina"), 10)
    : 10;
  const orden = (params.get("orden") ?? "codigo") as Columna;
  const dir = params.get("dir") === "desc" ? "desc" : "asc";

  const [busqueda, setBusqueda] = useState(q);
  const busquedaDebounced = useDebounce(busqueda);

  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (busquedaDebounced.trim()) next.set("q", busquedaDebounced.trim());
      else next.delete("q");
      next.set("pagina", "1");
      return next;
    });
    // Solo reacciona al valor con debounce (no al setter estable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced]);

  const filtros: FiltrosEstudiantes = { q, carrera, estado, orden, dir, pagina, porPagina };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["estudiantes", q, carrera, estado, pagina, porPagina, orden, dir],
    queryFn: () => estudiantesApi.listar(filtros),
  });

  const carreras = useQuery({
    queryKey: ["carreras-lista"],
    queryFn: catalogosApi.carreras,
    staleTime: 60000,
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => estudiantesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.exito("Estudiante eliminado.");
      setEliminarId(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar al estudiante."),
  });

  const cambiar = (cambios: Record<string, string>, resetPagina = false) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(cambios)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (resetPagina) next.set("pagina", "1");
      return next;
    });
  };

  const ordenarPor = (col: Columna) => {
    if (orden === col) cambiar({ dir: dir === "asc" ? "desc" : "asc" });
    else cambiar({ orden: col, dir: "asc" });
  };

  const indicador = (col: Columna) => (orden === col ? (dir === "asc" ? " ▲" : " ▼") : "");

  const limpiar = () => {
    setBusqueda("");
    setParams({});
  };

  const filas: EstudianteListado[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const paginaSrv = data?.page ?? pagina;
  const porPaginaSrv = data?.pageSize ?? porPagina;
  const desde = total === 0 ? 0 : (paginaSrv - 1) * porPaginaSrv + 1;
  const hasta = Math.min(paginaSrv * porPaginaSrv, total);
  const totalPaginas = Math.max(1, Math.ceil(total / porPaginaSrv));

  return (
    <div className="page">
      <PageHeader title="Gestión de estudiantes" />
      <div className="toolbar">
        {puedeCrear && (
          <Link className="btn btn-primary" to={ROUTES.nuevoEstudiante}>
            + Nuevo estudiante
          </Link>
        )}
        <input
          className="input toolbar-search"
          type="search"
          placeholder="Buscar estudiante…"
          aria-label="Buscar estudiante"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="filters">
        <select
          className="input"
          aria-label="Filtrar por carrera"
          value={carrera}
          onChange={(e) => cambiar({ carrera: e.target.value }, true)}
        >
          <option value="">Todas las carreras</option>
          {(carreras.data ?? []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(e) => cambiar({ estado: e.target.value }, true)}
        >
          <option value="">Todos los estados</option>
          {["Activa", "Recomendado", "En revisión", "En riesgo", "Pendiente"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(q || carrera || estado) && (
          <Button variant="secondary" type="button" onClick={limpiar}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <Card title={`Estudiantes (${total})`}>
        {isPending && <Spinner texto="Cargando estudiantes…" />}
        {isError && (
          <EmptyState
            titulo="No se pudieron cargar los estudiantes"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={
              <Button type="button" onClick={() => void refetch()}>
                Reintentar
              </Button>
            }
          />
        )}
        {!isPending && !isError && total === 0 && !(q || carrera || estado) && (
          <EmptyState
            titulo="No hay estudiantes"
            detalle="Registrá el primero para empezar."
            accion={puedeCrear ? <Link to={ROUTES.nuevoEstudiante}>+ Nuevo estudiante</Link> : undefined}
          />
        )}
        {!isPending && !isError && total === 0 && (q || carrera || estado) && (
          <EmptyState
            titulo="Sin resultados para los filtros"
            detalle="Probá con otra búsqueda o limpiá los filtros."
            accion={
              <Button variant="secondary" type="button" onClick={limpiar}>
                Limpiar filtros
              </Button>
            }
          />
        )}
        {!isPending && !isError && filas.length > 0 && (
          <>
            <div className="table-scroll hide-mobile">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><button className="link-btn" type="button" onClick={() => ordenarPor("codigo")}>Código{indicador("codigo")}</button></th>
                    <th><button className="link-btn" type="button" onClick={() => ordenarPor("nombre")}>Nombre{indicador("nombre")}</button></th>
                    <th><button className="link-btn" type="button" onClick={() => ordenarPor("carrera")}>Carrera{indicador("carrera")}</button></th>
                    <th>Estado beca</th>
                    <th><button className="link-btn" type="button" onClick={() => ordenarPor("puntaje")}>Puntaje DSS{indicador("puntaje")}</button></th>
                    {puedeAccionar && <th>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r) => {
                    const id = r.id_estudiante ?? 0;
                    return (
                      <tr key={id} onClick={() => navigate(ROUTES.detalleEstudiante(id))} style={{ cursor: "pointer" }}>
                        <td>{codigoEstudiante(r.id_estudiante)}</td>
                        <td>{nombreCompleto(r)}</td>
                        <td>{r.carrera ?? "-"}</td>
                        <td>{r.estado_beca}</td>
                        <td>{r.puntaje_final === null ? "-" : formatPuntaje(r.puntaje_final)}</td>
                        {puedeAccionar && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <span className="row-actions">
                            <Link to={ROUTES.detalleEstudiante(id)}>Ver</Link>
                            {puedeEditar && (
                              <Link to={ROUTES.editarEstudiante(id)}>Editar</Link>
                            )}
                            {puedeEvaluar && (
                              <Link to={ROUTES.evaluacionPorId(id)}>Evaluar</Link>
                            )}
                            {puedeEliminar && (
                              <button className="link-btn danger" type="button" onClick={() => setEliminarId(id)}>
                                Eliminar
                              </button>
                            )}
                          </span>
                        </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="student-cards">
              {filas.map((r) => {
                const id = r.id_estudiante ?? 0;
                return (
                  <div className="student-card" key={id}>
                    <strong>{nombreCompleto(r)}</strong>
                    <span className="muted">{codigoEstudiante(r.id_estudiante)} · {r.carrera ?? "-"}</span>
                    <span>Estado beca: {r.estado_beca} · Puntaje: {r.puntaje_final === null ? "-" : formatPuntaje(r.puntaje_final)}</span>
                    <span className="row-actions">
                      <Link to={ROUTES.detalleEstudiante(id)}>Ver</Link>
                      {puedeEditar && (
                        <Link to={ROUTES.editarEstudiante(id)}>Editar</Link>
                      )}
                      {puedeEvaluar && (
                        <Link to={ROUTES.evaluacionPorId(id)}>Evaluar</Link>
                      )}
                      {puedeEliminar && (
                        <button className="link-btn danger" type="button" onClick={() => setEliminarId(id)}>
                          Eliminar
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pagination">
              <span>Mostrando {desde}–{hasta} de {total}</span>
              <select
                className="input"
                aria-label="Filas por página"
                value={porPagina}
                onChange={(e) => cambiar({ porPagina: e.target.value }, true)}
              >
                {POR_PAGINA_OPCIONES.map((n) => (
                  <option key={n} value={n}>{n} por página</option>
                ))}
              </select>
              <Button
                variant="secondary"
                type="button"
                disabled={pagina <= 1}
                onClick={() => cambiar({ pagina: String(pagina - 1) })}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => cambiar({ pagina: String(pagina + 1) })}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </Card>

      {eliminarId !== null && (
        <ConfirmDialog
          titulo="Eliminar estudiante"
          mensaje="Se eliminará al estudiante y sus datos relacionados. Esta acción no se puede deshacer. ¿Continuar?"
          textoConfirmar="Eliminar"
          onConfirmar={() => eliminar.mutate(eliminarId)}
          onCancelar={() => setEliminarId(null)}
        />
      )}
    </div>
  );
}
