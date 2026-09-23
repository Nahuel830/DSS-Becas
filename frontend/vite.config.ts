import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // Coincide con .vscode/launch.json ("Launch Chrome against localhost").
    port: 8080,
  },
});
