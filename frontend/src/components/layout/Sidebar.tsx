import { Award, ClipboardCheck, FileText, LayoutDashboard, LineChart, Settings, SlidersHorizontal, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routing/routes";
import { usePermiso } from "../../state/Permisos";

const ITEMS = [
  { to: ROUTES.dashboard, texto: "Dashboard DSS", Icono: LayoutDashboard },
  { to: ROUTES.estudiantes, texto: "Estudiantes", Icono: Users },
  { to: ROUTES.nuevaEvaluacion, texto: "Evaluación DSS", Icono: ClipboardCheck },
  { to: ROUTES.becas, texto: "Becas", Icono: Award },
  { to: ROUTES.seguimiento, texto: "Seguimiento", Icono: LineChart },
  { to: ROUTES.reportes, texto: "Reportes", Icono: FileText },
  { to: ROUTES.administracion, texto: "Administración", Icono: Settings },
  { to: ROUTES.configuracion, texto: "Configuración", Icono: SlidersHorizontal },
];

/** Navegación lateral: solo módulos permitidos (diagrama-navegacion.png + mocks). */
export function Sidebar({ abierto, alNavegar }: { abierto: boolean; alNavegar: () => void }) {
  const visible: Record<string, boolean> = {
    [ROUTES.estudiantes]: usePermiso("estudiantes:ver"),
    [ROUTES.nuevaEvaluacion]: usePermiso("evaluaciones:crear"),
    [ROUTES.becas]: usePermiso("asignaciones:ver"),
    [ROUTES.seguimiento]: usePermiso("seguimiento:ver"),
    [ROUTES.reportes]: usePermiso("reportes:ver"),
    [ROUTES.administracion]: usePermiso("usuarios:gestionar"),
    [ROUTES.configuracion]: usePermiso("configuracion:ver"),
  };
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
          {ITEMS.filter((item) => item.to === ROUTES.dashboard || visible[item.to]).map(({ to, texto, Icono }) => (
            <NavLink key={to} to={to} onClick={alNavegar}>
              <Icono size={17} aria-hidden />
              {texto}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
