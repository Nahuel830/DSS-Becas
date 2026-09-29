import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { USE_MOCKS, apiClient } from "../../services/api/client";
import { db } from "../../services/api/db";
import { useToast } from "../../state/ToastContext";

/** Header con botón de menú (móvil), avatar de usuario y restablecimiento de datos. */
export function Header({ alMenu }: { alMenu: () => void }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const toast = useToast();

  // Sin backend no hay mocks silenciosos: se avisa con banner fijo.
  const salud = useQuery({
    queryKey: ["health"],
    queryFn: () => apiClient.health(),
    enabled: !USE_MOCKS,
    retry: false,
    refetchOnWindowFocus: false,
  });

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
      {!USE_MOCKS && salud.isError && (
        <div className="demo-banner offline" role="alert">
          Sin conexión con el servidor
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
    </>
  );
}
