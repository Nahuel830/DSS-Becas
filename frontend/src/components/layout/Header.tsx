import { Menu } from "lucide-react";

/** Header con botón de menú (móvil) y avatar de usuario (mock: "PB"). */
export function Header({ alMenu }: { alMenu: () => void }) {
  return (
    <header className="topbar">
      <button className="menu-btn" type="button" onClick={alMenu} aria-label="Abrir menú">
        <Menu size={20} aria-hidden />
      </button>
      <span>DSS-Becas · Sistema de Soporte a Decisiones</span>
      <span className="avatar-sm" title="Personal de Bienestar">PB</span>
    </header>
  );
}
