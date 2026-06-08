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
  return tipo_servicio === "RETIRO_EN_LOCAL" ? "Retiro" : "Delivery";
}

function celdaMesa(p: AdminPedidoItemDTO): string {
  if (p.tipo_servicio !== "RETIRO_EN_LOCAL") return "—";
  return p.numero_mesa != null ? `Mesa ${p.numero_mesa}` : "—";
}

function resumenDireccionEntrega(p: AdminPedidoItemDTO): string {
  if (p.tipo_servicio === "RETIRO_EN_LOCAL") return "—";
  const linea = [p.dir_linea1, p.dir_ciudad, p.dir_provincia, p.dir_cp]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(" · ");
  return linea || "Sin dirección";
}

function metaPedido(p: AdminPedidoItemDTO): string {
  const partes = [etiquetaModalidad(p.tipo_servicio)];
  const mesa = celdaMesa(p);
  if (mesa !== "—") partes.push(mesa);
  const dir = resumenDireccionEntrega(p);
  if (dir !== "—") partes.push(dir);
  return partes.join(" · ");
}

export function AdminPedidosPage() {
  const [page, setPage] = useState(1);
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
    <div className="flex h-full flex-col gap-2 min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="h-full overflow-x-auto overflow-y-auto overscroll-contain">
          <table className="admin-table w-full min-w-0 border-collapse text-left">
            <thead className="border-b border-border">
              <tr>
                <th className="hidden lg:table-cell">ID</th>
                <th>Cliente</th>
                <th className="hidden xl:table-cell">Modalidad</th>
                <th className="hidden xl:table-cell">Mesa</th>
                <th className="hidden xl:table-cell">Dirección</th>
                <th>Estado</th>
                <th>Importe</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="hidden font-outfit text-xs font-black text-primary lg:table-cell">#{p.id}</td>
                  <td className="max-w-[10rem] lg:max-w-[12rem]">
                    <span className="block text-xs font-bold text-primary line-clamp-2">
                      {p.cliente_nombre?.trim() || `ID ${p.usuario_id}`}
                    </span>
                    {p.cliente_email?.trim() ? (
                      <span className="mt-0.5 block break-all text-[10px] font-bold text-muted line-clamp-1">
                        {p.cliente_email}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block truncate text-[10px] font-bold text-muted xl:hidden" title={metaPedido(p)}>
                      {metaPedido(p)}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap text-xs font-bold text-primary xl:table-cell">
                    {etiquetaModalidad(p.tipo_servicio)}
                  </td>
                  <td className="hidden font-outfit text-xs font-black text-primary whitespace-nowrap xl:table-cell">
                    {p.tipo_servicio === "RETIRO_EN_LOCAL" && p.numero_mesa != null ? p.numero_mesa : "—"}
                  </td>
                  <td className="hidden max-w-[10rem] xl:table-cell">
                    <span className="block text-[10px] font-bold text-muted line-clamp-2" title={resumenDireccionEntrega(p)}>
                      {resumenDireccionEntrega(p)}
                    </span>
                  </td>
                  <td>
                    <EstadoBadge estado={p.estado} size="sm" />
                  </td>
                  <td className="whitespace-nowrap text-xs font-bold text-primary">
                    {formatMoney(p.total)}
                  </td>
                  <td className="text-right">
                    <Link
                      className="text-[10px] font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent-hover"
                      to={`/admin/pedidos/${p.id}`}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-1">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted sm:text-left">
          {data ? `Total: ${data.total} pedidos` : ""}
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all hover:border-muted/50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Ant
          </button>
          <span className="min-w-[1.5rem] text-center text-xs font-black text-primary">{page}</span>
          <button
            type="button"
            disabled={!data || page * data.size >= data.total}
            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all hover:border-muted/50 disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
          >
            Sig
          </button>
        </div>
      </div>
    </div>
  );
}
