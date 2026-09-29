import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0: accesible desde otras PCs de la red local (ver README).
    host: true,
    port: 5173,
    proxy: {
      // /api relativo: el frontend llama al backend por el mismo host/puerto.
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
