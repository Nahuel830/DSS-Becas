import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { ApiError } from "../services/api/client";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { ROUTES } from "../routing/routes";
import { usuariosApi } from "../services/api/usuarios";
import type { UsuarioRow } from "../services/api/types";
import { useAuth } from "../state/AuthContext";
import { useDebounce } from "../state/useDebounce";
import { formatFechaHora } from "../utils/format";
import { useToast } from "../state/ToastContext";
import { formatFecha } from "../utils/format";

const ROLES = ["Administrador", "Evaluador", "Consulta"];
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIO_RE = /^[a-z0-9._-]{3,30}$/;

type FormUsuario = Partial<UsuarioRow> & { password?: string; confirmar?: string };

/** Administración de usuarios (solo Administrador por ruta). */
export function AdministracionPage() {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<FormUsuario | null>(null);
  const [eliminando, setEliminando] = useState<UsuarioRow | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const toast = useToast();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const q = useDebounce(busqueda);

  const lista = useQuery({ queryKey: ["usuarios", q], queryFn: () => usuariosApi.listar(q) });

  const invalida = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });

  const guardar = useMutation({
    mutationFn: async (d: FormUsuario): Promise<{ esYo: boolean }> => {
      if (!d.usuario?.trim() || !USUARIO_RE.test(d.usuario.trim())) {
        throw new Error("Usuario inválido (minúsculas, 3–30, letras, números, punto y guion bajo).");
      }
      if (!d.nombre?.trim()) throw new Error("El nombre es requerido.");
      if (!d.correo?.trim() || !CORREO_RE.test(d.correo.trim())) {
        throw new Error("Correo inválido.");
      }
      if (!d.rol) throw new Error("El rol es requerido.");
      if (!d.id_usuario) {
        if (!d.password || d.password.length < 8) throw new Error("La contraseña es obligatoria (mínimo 8 caracteres).");
        if (d.password !== d.confirmar) throw new Error("La confirmación no coincide.");
        await usuariosApi.crear({
          usuario: d.usuario.trim(), nombre: d.nombre.trim(), correo: d.correo.trim(), rol: d.rol,
          activo: true, password: d.password,
        });
        return { esYo: false };
      }
      if (d.password && d.password.length < 8) throw new Error("La nueva contraseña debe tener mínimo 8 caracteres.");
      if (d.password && d.password !== d.confirmar) throw new Error("La confirmación no coincide.");
      const original = (lista.data ?? []).find((u) => u.id_usuario === d.id_usuario);
      const meToqueSesion =
        d.id_usuario === auth.usuario?.id_usuario &&
        (d.password !== undefined && d.password !== "" ? true : d.usuario !== original?.usuario);
      const payload: Partial<UsuarioRow> & { password?: string } = {
        usuario: d.usuario?.trim(), nombre: d.nombre?.trim(), correo: d.correo?.trim(), rol: d.rol,
      };
      if (d.password) payload.password = d.password;
      await usuariosApi.actualizar(d.id_usuario, payload);
      return { esYo: meToqueSesion };
    },
    onSuccess: ({ esYo }) => {
      invalida();
      setEditando(null);
      if (esYo) {
        // Me cambié el usuario o la contraseña: mis sesiones se cerraron.
        toast.advertencia("Tus datos cambiaron. Ingresá nuevamente.");
        auth.salir();
        navigate(ROUTES.login, { replace: true });
      } else {
        toast.exito("Usuario guardado.");
      }
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "No se pudo guardar.";
      if (msg.includes("Ya existe") || msg.includes("ya existe")) setErrorForm(msg);
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
            setEditando({ usuario: "", nombre: "", correo: "", rol: "Consulta", activo: true, password: "", confirmar: "" });
          }}
        >
          + Nuevo usuario
        </Button>
        <input
          className="input toolbar-search"
          type="search"
          placeholder="Buscar por usuario, nombre, correo o rol…"
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
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((u) => (
                  <tr key={u.id_usuario}>
                    <td>@{u.usuario}</td>
                    <td>{u.nombre}</td>
                    <td>{u.correo}</td>
                    <td>{u.rol}</td>
                    <td>{u.ultimo_acceso ? formatFechaHora(u.ultimo_acceso) : "-"}</td>
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
              <label className="field-label">Usuario *</label>
              <input className="input" value={editando.usuario ?? ""} onChange={(e) => setEditando({ ...editando, usuario: e.target.value })} placeholder="minúsculas, punto y guion bajo" />
            </div>
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
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">
                {editando.id_usuario ? "Nueva contraseña (vacío = no cambiar)" : "Contraseña *"}
              </label>
              <input className="input" type="password" autoComplete="new-password" value={editando.password ?? ""} onChange={(e) => setEditando({ ...editando, password: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">
                {editando.id_usuario ? "Confirmar nueva" : "Confirmar contraseña *"}
              </label>
              <input className="input" type="password" autoComplete="new-password" value={editando.confirmar ?? ""} onChange={(e) => setEditando({ ...editando, confirmar: e.target.value })} />
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
