/** Wrapper fetch tipado. Base configurable por VITE_API_URL (ver .env.example). */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

/** true → mocks locales con retardo; false → API real. Por defecto true (sin backend). */
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS as string | undefined) !== "false";

/** Retardo simulado de red en modo mock (300 ms por defecto). */
export function simularRetardo(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new ApiError(res.status, `${init?.method ?? "GET"} ${path} → HTTP ${res.status}`);
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
