import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "uploads",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
