import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * El front usa baseURL `/api/...`; el backend expone la API bajo `/api/v1` (spec v5).
 * Ej.: `/api/auth/login` → `http://127.0.0.1:8000/api/v1/auth/login`
 */
const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8008",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api/, "/api/v1"),
  },
} as const;

/** Docker Desktop (sobre todo Windows): el FS montado no dispara inotify; hace falta polling. */
const dockerWatch =
  process.env.DOCKER_DEV === "1" || process.env.CHOKIDAR_USEPOLLING === "true"
    ? { usePolling: true as const, interval: 1000 }
    : undefined;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    ...(dockerWatch ? { watch: dockerWatch } : {}),
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
