import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routing/routes";

/** Navegación lateral (diagrama-navegacion.png + sidebar de los mocks). */
export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <strong>DSS-Becas</strong>
        <small>Bienestar Universitario</small>
      </div>
      <nav>
        <NavLink to={ROUTES.dashboard}>Dashboard DSS</NavLink>
        <NavLink to={ROUTES.estudiantes}>Estudiantes</NavLink>
        <NavLink to={ROUTES.nuevaEvaluacion}>Evaluación DSS</NavLink>
        <NavLink to={ROUTES.becas}>Becas</NavLink>
        <NavLink to={ROUTES.seguimiento} className="pending">
          Seguimiento*
        </NavLink>
        <NavLink to={ROUTES.reportes} className="pending">
          Reportes*
        </NavLink>
        <NavLink to={ROUTES.administracion} className="pending">
          Administración*
        </NavLink>
      </nav>
    </aside>
  );
}
