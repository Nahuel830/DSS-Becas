import { Menu } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { db } from "../../services/api/db";
import { useToast } from "../../state/ToastContext";

/** Header con botón de menú (móvil), avatar de usuario y restablecimiento de datos. */
export function Header({ alMenu }: { alMenu: () => void }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const toast = useToast();

  const restablecer = () => {
    db.reset();
    toast.exito("Datos de prueba restablecidos.");
    setConfirmando(false);
    setMenuAbierto(false);
    window.location.reload();
  };

  return (
    <header className="topbar">
      <button className="menu-btn" type="button" onClick={alMenu} aria-label="Abrir menú">
        <Menu size={20} aria-hidden />
      </button>
      <span>DSS-Becas · Sistema de Soporte a Decisiones</span>
      <div className="user-menu">
        <button
          className="avatar-sm"
          type="button"
          title="Personal de Bienestar"
          aria-label="Menú de usuario"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((v) => !v)}
        >
          PB
        </button>
        {menuAbierto && (
          <div className="user-dropdown" role="menu">
            <button type="button" role="menuitem" onClick={() => setConfirmando(true)}>
              Restablecer datos de prueba
            </button>
          </div>
        )}
      </div>
      {confirmando && (
        <ConfirmDialog
          titulo="Restablecer datos de prueba"
          mensaje="Se perderán los cambios locales (altas, ediciones y eliminaciones) y se volverá a los datos iniciales. ¿Continuar?"
          textoConfirmar="Restablecer"
          onConfirmar={restablecer}
          onCancelar={() => setConfirmando(false)}
        />
      )}
    </header>
  );
}
