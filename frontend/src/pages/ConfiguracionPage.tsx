import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { USE_MOCKS, ApiError } from "../services/api/client";
import {
  catalogosApi,
  type Carrera,
  type Convocatoria,
  type CriterioRow,
  type TipoBecaRow,
} from "../services/api/catalogos";
import { useToast } from "../state/ToastContext";

type Tab = "carreras" | "tipos" | "convocatorias" | "criterios";

interface Columna<T> {
  titulo: string;
  valor: (f: T) => string;
}

interface ConfigTab<T extends { id: number }> {
  titulo: string;
  columnas: Array<Columna<T>>;
  clave: string;
  listar: () => Promise<T[]>;
  crear: (d: Partial<T>) => Promise<unknown>;
  actualizar: (id: number, d: Partial<T>) => Promise<unknown>;
  eliminar: (id: number) => Promise<unknown>;
  campos: (f: Partial<T>, set: (c: Partial<T>) => void) => ReactNode;
  validar?: (f: Partial<T>, todas: T[]) => string | null;
  vacio: Partial<T>;
  nombreDe: (f: T) => string;
}

function numeroOMitido(v: string): number | undefined {
  return v.trim() === "" ? undefined : Number(v);
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function CrudTab<T extends { id: number }>({ config }: { config: ConfigTab<T> }) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Partial<T> | null>(null);
  const [eliminando, setEliminando] = useState<T | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();

  const lista = useQuery({ queryKey: [config.clave], queryFn: config.listar });
  const filas = (lista.data ?? []).filter((f) =>
    config.nombreDe(f).toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  const invalida = () => {
    queryClient.invalidateQueries({ queryKey: ["cfg-carreras"] });
    queryClient.invalidateQueries({ queryKey: ["cfg-tipos"] });
    queryClient.invalidateQueries({ queryKey: ["cfg-convocatorias"] });
    queryClient.invalidateQueries({ queryKey: ["cfg-criterios"] });
  };

  const guardar = useMutation({
    mutationFn: async (datos: Partial<T>): Promise<void> => {
      const err = config.validar?.(datos, lista.data ?? []);
      if (err) throw new Error(err);
      if (datos.id) await config.actualizar(datos.id, datos);
      else await config.crear(datos);
    },
    onSuccess: () => {
      invalida();
      setEditando(null);
      toast.exito("Guardado correctamente.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "No se pudo guardar.";
      if (msg.startsWith("TOTAL_PESOS:")) setErrorForm(msg.replace("TOTAL_PESOS:", ""));
      else if (e instanceof ApiError && e.detalles) {
        setErrorForm(Object.values(e.detalles).join(" "));
      } else toast.error(msg);
    },
  });

  const borrar = useMutation({
    mutationFn: (id: number) => config.eliminar(id),
    onSuccess: () => {
      invalida();
      setEliminando(null);
      toast.exito("Eliminado correctamente.");
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
      setEliminando(null);
    },
  });

  return (
    <div>
      <div className="toolbar">
        {!USE_MOCKS && (
          <Button type="button" onClick={() => { setErrorForm(""); setEditando(config.vacio); }}>
            + Nuevo
          </Button>
        )}
        <input
          className="input toolbar-search"
          type="search"
          placeholder="Buscar…"
          aria-label={`Buscar en ${config.titulo}`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      {USE_MOCKS && (
        <p className="muted">Vista de solo lectura en modo demostración (la edición requiere backend real).</p>
      )}
      <Card title={config.titulo}>
        {lista.isPending && <Spinner texto="Cargando…" />}
        {lista.isError && (
          <EmptyState
            titulo="Error de conexión"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={<Button type="button" onClick={() => void lista.refetch()}>Reintentar</Button>}
          />
        )}
        {!lista.isPending && !lista.isError && filas.length === 0 && (
          <EmptyState titulo="Sin registros" detalle="Todavía no hay datos." />
        )}
        {!lista.isPending && !lista.isError && filas.length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {config.columnas.map((c) => (
                    <th key={c.titulo}>{c.titulo}</th>
                  ))}
                  {!USE_MOCKS && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    {config.columnas.map((c) => (
                      <td key={c.titulo}>{c.valor(f)}</td>
                    ))}
                    {!USE_MOCKS && (
                      <td>
                        <span className="row-actions">
                          <button className="link-btn" type="button" onClick={() => { setErrorForm(""); setEditando({ ...f }); }}>
                            Editar
                          </button>
                          <button className="link-btn danger" type="button" onClick={() => setEliminando(f)}>
                            Eliminar
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editando && (
        <Modal titulo={editando.id ? "Editar" : "Nuevo"} onCerrar={() => setEditando(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardar.mutate(editando);
            }}
          >
            {config.campos(editando, setEditando)}
            {errorForm && <p className="error">{errorForm}</p>}
            <div className="form-actions">
              <Button type="submit" disabled={guardar.isPending}>
                {guardar.isPending ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="secondary" type="button" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {eliminando && (
        <ConfirmDialog
          titulo="Eliminar registro"
          mensaje={`Se eliminará "${config.nombreDe(eliminando)}". ¿Continuar?`}
          textoConfirmar="Eliminar"
          onConfirmar={() => borrar.mutate(eliminando.id)}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </div>
  );
}

/** Configuración de catálogos (requiere backend real para crear/editar/eliminar). */
export function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>("carreras");
  const toast = useToast();
  const queryClient = useQueryClient();
  const criteriosCache = useQuery({
    queryKey: ["cfg-criterios"],
    queryFn: catalogosApi.criterios.listar,
    enabled: tab === "criterios",
  });
  const guardarPesos = useMutation({
    mutationFn: () =>
      catalogosApi.criterios.actualizarPesos(
        (criteriosCache.data ?? []).map((c) => ({ id: c.id, peso: c.peso })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cfg-criterios"] });
      toast.exito("Pesos guardados (suman 100 %).");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudieron guardar los pesos."),
  });

  return (
    <div className="page">
      <PageHeader title="Configuración" />
      <div className="tabs" role="tablist">
        {(
          [
            ["carreras", "Carreras"],
            ["tipos", "Tipos de beca"],
            ["convocatorias", "Convocatorias"],
            ["criterios", "Criterios DSS"],
          ] as Array<[Tab, string]>
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`tab${tab === id ? " active" : ""}`}
            type="button"
            onClick={() => setTab(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {tab === "criterios" && !USE_MOCKS && (
        <div className="toolbar">
          <Button
            type="button"
            onClick={() => guardarPesos.mutate()}
            disabled={guardarPesos.isPending || (criteriosCache.data ?? []).length === 0}
          >
            {guardarPesos.isPending ? "Guardando…" : "Guardar pesos en lote"}
          </Button>
          <span className="muted">
            Suma actual: {(criteriosCache.data ?? []).reduce((s, c) => s + (c.peso ?? 0), 0)} %
          </span>
        </div>
      )}

      {tab === "carreras" && (
        <CrudTab<Carrera>
          config={{
            titulo: "Carreras y facultades",
            clave: "cfg-carreras",
            listar: catalogosApi.carrerasCrud.listar,
            crear: catalogosApi.carrerasCrud.crear,
            actualizar: catalogosApi.carrerasCrud.actualizar,
            eliminar: catalogosApi.carrerasCrud.eliminar,
            vacio: { nombre: "", facultad: "" },
            nombreDe: (f) => f.nombre,
            columnas: [
              { titulo: "Nombre", valor: (f) => f.nombre },
              { titulo: "Facultad", valor: (f) => f.facultad ?? "-" },
              { titulo: "Estado", valor: (f) => (f.activa === false ? "Inactiva" : "Activa") },
            ],
            campos: (f, set) => (
              <>
                <Campo label="Nombre *">
                  <input className="input" value={f.nombre ?? ""} onChange={(e) => set({ ...f, nombre: e.target.value })} />
                </Campo>
                <Campo label="Facultad">
                  <input className="input" value={f.facultad ?? ""} onChange={(e) => set({ ...f, facultad: e.target.value })} />
                </Campo>
              </>
            ),
          }}
        />
      )}

      {tab === "tipos" && (
        <CrudTab<TipoBecaRow>
          config={{
            titulo: "Tipos de beca",
            clave: "cfg-tipos",
            listar: catalogosApi.tiposBeca.listar,
            crear: catalogosApi.tiposBeca.crear,
            actualizar: catalogosApi.tiposBeca.actualizar,
            eliminar: catalogosApi.tiposBeca.eliminar,
            vacio: { nombre: "", monto: 0, cupos: 1 },
            nombreDe: (f) => f.nombre,
            columnas: [
              { titulo: "Nombre", valor: (f) => f.nombre },
              { titulo: "Monto (Bs)", valor: (f) => String(f.monto) },
              { titulo: "Cupos", valor: (f) => String(f.cupos) },
              { titulo: "Estado", valor: (f) => (f.activa === false ? "Inactivo" : "Activo") },
            ],
            campos: (f, set) => (
              <>
                <Campo label="Nombre *">
                  <input className="input" value={f.nombre ?? ""} onChange={(e) => set({ ...f, nombre: e.target.value })} />
                </Campo>
                <Campo label="Descripción">
                  <input className="input" value={f.descripcion ?? ""} onChange={(e) => set({ ...f, descripcion: e.target.value })} />
                </Campo>
                <Campo label="Monto (Bs) *">
                  <input className="input" type="number" min={0} value={f.monto ?? 0} onChange={(e) => set({ ...f, monto: numeroOMitido(e.target.value) ?? 0 })} />
                </Campo>
                <Campo label="Cupos *">
                  <input className="input" type="number" min={1} value={f.cupos ?? 1} onChange={(e) => set({ ...f, cupos: numeroOMitido(e.target.value) ?? 1 })} />
                </Campo>
              </>
            ),
          }}
        />
      )}

      {tab === "convocatorias" && (
        <CrudTab<Convocatoria>
          config={{
            titulo: "Convocatorias",
            clave: "cfg-convocatorias",
            listar: catalogosApi.convocatorias.listar,
            crear: catalogosApi.convocatorias.crear,
            actualizar: catalogosApi.convocatorias.actualizar,
            eliminar: catalogosApi.convocatorias.eliminar,
            vacio: { nombre: "", gestion: "", estado: "Abierta", presupuesto: 0 },
            nombreDe: (f) => f.nombre,
            columnas: [
              { titulo: "Nombre", valor: (f) => f.nombre },
              { titulo: "Gestión", valor: (f) => f.gestion },
              { titulo: "Estado", valor: (f) => f.estado ?? "-" },
              { titulo: "Presupuesto", valor: (f) => String(f.presupuesto ?? 0) },
            ],
            campos: (f, set) => (
              <>
                <Campo label="Nombre *">
                  <input className="input" value={f.nombre ?? ""} onChange={(e) => set({ ...f, nombre: e.target.value })} />
                </Campo>
                <Campo label="Gestión *">
                  <input className="input" value={f.gestion ?? ""} onChange={(e) => set({ ...f, gestion: e.target.value })} />
                </Campo>
                <Campo label="Estado">
                  <select className="input" value={f.estado ?? "Abierta"} onChange={(e) => set({ ...f, estado: e.target.value })}>
                    <option value="Abierta">Abierta</option>
                    <option value="En curso">En curso</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </Campo>
                <Campo label="Presupuesto total (Bs)">
                  <input className="input" type="number" min={0} value={f.presupuesto ?? 0} onChange={(e) => set({ ...f, presupuesto: numeroOMitido(e.target.value) ?? 0 })} />
                </Campo>
              </>
            ),
          }}
        />
      )}

      {tab === "criterios" && (
        <CrudTab<CriterioRow>
          config={{
            titulo: "Criterios del DSS",
            clave: "cfg-criterios",
            listar: catalogosApi.criterios.listar,
            crear: catalogosApi.criterios.crear,
            actualizar: catalogosApi.criterios.actualizar,
            eliminar: catalogosApi.criterios.eliminar,
            vacio: { nombre: "", peso: 0, tipo: "beneficio" },
            nombreDe: (f) => f.nombre,
            validar: (f, todas) => {
              const suma =
                todas.filter((c) => c.id !== f.id).reduce((s, c) => s + (c.peso ?? 0), 0) + (f.peso ?? 0);
              if (Math.abs(suma - 100) > 0.001) {
                return `TOTAL_PESOS:Los pesos deben sumar 100 % (actual: ${suma} %).`;
              }
              return null;
            },
            columnas: [
              { titulo: "Nombre", valor: (f) => f.nombre },
              { titulo: "Peso (%)", valor: (f) => String(f.peso) },
              { titulo: "Tipo", valor: (f) => f.tipo ?? "-" },
            ],
            campos: (f, set) => (
              <>
                <Campo label="Nombre *">
                  <input className="input" value={f.nombre ?? ""} onChange={(e) => set({ ...f, nombre: e.target.value })} />
                </Campo>
                <Campo label="Peso (%) *">
                  <input className="input" type="number" min={0} max={100} value={f.peso ?? 0} onChange={(e) => set({ ...f, peso: numeroOMitido(e.target.value) ?? 0 })} />
                </Campo>
                <Campo label="Tipo">
                  <select className="input" value={f.tipo ?? "beneficio"} onChange={(e) => set({ ...f, tipo: e.target.value })}>
                    <option value="beneficio">Beneficio</option>
                    <option value="costo">Costo</option>
                  </select>
                </Campo>
              </>
            ),
          }}
        />
      )}
    </div>
  );
}
