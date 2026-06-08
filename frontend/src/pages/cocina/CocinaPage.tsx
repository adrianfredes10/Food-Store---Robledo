import { useOutletContext } from "react-router-dom";

import { CocinaColumn, CocinaPedidoCard, useCocinaPedidosList, useCocinaTransicion } from "@/features/cocina";
import type { CocinaLayoutContext } from "@/pages/cocina/CocinaLayout";

export function CocinaPage() {
  const { isLive } = useOutletContext<CocinaLayoutContext>();
  const { data, isLoading } = useCocinaPedidosList(!isLive);
  const transicion = useCocinaTransicion();

  const items = data?.items ?? [];
  const pendientes = items.filter((p) => p.estado === "CONFIRMADO");
  const enPreparacion = items.filter((p) => p.estado === "EN_PREP");
  const finalizados = items.filter((p) => p.estado === "EN_CAMINO");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-muted">
          Cargando pedidos...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2 fade-in">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <CocinaColumn title="Pendiente" count={pendientes.length} emptyLabel="Sin pedidos">
          {pendientes.map((pedido) => (
            <CocinaPedidoCard
              key={pedido.id}
              pedido={pedido}
              avanzarLabel="Preparar"
              isPending={transicion.isPending && transicion.variables?.pedidoId === pedido.id}
              onAvanzar={() => transicion.mutate({ pedidoId: pedido.id, estado: "EN_PREP" })}
            />
          ))}
        </CocinaColumn>

        <CocinaColumn title="En preparación" count={enPreparacion.length} emptyLabel="Nada en prep">
          {enPreparacion.map((pedido) => (
            <CocinaPedidoCard
              key={pedido.id}
              pedido={pedido}
              avanzarLabel="Finalizar"
              isPending={transicion.isPending && transicion.variables?.pedidoId === pedido.id}
              onAvanzar={() => transicion.mutate({ pedidoId: pedido.id, estado: "EN_CAMINO" })}
            />
          ))}
        </CocinaColumn>

        <CocinaColumn title="Finalizado" count={finalizados.length} emptyLabel="Sin finalizados">
          {finalizados.map((pedido) => (
            <CocinaPedidoCard key={pedido.id} pedido={pedido} finalizado />
          ))}
        </CocinaColumn>
      </div>
    </div>
  );
}
