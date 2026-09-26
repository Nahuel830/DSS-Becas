import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { fetchDashboard } from "../services/api/dashboard";
import { estudiantesApi } from "../services/api/estudiantes";
import { useDebounce } from "../state/useDebounce";
import { useToast } from "../state/ToastContext";
import { clasificarPuntaje, codigoEstudiante, getEvaluacion, nombreCompleto } from "../utils/dss";
import { formatPuntaje } from "../utils/format";

interface Fila {
  id: number;
  codigo: string;
  nombre: string;
  carrera: string;
  estadoBeca: string;
  puntaje: number | null;
}

type Columna = "codigo" | "nombre" | "carrera" | "puntaje";

const POR_PAGINA_OPCIONES = [10, 20, 50];

function numero(param: string | null, defecto: number): number {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : defecto;
}

/** gestion-estudiantes.png → /estudiantes. Filtros en URL, orden, paginación y baja. */
export function EstudiantesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
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
  const direccion = params.get("dir") === "desc" ? "desc" : "asc";

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

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => estudiantesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.exito("Estudiante eliminado.");
      setEliminarId(null);
    },
    onError: () => toast.error("No se pudo eliminar al estudiante."),
  });

  const carreras = useMemo(() => {
    const set = new Set<string>();
    for (const e of data?.estudiantes ?? []) if (e.carrera) set.add(e.carrera);
    return [...set].sort();
  }, [data]);

  const filas: Fila[] = useMemo(() => {
    if (!data) return [];
    const becasActivas = new Set(
      data.becas.filter((b) => b.estado === "Activa").map((b) => b.id_estudiante),
    );
    return data.estudiantes.map((e) => {
      const id = e.id_estudiante ?? 0;
      const puntaje = getEvaluacion(data.evaluaciones, id)?.puntaje_final ?? null;
      return {
        id,
        codigo: codigoEstudiante(e.id_estudiante),
        nombre: nombreCompleto(e),
        carrera: e.carrera ?? "-",
        estadoBeca: becasActivas.has(id) ? "Activa" : puntaje !== null ? clasificarPuntaje(puntaje) : "Pendiente",
        puntaje,
      };
    });
  }, [data]);

  const filtradas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return filas.filter(
      (r) =>
        (!texto || `${r.codigo} ${r.nombre} ${r.carrera}`.toLowerCase().includes(texto)) &&
        (!carrera || r.carrera === carrera) &&
        (!estado || r.estadoBeca === estado),
    );
  }, [filas, q, carrera, estado]);

  const ordenadas = useMemo(() => {
    const clave: Record<Columna, (r: Fila) => string | number> = {
      codigo: (r) => r.codigo,
      nombre: (r) => r.nombre,
      carrera: (r) => r.carrera,
      puntaje: (r) => r.puntaje ?? -1,
    };
    const get = clave[orden] ?? clave.codigo;
    return [...filtradas].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
      return direccion === "desc" ? -cmp : cmp;
    });
  }, [filtradas, orden, direccion]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginaFilas = ordenadas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

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
    if (orden === col) cambiar({ dir: direccion === "asc" ? "desc" : "asc" });
    else cambiar({ orden: col, dir: "asc" });
  };

  const indicador = (col: Columna) => (orden === col ? (direccion === "asc" ? " ▲" : " ▼") : "");

  const limpiar = () => {
    setBusqueda("");
    setParams({});
  };

  const desde = ordenadas.length === 0 ? 0 : (paginaActual - 1) * porPagina + 1;
  const hasta = Math.min(paginaActual * porPagina, ordenadas.length);

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
          {carreras.map((c) => (
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

      <Card title={`Estudiantes (${ordenadas.length})`}>
        {isPending && (
          <div className="table-scroll">
            <table className="data-table" aria-label="Cargando estudiantes">
              <tbody>
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr className="skeleton-row" key={i}>
                    <td><div className="skeleton-bar" /></td>
                    <td><div className="skeleton-bar" /></td>
                    <td><div className="skeleton-bar" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isError && (
          <EmptyState
            titulo="No se pudieron cargar los estudiantes"
            detalle="Verificá VITE_API_URL o activá VITE_USE_MOCKS=true."
            accion={
              <Button type="button" onClick={() => void refetch()}>
                Reintentar
              </Button>
            }
          />
        )}
        {!isPending && !isError && filas.length === 0 && (
          <EmptyState
            titulo="No hay estudiantes"
            detalle="Registrá el primero para empezar."
            accion={<Link to={ROUTES.nuevoEstudiante}>+ Nuevo estudiante</Link>}
          />
        )}
        {!isPending && !isError && filas.length > 0 && paginaFilas.length === 0 && (
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
        {!isPending && !isError && paginaFilas.length > 0 && (
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
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaFilas.map((r) => (
                    <tr key={r.id} onClick={() => navigate(ROUTES.detalleEstudiante(r.id))} style={{ cursor: "pointer" }}>
                      <td>{r.codigo}</td>
                      <td>{r.nombre}</td>
                      <td>{r.carrera}</td>
                      <td>{r.estadoBeca}</td>
                      <td>{r.puntaje === null ? "-" : formatPuntaje(r.puntaje)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <span className="row-actions">
                          <Link to={ROUTES.detalleEstudiante(r.id)}>Ver</Link>
                          <Link to={ROUTES.editarEstudiante(r.id)}>Editar</Link>
                          <Link to={ROUTES.evaluacionPorId(r.id)}>Evaluar</Link>
                          <button className="link-btn danger" type="button" onClick={() => setEliminarId(r.id)}>
                            Eliminar
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="student-cards">
              {paginaFilas.map((r) => (
                <div className="student-card" key={r.id}>
                  <strong>{r.nombre}</strong>
                  <span className="muted">{r.codigo} · {r.carrera}</span>
                  <span>Estado beca: {r.estadoBeca} · Puntaje: {r.puntaje === null ? "-" : formatPuntaje(r.puntaje)}</span>
                  <span className="row-actions">
                    <Link to={ROUTES.detalleEstudiante(r.id)}>Ver</Link>
                    <Link to={ROUTES.editarEstudiante(r.id)}>Editar</Link>
                    <Link to={ROUTES.evaluacionPorId(r.id)}>Evaluar</Link>
                    <button className="link-btn danger" type="button" onClick={() => setEliminarId(r.id)}>
                      Eliminar
                    </button>
                  </span>
                </div>
              ))}
            </div>
            <div className="pagination">
              <span>Mostrando {desde}–{hasta} de {ordenadas.length}</span>
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
                disabled={paginaActual <= 1}
                onClick={() => cambiar({ pagina: String(paginaActual - 1) })}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => cambiar({ pagina: String(paginaActual + 1) })}
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
          mensaje="Se eliminará al estudiante y sus datos locales. Esta acción no se puede deshacer. ¿Continuar?"
          textoConfirmar="Eliminar"
          onConfirmar={() => eliminar.mutate(eliminarId)}
          onCancelar={() => setEliminarId(null)}
        />
      )}
    </div>
  );
}
