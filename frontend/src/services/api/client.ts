/** Wrapper fetch tipado. Base configurable por VITE_API_URL (ver .env.example). */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3001/api";

/** true → mocks locales con retardo; false → API real. */
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS as string | undefined) !== "false";

/** Retardo simulado de red en modo mock (300 ms por defecto). */
export function simularRetardo(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Error de API con formato del backend: { error, detalles?: { campo: mensaje } }. */
export class ApiError extends Error {
  status: number;
  detalles?: Record<string, string>;
  constructor(status: number, message: string, detalles?: Record<string, string>) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

interface CuerpoError {
  error?: string;
  detalles?: Record<string, string>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.");
  }
  if (!res.ok) {
    let cuerpo: CuerpoError = {};
    try {
      cuerpo = (await res.json()) as CuerpoError;
    } catch {
      // Respuesta no JSON: se usa el mensaje genérico.
    }
    throw new ApiError(res.status, cuerpo.error ?? `Error HTTP ${res.status}`, cuerpo.detalles);
  }
  if (res.status === 201 || res.status === 204) {
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_BASE_URL };
