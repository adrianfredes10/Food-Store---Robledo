/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** En docker-compose: "1" → siempre `/api` (proxy Vite → servicio `api`). */
  readonly VITE_DOCKER_COMPOSE?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  /** Clave pública Mercado Pago (Checkout Bricks / CardPayment) */
  readonly VITE_MP_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
