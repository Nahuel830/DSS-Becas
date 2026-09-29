import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // Acepta orígenes de la red local además de CORS_ORIGIN.
  // true por defecto en desarrollo, false en producción salvo valor explícito.
  CORS_LAN: (process.env.CORS_LAN ?? (process.env.NODE_ENV === "production" ? "false" : "true")) !== "false",
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

// http://localhost:* | http://127.0.0.1:* | http://192.168.*.*:* | http://10.*.*.*:*
const LAN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

/** Orígenes permitidos: CORS_ORIGIN siempre + red local si CORS_LAN=true. */
export function origenPermitido(origen: string | undefined): boolean {
  if (!origen) return true;
  if (origen === env.CORS_ORIGIN) return true;
  return env.CORS_LAN && LAN_RE.test(origen);
}
