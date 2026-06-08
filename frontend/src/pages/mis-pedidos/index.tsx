import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CopySlash } from "lucide-react";

import { useAuthHydrated } from "@/features/auth";
import { useMisPedidos } from "@/features/pedidos";
import { useAuthStore } from "@/shared/store/auth-store";
import { SkeletonTable, EmptyState, EstadoBadge } from "@/shared/ui";

const ESTADOS = [
  "TODOS",
  "PENDIENTE",
  "CONFIRMADO",
  "EN_PREP",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
] as const;

type FiltroEstado = (typeof ESTADOS)[number];

const PAGE_SIZE = 10;

/** Números de página a mostrar (con huecos grandes se compacta con …). */
function pageNumbersToShow(totalPages: number, current: number): (number | "gap")[] {
  if (totalPages <= 12) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const s = new Set<number>();
  s.add(1);
  s.add(totalPages);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= totalPages) s.add(p);
  }
  const sorted = [...s].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i];
    if (i > 0 && n - (sorted[i - 1] as number) > 1) out.push("gap");
    out.push(n);
  }
  return out;
}

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function etiquetaServicioCliente(p: {
  tipo_servicio: string;
  numero_mesa: number | null;
  dir_alias: string | null;
  dir_linea1: string | null;
}): string {
  if (p.tipo_servicio === "RETIRO_EN_LOCAL") {
    return `Local · Mesa ${p.numero_mesa ?? "—"}`;
  }
  const alias = p.dir_alias?.trim();
  const linea = p.dir_linea1?.trim();
  if (alias && linea) return `${alias} — ${linea}`;
  if (linea) return linea;
  if (alias) return alias;
  return "Envío a domicilio";
}

export function MisPedidosPage() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");

  useEffect(() => {
    setPage(1);
  }, [filtroEstado]);

  const params = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      ...(filtroEstado !== "TODOS" ? { estado: filtroEstado } : {}),
    }),
    [page, filtroEstado],
  );

  const { data, isLoading, isError, error, refetch } = useMisPedidos(params);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.2em] text-muted">Sincronizando...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const items = data?.items ?? [];
  const pages = data?.pages ?? 0;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const pageTabs = pages > 1 ? pageNumbersToShow(pages, page) : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 overflow-x-clip pb-1 fade-in lg:pb-0">
      <header className="shrink-0 border-b border-border pb-1.5">
        <div className="flex flex-col gap-2 min-[500px]:flex-row min-[500px]:items-end min-[500px]:justify-between">
          <div>
            <h1 className="font-outfit text-lg font-black uppercase tracking-tight text-primary sm:text-xl">
              Mis pedidos
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted sm:text-[10px]">
              Historial · {PAGE_SIZE} por página
            </p>
          </div>
          <label className="block w-full min-[500px]:w-52 min-[500px]:max-w-[13rem] shrink-0">
            <span className="mb-0.5 block text-left text-[9px] font-bold uppercase tracking-widest text-muted sm:text-[10px]">
              Estado
            </span>
            <select
              className="w-full rounded-lg border border-border bg-bg-secondary px-2.5 py-2 text-xs font-bold text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e === "TODOS" ? "Todos" : e.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isLoading && (
        <div className="min-h-0 shrink-0 py-2">
          <SkeletonTable />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mx-auto mt-4 max-w-md shrink-0 rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="mb-3 text-xs font-bold text-danger sm:text-sm">
            {error instanceof Error ? error.message : "No se pudieron cargar los pedidos."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="pt-2">
          <EmptyState
            titulo={filtroEstado === "TODOS" ? "Todavía no realizaste ningún pedido" : "No hay pedidos con este estado"}
            descripcion={
              filtroEstado === "TODOS"
                ? "Explorá el catálogo para armar tu primer pedido."
                : "Probá otro filtro o elegí «Todos»."
            }
            accion={filtroEstado === "TODOS" ? { label: "Ir al catálogo", href: "/" } : undefined}
            icon={CopySlash}
          />
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted sm:text-[11px]">
              Mostrando <span className="text-primary">{from}</span>–<span className="text-primary">{to}</span> de{" "}
              <span className="text-primary">{total}</span>
            </p>
            {pages > 1 && (
              <nav aria-label="Páginas del historial" className="flex min-w-0 items-center gap-1">
                <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted sm:inline sm:mr-1">
                  Página
                </span>
                <div className="flex max-w-[min(100%,28rem)] items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin] sm:max-w-none">
                  {pageTabs.map((entry, idx) =>
                    entry === "gap" ? (
                      <span key={`gap-${idx}`} className="px-0.5 text-xs font-bold text-muted">
                        …
                      </span>
                    ) : (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => setPage(entry)}
                        aria-current={entry === page ? "page" : undefined}
                        className={`min-w-[2rem] shrink-0 rounded-lg px-2 py-1.5 text-center text-xs font-bold transition-colors sm:min-w-[2.35rem] sm:text-sm ${
                          entry === page
                            ? "bg-primary text-white shadow-sm"
                            : "border border-border bg-white text-primary hover:bg-bg-secondary"
                        }`}
                      >
                        {entry}
                      </button>
                    ),
                  )}
                </div>
              </nav>
            )}
          </div>

          <div className="flex-1 lg:flex lg:flex-col">
            <div className="hidden overflow-auto rounded-lg border border-border bg-white shadow-sm md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="sticky top-0 z-10 border-b border-border bg-bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:py-2.5 sm:text-xs">
                      Nº
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:text-xs">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:text-xs">
                      Entrega
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:text-xs">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:text-xs">
                      Total
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted sm:px-4 sm:text-xs">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p) => (
                    <tr key={p.id} className="group transition-colors hover:bg-primary/5">
                      <td className="px-3 py-2 font-outfit text-xs font-bold text-primary sm:px-4 sm:py-2.5 sm:text-sm">
                        #{p.id}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted sm:px-4 sm:text-sm">{formatFecha(p.created_at)}</td>
                      <td className="max-w-[200px] px-3 py-2 text-[11px] font-bold text-primary sm:max-w-[220px] sm:px-4 sm:py-2.5 sm:text-xs">
                        <span className="line-clamp-2 break-words" title={etiquetaServicioCliente(p)}>
                          {etiquetaServicioCliente(p)}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-2.5">
                        <EstadoBadge estado={p.estado} size="sm" />
                      </td>
                      <td className="px-3 py-2 font-outfit text-xs font-bold text-primary sm:px-4 sm:py-2.5 sm:text-sm">
                        {formatMoney(Number(p.total))}
                      </td>
                      <td className="px-3 py-2 text-right sm:px-4 sm:py-2.5">
                        <Link
                          to={`/pedido/${p.id}`}
                          className="text-xs font-bold text-primary underline-offset-2 hover:underline sm:text-sm"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex max-h-[min(70dvh,calc(100dvh-12rem))] min-h-0 flex-col gap-2 overflow-y-auto pb-2 md:hidden">
              {items.map((p) => (
                <Link
                  to={`/pedido/${p.id}`}
                  key={p.id}
                  className="block rounded-xl border border-border bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <span className="font-outfit text-base font-black text-primary">#{p.id}</span>
                      <span className="block text-[11px] capitalize text-muted">{formatFecha(p.created_at)}</span>
                      <span className="line-clamp-2 pt-1 text-[11px] font-bold text-primary">
                        {etiquetaServicioCliente(p)}
                      </span>
                    </div>
                    <EstadoBadge estado={p.estado} size="sm" />
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Total</span>
                    <span className="font-outfit text-lg font-black text-primary">{formatMoney(Number(p.total))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {pages > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border pt-2 pb-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary hover:bg-bg-secondary disabled:opacity-35 sm:text-xs"
              >
                Anterior
              </button>
              <span className="text-[10px] font-bold text-muted sm:text-xs">
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-primary hover:bg-bg-secondary disabled:opacity-35 sm:text-xs"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
