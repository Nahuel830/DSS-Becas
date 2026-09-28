import { Award, ClipboardCheck, FileText, LayoutDashboard, LineChart, Settings, SlidersHorizontal, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routing/routes";

const ITEMS = [
  { to: ROUTES.dashboard, texto: "Dashboard DSS", Icono: LayoutDashboard, pendiente: false },
  { to: ROUTES.estudiantes, texto: "Estudiantes", Icono: Users, pendiente: false },
  { to: ROUTES.nuevaEvaluacion, texto: "Evaluación DSS", Icono: ClipboardCheck, pendiente: false },
  { to: ROUTES.becas, texto: "Becas", Icono: Award, pendiente: false },
  { to: ROUTES.seguimiento, texto: "Seguimiento", Icono: LineChart, pendiente: false },
  { to: ROUTES.reportes, texto: "Reportes*", Icono: FileText, pendiente: true },
  { to: ROUTES.administracion, texto: "Administración*", Icono: Settings, pendiente: true },
  { to: ROUTES.configuracion, texto: "Configuración", Icono: SlidersHorizontal, pendiente: false },
];

/** Navegación lateral (diagrama-navegacion.png + sidebar de los mocks). */
export function Sidebar({ abierto, alNavegar }: { abierto: boolean; alNavegar: () => void }) {
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
          {ITEMS.map(({ to, texto, Icono, pendiente }) => (
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
