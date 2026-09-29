import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

/** true si el usuario en sesión tiene el permiso (viene del backend). */
export function usePermiso(permiso: string): boolean {
  const auth = useAuth();
  return auth.usuario?.permisos.includes(permiso) ?? false;
}

/** Renderiza hijos solo con el permiso indicado. */
export function Puede({ permiso, children }: { permiso: string | string[]; children: ReactNode }) {
  const auth = useAuth();
  const permisos = auth.usuario?.permisos ?? [];
  const ok = Array.isArray(permiso) ? permiso.some((p) => permisos.includes(p)) : permisos.includes(permiso);
  if (!ok) return null;
  return <>{children}</>;
}
