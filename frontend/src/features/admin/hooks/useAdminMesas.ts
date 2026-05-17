import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteAdminMesa,
  getAdminMesas,
  getAdminMesasEstado,
  patchAdminMesa,
  postAdminMesa,
  postAdminMesaLiberar,
} from "@/shared/api/endpoints/admin";
import { invalidatePedidosEverywhere } from "@/shared/lib/queryCacheSync";

const mesasKey = ["admin", "mesas"] as const;

export function useAdminMesasEstado() {
  return useQuery({
    queryKey: [...mesasKey, "estado"] as const,
    queryFn: () => getAdminMesasEstado(),
    refetchInterval: 45_000,
  });
}

export function useAdminMesasCatalogo() {
  return useQuery({
    queryKey: [...mesasKey, "list"] as const,
    queryFn: () => getAdminMesas(),
  });
}

export function useAdminMesasMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: mesasKey });
    await invalidatePedidosEverywhere(qc);
  };

  const crear = useMutation({
    mutationFn: postAdminMesa,
    onSuccess: invalidate,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { etiqueta?: string | null; activa?: boolean } }) =>
      patchAdminMesa(id, body),
    onSuccess: invalidate,
  });

  const eliminar = useMutation({
    mutationFn: deleteAdminMesa,
    onSuccess: invalidate,
  });

  const liberar = useMutation({
    mutationFn: postAdminMesaLiberar,
    onSuccess: invalidate,
  });

  return { crear, actualizar, eliminar, liberar };
}
