import { Award, ClipboardCheck, FileText, LayoutDashboard, LineChart, Settings, SlidersHorizontal, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routing/routes";
import { useAuth } from "../../state/AuthContext";

const ITEMS = [
  { to: ROUTES.dashboard, texto: "Dashboard DSS", Icono: LayoutDashboard, pendiente: false, admin: false },
  { to: ROUTES.estudiantes, texto: "Estudiantes", Icono: Users, pendiente: false, admin: false },
  { to: ROUTES.nuevaEvaluacion, texto: "Evaluación DSS", Icono: ClipboardCheck, pendiente: false, admin: false },
  { to: ROUTES.becas, texto: "Becas", Icono: Award, pendiente: false, admin: false },
  { to: ROUTES.seguimiento, texto: "Seguimiento", Icono: LineChart, pendiente: false, admin: false },
  { to: ROUTES.reportes, texto: "Reportes", Icono: FileText, pendiente: false, admin: false },
  { to: ROUTES.administracion, texto: "Administración", Icono: Settings, pendiente: false, admin: true },
  { to: ROUTES.configuracion, texto: "Configuración", Icono: SlidersHorizontal, pendiente: false, admin: false },
];

/** Navegación lateral (diagrama-navegacion.png + sidebar de los mocks). */
export function Sidebar({ abierto, alNavegar }: { abierto: boolean; alNavegar: () => void }) {
  const auth = useAuth();
  return (
    <>
      <div
        className={`sidebar-overlay${abierto ? " visible" : ""}`}
        onClick={alNavegar}
        aria-hidden
      />
      <aside className={`sidebar${abierto ? " open" : ""}`}>
        <div className="sidebar-brand">
          <strong>DSS-Becas</strong>
          <small>Bienestar Universitario</small>
        </div>
        <nav>
          {ITEMS.filter((item) => !item.admin || auth.esAdmin).map(({ to, texto, Icono, pendiente }) => (
            <NavLink key={to} to={to} className={pendiente ? "pending" : undefined} onClick={alNavegar}>
              <Icono size={17} aria-hidden />
              {texto}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
