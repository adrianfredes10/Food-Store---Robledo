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
    <div className="min-w-0 max-w-full max-md:overflow-x-clip space-y-6 pb-16 sm:space-y-8 sm:pb-20 md:overflow-x-visible">
      <p className="text-xs font-bold uppercase tracking-widest text-muted max-w-2xl leading-relaxed">
        Listado de cuentas registradas (solo lectura).
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">ID</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Nombre</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Email</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Roles</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Alta</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-4 font-outfit text-sm font-black text-primary">#{u.id}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-primary">{nombreCompleto(u)}</span>
                    {u.telefono?.trim() ? (
                      <span className="mt-1 block text-xs font-bold text-muted">{u.telefono}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 max-w-[14rem]">
                    <span className="break-all text-xs font-bold text-muted">{u.email}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold text-primary">{u.roles.join(", ") || "—"}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-muted">
                    {formatFecha(u.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${u.activo ? "text-accent" : "text-danger"}`}
                    >
                      {u.activo ? "Sí" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted sm:text-left">
          {data ? `Total: ${data.total} usuarios` : ""}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-xl border border-border bg-white p-3 text-xs font-bold uppercase tracking-widest text-primary shadow-sm transition-all hover:border-muted/50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Ant
          </button>
          <span className="min-w-[2rem] text-center text-sm font-black text-primary">{page}</span>
          <button
            type="button"
            disabled={!data || page * data.size >= data.total}
            className="rounded-xl border border-border bg-white p-3 text-xs font-bold uppercase tracking-widest text-primary shadow-sm transition-all hover:border-muted/50 disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
          >
            Sig
          </button>
        </div>
      </div>
    </div>
  );
}
