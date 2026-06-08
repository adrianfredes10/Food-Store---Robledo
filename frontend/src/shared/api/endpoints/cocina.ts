import { apiClient, resolveApiBase } from "@/shared/api/client";

export const COCINA_PATH = "/cocina";

export type CocinaDetalleLinea = {
  nombre_producto: string;
  cantidad: number;
  personalizacion?: number[] | null;
};

export type CocinaPedidoItem = {
  id: number;
  estado: string;
  tipo_servicio: string;
  numero_mesa?: number | null;
  observaciones_cliente?: string | null;
  confirmado_en: string;
  total: string | number;
  detalles: CocinaDetalleLinea[];
};

export type CocinaPedidosResponse = {
  items: CocinaPedidoItem[];
};

export type CocinaTransicionBody = {
  estado: string;
};

export type CocinaWsEventType =
  | "PEDIDO_CONFIRMADO"
  | "PEDIDO_EN_PREPARACION"
  | "PEDIDO_EN_CAMINO"
  | "PEDIDO_CANCELADO";

export type CocinaWsEvent = {
  type: CocinaWsEventType;
  pedido_id: number;
  pedido?: CocinaPedidoItem;
};

export function resolveCocinaWsUrl(token: string): string {
  const apiBase = resolveApiBase().replace(/\/+$/, "");
  const path = `${COCINA_PATH}/ws`;
  const qs = `token=${encodeURIComponent(token)}`;

  if (apiBase.startsWith("http")) {
    const url = new URL(apiBase);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/+$/, "")}${path}`;
    url.search = qs;
    return url.toString();
  }

  const protocol =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:5173";
  return `${protocol}//${host}${apiBase}${path}?${qs}`;
}

export async function getCocinaPedidos(): Promise<CocinaPedidosResponse> {
  const { data } = await apiClient.get<CocinaPedidosResponse>(`${COCINA_PATH}/pedidos`);
  return data;
}

export async function cocinaTransicionPedido(
  pedidoId: number,
  body: CocinaTransicionBody,
): Promise<{ id: number; estado: string }> {
  const { data } = await apiClient.post<{ id: number; estado: string }>(
    `${COCINA_PATH}/pedidos/${pedidoId}/transicion`,
    body,
  );
  return data;
}
