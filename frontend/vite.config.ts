import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * El front usa baseURL `/api/...`; el backend expone la API bajo `/api/v1` (spec v5).
 * - Desarrollo en el host: proxy → 127.0.0.1:8008 (ver abajo).
 * - Docker Compose: definí `VITE_PROXY_API_TARGET=http://api:8008` y NO establezcas `VITE_API_BASE_URL`
 *   para que el navegador pida a `:5173/api/...` y Vite reenvíe al contenedor `api`.
 */
const apiProxyTarget =
  process.env.VITE_PROXY_API_TARGET?.trim() || "http://127.0.0.1:8008";

const apiProxy = {
  "/api": {
    target: apiProxyTarget,
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
