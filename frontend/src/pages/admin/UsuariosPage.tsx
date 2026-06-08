import { useState } from "react";

import { useAdminUsuariosList } from "@/features/admin";
import type { AdminUsuarioItemDTO } from "@/shared/api/endpoints/admin";

function nombreCompleto(u: AdminUsuarioItemDTO): string {
  const a = u.apellido?.trim();
  return a ? `${u.nombre.trim()} ${a}` : u.nombre.trim();
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function badgeActivo(activo: boolean) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
        activo
          ? "border-success/25 bg-success/10 text-success"
          : "border-muted/20 bg-muted/10 text-muted"
      }`}
    >
      {activo ? "Sí" : "No"}
    </span>
  );
}

export function AdminUsuariosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsuariosList(page);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Cargando usuarios...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 border-b border-border/80 pb-2 md:border-0 md:pb-0">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary">Usuarios</h2>
      </div>

      <section className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain rounded-xl border border-border bg-white shadow-sm md:overflow-hidden md:p-0">
        <div className="md:h-full md:overflow-y-auto md:overscroll-y-contain">
          <table className="admin-table w-full min-w-0 border-collapse text-left">
            <thead className="border-b border-border">
              <tr>
                <th className="hidden lg:table-cell">ID</th>
                <th>Usuario</th>
                <th className="hidden lg:table-cell">Email</th>
                <th>Roles</th>
                <th className="hidden md:table-cell">Alta</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="hidden font-outfit text-xs font-black text-primary lg:table-cell">#{u.id}</td>
                  <td>
                    <span className="block text-xs font-bold text-primary">{nombreCompleto(u)}</span>
                    <span className="mt-0.5 block break-all text-[10px] font-bold text-muted lg:hidden">{u.email}</span>
                    {u.telefono?.trim() ? (
                      <span className="mt-0.5 block text-[10px] font-bold text-muted">{u.telefono}</span>
                    ) : null}
                  </td>
                  <td className="hidden max-w-[12rem] lg:table-cell">
                    <span className="break-all text-[10px] font-bold text-muted">{u.email}</span>
                  </td>
                  <td className="max-w-[7rem] md:max-w-none">
                    <span className="block truncate text-[10px] font-bold text-primary">{u.roles.join(", ") || "—"}</span>
                  </td>
                  <td className="hidden whitespace-nowrap text-[10px] font-bold text-muted md:table-cell">
                    {formatFecha(u.created_at)}
                  </td>
                  <td>{badgeActivo(u.activo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-1">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted sm:text-left">
          {data ? `Total: ${data.total} usuarios` : ""}
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
