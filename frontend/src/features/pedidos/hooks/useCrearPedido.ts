import { useMutation, useQueryClient } from "@tanstack/react-query";

import { crearPedido, type CrearPedidoBody } from "@/shared/api/endpoints/pedidos";
import { invalidateAfterCrearPedido } from "@/shared/lib/queryCacheSync";

export function useCrearPedido() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CrearPedidoBody) => crearPedido(body),
    onSuccess: () => {
      void invalidateAfterCrearPedido(qc);
    },
  });
}
