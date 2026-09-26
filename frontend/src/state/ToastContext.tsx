import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type TipoToast = "exito" | "error" | "advertencia" | "info";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

export interface ToastApi {
  mostrar: (tipo: TipoToast, mensaje: string) => void;
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  advertencia: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const contexto = createContext<ToastApi | null>(null);

const CLASE: Record<TipoToast, string> = {
  exito: "toast-exito",
  error: "toast-error",
  advertencia: "toast-advertencia",
  info: "toast-info",
};

/** Notificaciones Toast globales (éxito, error, advertencia, info). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((tipo: TipoToast, mensaje: string) => {
    const id = Date.now() + Math.random();
    setToasts((actual) => [...actual, { id, tipo, mensaje }]);
    setTimeout(() => {
      setToasts((actual) => actual.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const api: ToastApi = {
    mostrar,
    exito: (mensaje) => mostrar("exito", mensaje),
    error: (mensaje) => mostrar("error", mensaje),
    advertencia: (mensaje) => mostrar("advertencia", mensaje),
    info: (mensaje) => mostrar("info", mensaje),
  };

  return (
    <contexto.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${CLASE[t.tipo]}`}>
            {t.mensaje}
          </div>
        ))}
      </div>
    </contexto.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(contexto);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
