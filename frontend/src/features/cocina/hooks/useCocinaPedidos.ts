import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cocinaTransicionPedido,
  getCocinaPedidos,
  type CocinaPedidoItem,
  type CocinaPedidosResponse,
} from "@/shared/api/endpoints/cocina";

export const COCINA_PEDIDOS_KEY = ["cocina", "pedidos"] as const;

export function sortCocinaPedidos(items: CocinaPedidoItem[]): CocinaPedidoItem[] {
  return [...items].sort(
    (a, b) => new Date(a.confirmado_en).getTime() - new Date(b.confirmado_en).getTime(),
  );
}

export function useCocinaPedidosList(pollingEnabled = false) {
  return useQuery({
    queryKey: COCINA_PEDIDOS_KEY,
    queryFn: getCocinaPedidos,
    select: (data: CocinaPedidosResponse) => ({
      items: sortCocinaPedidos(data.items),
    }),
    refetchInterval: pollingEnabled ? 30_000 : false,
  });
}

export function useCocinaTransicion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pedidoId, estado }: { pedidoId: number; estado: string }) =>
      cocinaTransicionPedido(pedidoId, { estado }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: COCINA_PEDIDOS_KEY });
    },
    onError: () => toast.error("Transición no permitida"),
  });
}
