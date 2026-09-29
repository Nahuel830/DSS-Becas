import { Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../ConfirmDialog";
import { ROUTES } from "../../routing/routes";
import { USE_MOCKS, apiClient } from "../../services/api/client";
import { db } from "../../services/api/db";
import { inicialesDe, useAuth } from "../../state/AuthContext";
import { usePermiso } from "../../state/Permisos";
import { useToast } from "../../state/ToastContext";

/** Header con usuario real, menú de sesión y restablecimiento (solo Admin). */
export function Header({ alMenu }: { alMenu: () => void }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const toast = useToast();
  const auth = useAuth();
  const puedeReset = usePermiso("dev:reset");
  const navigate = useNavigate();

  const restablecer = async () => {
    try {
      if (USE_MOCKS) {
        db.reset();
      } else {
        await apiClient.post<unknown>("/dev/reset", {});
      }
      toast.exito("Datos de prueba restablecidos.");
    } catch {
      toast.error("No se pudieron restablecer los datos.");
    }
    setConfirmando(false);
    setMenuAbierto(false);
    window.location.reload();
  };

  return (
    <>
      {USE_MOCKS && (
        <div className="demo-banner" role="alert">
          MODO DEMO – los datos NO se guardan en la base
        </div>
      )}
      <header className="topbar">
        <button className="menu-btn" type="button" onClick={alMenu} aria-label="Abrir menú">
          <Menu size={20} aria-hidden />
        </button>
        <span>DSS-Becas · Sistema de Soporte a Decisiones</span>
        <div className="user-menu">
          <button
            className="avatar-sm"
            type="button"
            title={auth.usuario ? `${auth.usuario.nombre} (${auth.usuario.rol})` : "Personal de Bienestar"}
            aria-label="Menú de usuario"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            {auth.usuario ? inicialesDe(auth.usuario.nombre) : "PB"}
          </button>
          {menuAbierto && (
            <div className="user-dropdown" role="menu">
              {auth.usuario && (
                <>
                  <div className="user-info" role="none">
                    <strong>{auth.usuario.nombre}</strong>
                    <span className="muted">@{auth.usuario.usuario} · {auth.usuario.rol}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); navigate(ROUTES.cambiarPassword); }}>
                    Cambiar contraseña
                  </button>
                </>
              )}
              {puedeReset && (
                <button type="button" role="menuitem" onClick={() => setConfirmando(true)}>
                  Restablecer datos de prueba
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  auth.salir();
                  setMenuAbierto(false);
                  navigate(ROUTES.login, { replace: true });
                }}
              >
                Cerrar sesión
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
    </>
  );
}
