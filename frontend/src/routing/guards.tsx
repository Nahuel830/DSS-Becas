import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../routing/routes";
import { useAuth } from "../state/AuthContext";
import { CambiarPasswordPage } from "../pages/CambiarPasswordPage";
import { Spinner } from "../components/Spinner";

/** Exige sesión; si debe cambiar contraseña, lo fuerza antes de todo. */
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.cargando) {
    return (
      <div className="page">
        <Spinner texto="Verificando sesión…" />
      </div>
    );
  }
  if (!auth.usuario) {
    return <Navigate to={ROUTES.login} replace state={{ desde: location.pathname }} />;
  }
  if (auth.usuario.debe_cambiar_password && location.pathname !== ROUTES.cambiarPassword) {
    return <CambiarPasswordPage obligatorio />;
  }
  return <Outlet />;
}

/** Exige además uno de los roles (si no: "Acceso denegado"). */
export function RequireRol({ roles }: { roles: string[] }) {
  const auth = useAuth();
  if (!auth.usuario) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (!roles.includes(auth.usuario.rol)) {
    return <AccesoDenegado />;
  }
  return <Outlet />;
}

/** Exige el permiso indicado (si no: "Acceso denegado" + volver al Dashboard). */
export function RequirePermiso({ permiso }: { permiso: string | string[] }) {
  const auth = useAuth();
  const permisos = auth.usuario?.permisos ?? [];
  const ok = Array.isArray(permiso) ? permiso.some((p) => permisos.includes(p)) : permisos.includes(permiso);
  if (!auth.usuario) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (!ok) {
    return <AccesoDenegado />;
  }
  return <Outlet />;
}

function AccesoDenegado() {
  const auth = useAuth();
  return (
    <div className="page">
      <h1>Acceso denegado</h1>
      <p className="muted">Tu rol ({auth.usuario?.rol}) no permite ver esta sección.</p>
      <p>
        <Link to={ROUTES.dashboard}>Volver al Dashboard</Link>
      </p>
    </div>
  );
}
