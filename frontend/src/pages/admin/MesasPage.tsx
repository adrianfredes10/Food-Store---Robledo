import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAdminMesasCatalogo, useAdminMesasEstado, useAdminMesasMutations } from "@/features/admin";
import { ConfirmDialog, IOSSwitch } from "@/shared/ui";

export function AdminMesasPage() {
  const { data: estado, isLoading: loadingEstado } = useAdminMesasEstado();
  const { data: catalogo, isLoading: loadingCat } = useAdminMesasCatalogo();
  const { crear, actualizar, eliminar, liberar } = useAdminMesasMutations();

  const [numero, setNumero] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; numero: number } | null>(null);

  const onAgregar = (e: FormEvent) => {
    e.preventDefault();
    const n = parseInt(numero, 10);
    if (Number.isNaN(n) || n < 1 || n > 999) return;
    crear.mutate(
      { numero: n, etiqueta: etiqueta.trim() || null },
      {
        onSuccess: () => {
          setNumero("");
          setEtiqueta("");
        },
      },
    );
  };

  if (loadingEstado || loadingCat) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Cargando mesas...
        </p>
      </div>
    );
  }

  const r = estado?.resumen;
  const mesasActivas = (estado?.items ?? [])
    .filter((it) => it.activa)
    .sort((a, b) => a.numero - b.numero);

  return (
    <div className="flex h-full flex-col gap-3 min-h-0">

      {/* ── Resumen — siempre 3 columnas ───────────────────────────────── */}
      {r ? (
        <div className="shrink-0 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted md:text-[10px]">Activas</p>
            <p className="mt-1 font-outfit text-xl font-black text-primary">{r.total_mesas_activas}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-900/70 md:text-[10px]">Ocupadas</p>
            <p className="mt-1 font-outfit text-xl font-black text-amber-900">{r.ocupadas}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-900/70 md:text-[10px]">Libres</p>
            <p className="mt-1 font-outfit text-xl font-black text-emerald-900">{r.libres}</p>
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* ── Alta + Catálogo ─────────────────────────────────────────── */}
        <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-white p-3 shadow-sm md:p-4">
          <h2 className="mb-3 shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary md:text-xs">Alta de mesa</h2>
          <form onSubmit={onAgregar} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[6rem]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                Número (1–999)
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm font-bold text-primary focus:border-accent focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <div className="flex-[2] min-w-[8rem]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
                Etiqueta (opcional)
              </label>
              <input
                type="text"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="ej. Ventana"
                className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm font-bold text-primary focus:border-accent focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={crear.isPending}
              className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {crear.isPending ? "Guardando…" : "Agregar"}
            </button>
          </form>
          {crear.isError ? (
            <p className="mt-2 text-xs font-bold text-danger">
              {(crear.error as Error)?.message || "No se pudo crear la mesa (¿número duplicado?)."}
            </p>
          ) : null}

          <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-border pt-3">
            <h3 className="mb-2 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted md:text-[10px]">Catálogo</h3>
            {!catalogo?.length ? (
              <p className="text-xs font-bold text-muted">Sin mesas. Agregá una.</p>
            ) : (
              <ul className="flex-1 min-h-0 space-y-1 overflow-y-auto overscroll-contain">
                {catalogo.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-border/80 bg-bg-secondary/40 px-2 py-1.5"
                  >
                    <span className="min-w-0 truncate text-xs font-black text-primary font-outfit">
                      Mesa {m.numero}
                      {m.etiqueta ? (
                        <span className="ml-1 text-[10px] font-bold text-muted">· {m.etiqueta}</span>
                      ) : null}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <IOSSwitch
                        checked={m.activa}
                        disabled={actualizar.isPending}
                        labelOn="ACTIVADO"
                        labelOff="DESACTIVADO"
                        onChange={() => actualizar.mutate({ id: m.id, body: { activa: !m.activa } })}
                      />
                      <button
                        type="button"
                        className="rounded-md border border-danger/30 bg-danger/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 transition-colors"
                        onClick={() => setDeleteTarget({ id: m.id, numero: m.numero })}
                        disabled={eliminar.isPending}
                      >
                        Elim.
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Estado en tiempo real (grid denso, escala con muchas mesas) ─ */}
        <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-white p-2 shadow-sm md:p-3">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary md:text-xs">
              Estado en tiempo real
            </h2>
            {r ? (
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
                {r.total_mesas_activas} activas
              </span>
            ) : null}
          </div>

          {estado?.items.length && !estado.items.some((i) => i.activa) ? (
            <p className="text-xs font-bold text-muted">No tenés mesas activas.</p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-bg-secondary/30 p-1.5 md:max-h-[19rem]">
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 md:gap-1.5">
                {mesasActivas.map((it) => (
                    <div
                      key={it.mesa_id}
                      title={
                        it.ocupada && it.pedido
                          ? `Mesa ${it.numero}${it.etiqueta ? ` · ${it.etiqueta}` : ""} · Pedido #${it.pedido.id} · ${it.pedido.estado}${it.pedido.cliente_nombre ? ` · ${it.pedido.cliente_nombre}` : ""}`
                          : `Mesa ${it.numero}${it.etiqueta ? ` · ${it.etiqueta}` : ""} · Libre`
                      }
                      className={`min-w-0 rounded-md border px-1.5 py-1 transition-colors md:flex md:h-14 md:flex-col md:justify-between md:overflow-hidden md:py-1.5 ${
                        it.ocupada
                          ? "border-amber-300/90 bg-amber-50/90"
                          : "border-emerald-200/90 bg-emerald-50/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-0.5">
                        <span className="truncate font-outfit text-[11px] font-black leading-none text-primary">
                          {it.numero}
                        </span>
                        <span
                          className={`shrink-0 text-[7px] font-black uppercase tracking-wider leading-none ${
                            it.ocupada ? "text-amber-800" : "text-emerald-700"
                          }`}
                        >
                          {it.ocupada ? "Ocup" : "Libre"}
                        </span>
                      </div>

                      {it.etiqueta ? (
                        <p className="mt-0.5 truncate text-[8px] font-bold text-muted">{it.etiqueta}</p>
                      ) : null}

                      {it.ocupada && it.pedido ? (
                        <div className="mt-1 space-y-0.5 border-t border-amber-200/70 pt-1">
                          <Link
                            to={`/admin/pedidos/${it.pedido.id}`}
                            className="block truncate text-[9px] font-black text-accent hover:underline"
                          >
                            #{it.pedido.id}
                          </Link>
                          <p className="truncate text-[8px] font-bold uppercase tracking-wide text-amber-900/80">
                            {it.pedido.estado}
                          </p>
                          <button
                            type="button"
                            disabled={liberar.isPending}
                            onClick={() => liberar.mutate(it.mesa_id)}
                            className="w-full rounded border border-emerald-700/25 bg-white/90 px-1 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-100/80 disabled:opacity-50"
                          >
                            {liberar.isPending ? "…" : "Libre"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mesas fuera de catálogo ─────────────────────────────────────── */}
      {estado?.fuera_de_catalogo?.length ? (
        <div className="shrink-0 rounded-xl border border-amber-300 bg-amber-50/50 p-3 shadow-sm">
          <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-900 md:text-xs">
            Mesas no registradas
          </h2>
          <ul className="divide-y divide-amber-200/80">
            {estado.fuera_de_catalogo.map((row) => (
              <li key={`${row.pedido_id}-${row.numero_mesa}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-black text-primary font-outfit text-sm">Mesa {row.numero_mesa}</span>
                <Link
                  to={`/admin/pedidos/${row.pedido_id}`}
                  className="text-xs font-black uppercase tracking-widest text-accent hover:underline"
                >
                  Pedido #{row.pedido_id}
                </Link>
                <span className="text-xs font-bold text-muted">{row.estado}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar mesa"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget === null) return;
          eliminar.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
        }}
      >
        <p>
          ¿Eliminar la mesa <span className="font-semibold text-slate-900">{deleteTarget?.numero}</span>? Esta acción
          no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
