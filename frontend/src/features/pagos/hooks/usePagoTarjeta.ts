import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

import { crearPagoTarjeta } from "@/shared/api/endpoints/pagos";
import { invalidatePedidosEverywhere } from "@/shared/lib/queryCacheSync";

type Vars = {
  pedidoId: number;
  token: string;
  payment_method_id: string;
  payer_email: string;
  installments?: number;
};

export function usePagoTarjeta() {
  const qc = useQueryClient();
  const idempotencyRef = useRef(crypto.randomUUID());

  return useMutation({
    mutationFn: (vars: Vars) =>
      crearPagoTarjeta(
        {
          pedido_id: vars.pedidoId,
          token: vars.token,
          payment_method_id: vars.payment_method_id,
          payer_email: vars.payer_email,
          installments: vars.installments,
        },
        idempotencyRef.current,
      ),
    onSuccess: () => {
      toast.success("Pago procesado");
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["productos"] }),
        invalidatePedidosEverywhere(qc),
      ]);
    },
    onError: () => {
      toast.error("El pago no pudo completarse");
    },
  });
}
