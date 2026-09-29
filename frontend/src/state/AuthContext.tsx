import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { USE_MOCKS, apiClient } from "../services/api/client";

export interface SesionUsuario {
  id_usuario: number;
  usuario: string;
  nombre: string;
  correo: string;
  rol: string;
  debe_cambiar_password?: boolean;
  permisos: string[];
}

interface AuthApi {
  usuario: SesionUsuario | null;
  token: string | null;
  cargando: boolean;
  aviso: string | null;
  ingresar: (usuario: string, password: string) => Promise<void>;
  salir: (aviso?: string) => void;
}

const CLAVE_TOKEN = "dss-becas-token";
const CLAVE_USUARIO = "dss-becas-usuario";

const TODOS = [
  "estudiantes:ver", "estudiantes:crear", "estudiantes:editar", "estudiantes:eliminar",
  "documentos:subir", "documentos:eliminar",
  "evaluaciones:ver", "evaluaciones:crear", "evaluaciones:editar", "evaluaciones:eliminar",
  "asignaciones:ver", "asignaciones:generar", "asignaciones:decidir", "asignaciones:revocar",
  "seguimiento:ver", "seguimiento:editar",
  "reportes:ver", "catalogos:ver", "configuracion:ver", "configuracion:editar",
  "usuarios:gestionar", "dev:reset",
];
const PERMISOS_MOCK: Record<string, string[]> = {
  Administrador: TODOS,
  Evaluador: TODOS.filter((p) => ![
    "estudiantes:eliminar", "documentos:eliminar", "evaluaciones:eliminar",
    "asignaciones:generar", "asignaciones:revocar",
    "configuracion:ver", "configuracion:editar", "usuarios:gestionar", "dev:reset",
  ].includes(p)),
  Consulta: ["estudiantes:ver", "evaluaciones:ver", "asignaciones:ver", "seguimiento:ver", "reportes:ver", "catalogos:ver"],
};

const USUARIOS_MOCK: Array<SesionUsuario & { password: string }> = [
  { id_usuario: 1, usuario: "admin", nombre: "Admin Bienestar", correo: "admin@universidad.bo", rol: "Administrador", permisos: PERMISOS_MOCK.Administrador, password: "demo" },
  { id_usuario: 2, usuario: "evaluador", nombre: "Evaluador DSS", correo: "evaluador@universidad.bo", rol: "Evaluador", permisos: PERMISOS_MOCK.Evaluador, password: "demo" },
  { id_usuario: 3, usuario: "consulta", nombre: "Consulta Rectorado", correo: "consulta@universidad.bo", rol: "Consulta", permisos: PERMISOS_MOCK.Consulta, password: "demo" },
];

const contexto = createContext<AuthApi | null>(null);

function leerSesion(): { usuario: SesionUsuario | null; token: string | null } {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    if (!token || !crudo) return { usuario: null, token: null };
    return { usuario: JSON.parse(crudo) as SesionUsuario, token };
  } catch {
    return { usuario: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [cargando, setCargando] = useState(!USE_MOCKS);
  const [aviso, setAviso] = useState<string | null>(null);

  // Al iniciar con API real, valida el token guardado.
  useEffect(() => {
    if (USE_MOCKS || !sesion.token) {
      setCargando(false);
      return;
    }
    apiClient
      .get<SesionUsuario>("/auth/me")
      .then((usuario) => {
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
        setSesion({ usuario, token: sesion.token });
        setCargando(false);
      })
      .catch(() => {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
        setSesion({ usuario: null, token: null });
        setAviso("Su sesión expiró o sus datos cambiaron, ingrese nuevamente.");
        setCargando(false);
      });
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salir = useCallback((mensaje?: string) => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setSesion({ usuario: null, token: null });
    if (mensaje) setAviso(mensaje);
  }, []);

  // 401 global (token inválido, usuario eliminado/desactivado o versión cambiada).
  useEffect(() => {
    const handler = (e: Event): void => {
      const detalle = (e as CustomEvent<string>).detail;
      salir(detalle || "Su sesión expiró o sus datos cambiaron, ingrese nuevamente.");
    };
    window.addEventListener("dss:sesion-expirada", handler);
    return () => window.removeEventListener("dss:sesion-expirada", handler);
  }, [salir]);

  const ingresar = useCallback(async (usuario: string, password: string) => {
    setAviso(null);
    if (USE_MOCKS) {
      await new Promise((r) => setTimeout(r, 300));
      const clave = usuario.trim().toLowerCase();
      const hallado = USUARIOS_MOCK.find((u) => u.usuario === clave || u.correo.toLowerCase() === clave);
      if (!hallado || hallado.password !== password) {
        throw new Error("Usuario o contraseña incorrectos.");
      }
      const { password: _p, ...resto } = hallado;
      void _p;
      localStorage.setItem(CLAVE_TOKEN, `mock-${resto.usuario}`);
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(resto));
      setSesion({ usuario: resto, token: `mock-${resto.usuario}` });
      return;
    }
    const r = await apiClient.post<{ token: string; usuario: SesionUsuario }>("/auth/login", {
      usuario,
      password,
    });
    localStorage.setItem(CLAVE_TOKEN, r.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario));
    setSesion({ usuario: r.usuario, token: r.token });
  }, []);

  const api: AuthApi = useMemo(
    () => ({
      usuario: sesion.usuario,
      token: sesion.token,
      cargando,
      aviso,
      ingresar,
      salir,
    }),
    [sesion, cargando, aviso, ingresar, salir],
  );

  return <contexto.Provider value={api}>{children}</contexto.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(contexto);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

/** Iniciales para el avatar (p. ej. "Admin Bienestar" → "AB"). */
export function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ""}${partes[partes.length - 1][0] ?? ""}`.toUpperCase();
}
