import { useState } from "react";
import { Link } from "react-router-dom";

import { useAdminPedidosList } from "@/features/admin";
import type { AdminPedidoItemDTO } from "@/shared/api/endpoints/admin";
import { EstadoBadge } from "@/shared/ui";

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function etiquetaModalidad(tipo_servicio: string): string {
  return tipo_servicio === "RETIRO_EN_LOCAL" ? "Retiro en local" : "Delivery";
}

function celdaMesa(p: AdminPedidoItemDTO): string {
  if (p.tipo_servicio !== "RETIRO_EN_LOCAL") return "—";
  return p.numero_mesa != null ? String(p.numero_mesa) : "—";
}

function resumenDireccionEntrega(p: AdminPedidoItemDTO): string {
  if (p.tipo_servicio === "RETIRO_EN_LOCAL") return "—";
  const linea = [p.dir_linea1, p.dir_ciudad, p.dir_provincia, p.dir_cp]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(" · ");
  return linea || "Sin dirección";
}

export function AdminPedidosPage() {
  const [page, setPage] = useState(1);
  // cargo los pedidos del back, cambia con la paginacion
  const { data, isLoading } = useAdminPedidosList(page);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
            Sincronizando Órdenes...
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full max-md:overflow-x-clip space-y-6 pb-16 sm:space-y-8 sm:pb-20 md:overflow-x-visible">
      <p className="text-xs font-bold uppercase tracking-widest text-muted max-w-2xl leading-relaxed">
        &quot;Mesa&quot; aplica solo a pedidos en el local. No existe un módulo de reservas: la mesa se guarda en cada
        pedido. En delivery se muestra la dirección de envío.
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="bg-bg-secondary border-b border-border">
                <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">ID</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Cliente</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Modalidad</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Mesa</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Dirección</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Estado</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Importe</th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {data?.items.map((p) => (
                <tr key={p.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-4 font-outfit text-sm font-black text-primary">#{p.id}</td>
                    <td className="px-4 py-4 max-w-[13rem]">
                      <span className="block text-sm font-bold text-primary line-clamp-2">
                        {p.cliente_nombre?.trim() || `ID ${p.usuario_id}`}
                      </span>
                      {p.cliente_email?.trim() ? (
                        <span className="mt-0.5 block break-all text-[11px] font-bold text-muted">{p.cliente_email}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-primary whitespace-nowrap">
                      {etiquetaModalidad(p.tipo_servicio)}
                    </td>
                    <td className="px-4 py-4 font-outfit text-sm font-black text-primary whitespace-nowrap">
                      {celdaMesa(p)}
                    </td>
                    <td className="px-4 py-4 max-w-[14rem] sm:max-w-xs">
                      <span
                        className="block text-xs font-bold text-muted line-clamp-2"
                        title={resumenDireccionEntrega(p)}
                      >
                        {resumenDireccionEntrega(p)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                        <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-primary whitespace-nowrap">
                        {formatMoney(p.total)}
                    </td>
                    <td className="px-4 py-4 text-right">
                    <Link 
                        className="text-xs font-bold text-accent hover:text-accent-hover transition-colors uppercase tracking-widest" 
                        to={`/admin/pedidos/${p.id}`}
                    >
                        Gestionar
                    </Link>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted sm:text-left">
          {data ? `Total: ${data.total} registros localizados` : ""}
        </p>
        
        <div className="flex items-center justify-center gap-4">
            <button
            type="button"
            disabled={page <= 1}
            className="p-3 rounded-xl border border-border bg-white text-xs font-bold uppercase tracking-widest text-primary hover:border-muted/50 disabled:opacity-50 transition-all shadow-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
            Ant
            </button>
            <span className="text-sm font-black text-primary min-w-[2rem] text-center">
                {page}
            </span>
            <button
            type="button"
            disabled={!data || page * data.size >= data.total}
            className="p-3 rounded-xl border border-border bg-white text-xs font-bold uppercase tracking-widest text-primary hover:border-muted/50 disabled:opacity-50 transition-all shadow-sm"
            onClick={() => setPage((p) => p + 1)}
            >
            Sig
            </button>
        </div>
      </div>
    </div>
  );
}
