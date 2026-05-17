import type { QueryClient } from "@tanstack/react-query";

/** Catálogo público + listados admin que dependen de productos/categorías/ingredientes. */
export async function invalidateAfterCatalogMutate(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["productos"] }),
    qc.invalidateQueries({ queryKey: ["categorias"] }),
    qc.invalidateQueries({ queryKey: ["admin-categorias-todas"] }),
    qc.invalidateQueries({ queryKey: ["admin-ingredientes-todas"] }),
    qc.invalidateQueries({ queryKey: ["ingredientes"] }),
    qc.invalidateQueries({ queryKey: ["producto-ingredientes"] }),
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
  ]);
}

export async function invalidateAfterDireccionesMutate(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["direcciones"] }),
    qc.invalidateQueries({ queryKey: ["me"] }),
  ]);
}

export async function invalidatePedidosEverywhere(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["admin", "pedidos"] }),
    qc.invalidateQueries({ queryKey: ["admin", "pedido"] }),
    qc.invalidateQueries({ queryKey: ["mis-pedidos"] }),
    qc.invalidateQueries({ queryKey: ["pedido"] }),
    qc.invalidateQueries({ queryKey: ["pedido-historial"] }),
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    qc.invalidateQueries({ queryKey: ["productos"] }),
    qc.invalidateQueries({ queryKey: ["admin", "mesas"] }),
  ]);
}

export async function invalidateAfterCrearPedido(qc: QueryClient) {
  await invalidatePedidosEverywhere(qc);
}
