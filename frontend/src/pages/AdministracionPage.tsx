import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/Button";
import { ApiError } from "../services/api/client";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { usuariosApi } from "../services/api/usuarios";
import type { UsuarioRow } from "../services/api/types";
import { useDebounce } from "../state/useDebounce";
import { useToast } from "../state/ToastContext";

const ROLES = ["Administrador", "Evaluador", "Consulta"];
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Administración de usuarios (#8). Sin login/JWT: siguiente fase. */
export function AdministracionPage() {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Partial<UsuarioRow> | null>(null);
  const [eliminando, setEliminando] = useState<UsuarioRow | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();
  const q = useDebounce(busqueda);

  const lista = useQuery({ queryKey: ["usuarios", q], queryFn: () => usuariosApi.listar(q) });

  const invalida = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });

  const guardar = useMutation({
    mutationFn: async (d: Partial<UsuarioRow>): Promise<void> => {
      if (!d.nombre?.trim()) throw new Error("El nombre es requerido.");
      if (!d.correo?.trim() || !CORREO_RE.test(d.correo.trim())) {
        throw new Error("Correo inválido.");
      }
      if (!d.rol) throw new Error("El rol es requerido.");
      if (d.id_usuario) {
        await usuariosApi.actualizar(d.id_usuario, {
          nombre: d.nombre.trim(), correo: d.correo.trim(), rol: d.rol,
        });
      } else {
        await usuariosApi.crear({ nombre: d.nombre.trim(), correo: d.correo.trim(), rol: d.rol, activo: true });
      }
    },
    onSuccess: () => {
      invalida();
      setEditando(null);
      toast.exito("Usuario guardado.");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "No se pudo guardar.";
      if (msg.includes("Ya existe")) setErrorForm(msg);
      else if (e instanceof ApiError && e.detalles) {
        setErrorForm(Object.values(e.detalles).join(" "));
      } else toast.error(msg);
    },
  });

  const borrar = useMutation({
    mutationFn: (id: number) => usuariosApi.eliminar(id),
    onSuccess: () => {
      invalida();
      setEliminando(null);
      toast.exito("Usuario eliminado.");
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
      setEliminando(null);
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => usuariosApi.cambiarEstado(id, activo),
    onSuccess: (_d, v) => {
      invalida();
      toast.exito(v.activo ? "Usuario activado." : "Usuario desactivado.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado."),
  });

  return (
    <div className="page">
      <PageHeader title="Administración" />
      <div className="toolbar">
        <Button
          type="button"
          onClick={() => {
            setErrorForm("");
            setEditando({ nombre: "", correo: "", rol: "Consulta", activo: true });
          }}
        >
          + Nuevo usuario
        </Button>
        <input
          className="input toolbar-search"
          type="search"
          placeholder="Buscar por nombre, correo o rol…"
          aria-label="Buscar usuario"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <Card title={`Usuarios (${lista.data?.length ?? 0})`}>
        {lista.isPending && <Spinner texto="Cargando usuarios…" />}
        {lista.isError && (
          <EmptyState
            titulo="No se pudieron cargar los usuarios"
            detalle="No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
            accion={<Button type="button" onClick={() => void lista.refetch()}>Reintentar</Button>}
          />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length === 0 && (
          <EmptyState titulo="Sin usuarios" detalle="Registrá el primero para empezar." />
        )}
        {!lista.isPending && !lista.isError && (lista.data ?? []).length > 0 && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td>{u.rol}</td>
                    <td>{u.activo === false ? "Inactivo" : "Activo"}</td>
                    <td>
                      <span className="row-actions">
                        <button className="link-btn" type="button" onClick={() => { setErrorForm(""); setEditando({ ...u }); }}>
                          Editar
                        </button>
                        <button
                          className="link-btn"
                          type="button"
                          onClick={() => cambiarEstado.mutate({ id: u.id_usuario, activo: u.activo === false })}
                        >
                          {u.activo === false ? "Activar" : "Desactivar"}
                        </button>
                        <button className="link-btn danger" type="button" onClick={() => setEliminando(u)}>
                          Eliminar
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editando && (
        <Modal titulo={editando.id_usuario ? "Editar usuario" : "Nuevo usuario"} onCerrar={() => setEditando(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardar.mutate(editando);
            }}
          >
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">Nombre *</label>
              <input className="input" value={editando.nombre ?? ""} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">Correo *</label>
              <input className="input" type="email" value={editando.correo ?? ""} onChange={(e) => setEditando({ ...editando, correo: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">Rol *</label>
              <select className="input" value={editando.rol ?? "Consulta"} onChange={(e) => setEditando({ ...editando, rol: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
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
          titulo="Eliminar usuario"
          mensaje={`Se eliminará a "${eliminando.nombre}". ¿Continuar?`}
          textoConfirmar="Eliminar"
          onConfirmar={() => borrar.mutate(eliminando.id_usuario)}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </div>
  );
}
