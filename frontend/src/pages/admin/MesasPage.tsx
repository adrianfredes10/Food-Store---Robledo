import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAdminMesasCatalogo, useAdminMesasEstado, useAdminMesasMutations } from "@/features/admin";

export function AdminMesasPage() {
  const { data: estado, isLoading: loadingEstado } = useAdminMesasEstado();
  const { data: catalogo, isLoading: loadingCat } = useAdminMesasCatalogo();
  const { crear, actualizar, eliminar, liberar } = useAdminMesasMutations();

  const [numero, setNumero] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

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

  return (
    <div className="min-w-0 max-w-full max-md:overflow-x-clip space-y-8 pb-20 md:overflow-x-visible">
      <div>
        <h1 className="text-2xl font-black text-primary font-outfit tracking-tight">Mesas y reservas</h1>
        <p className="mt-2 max-w-2xl text-sm font-bold uppercase tracking-widest text-muted leading-relaxed">
          Cargá todas las mesas del salón (ej. 24). Una mesa aparece ocupada solo cuando el pedido en{" "}
          <span className="text-primary">&quot;Comer en el local&quot;</span> está{" "}
          <span className="text-primary">pagado</span> y en curso. Cuando el cliente se va, marcá la mesa como libre
          para el próximo uso.
        </p>
      </div>

      {r ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Mesas activas</p>
            <p className="mt-2 text-3xl font-black text-primary font-outfit">{r.total_mesas_activas}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/70">Ocupadas</p>
            <p className="mt-2 text-3xl font-black text-amber-900 font-outfit">{r.ocupadas}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-900/70">Libres</p>
            <p className="mt-2 text-3xl font-black text-emerald-900 font-outfit">{r.libres}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-primary">Alta de mesa</h2>
          <form onSubmit={onAgregar} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted">Número (1–999)</label>
              <input
                type="number"
                min={1}
                max={999}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted">Etiqueta (opcional)</label>
              <input
                type="text"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="ej. Ventana"
                className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-primary"
              />
            </div>
            {crear.isError ? (
              <p className="text-xs font-bold text-danger">
                {(crear.error as Error)?.message || "No se pudo crear la mesa (¿número duplicado?)."}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={crear.isPending}
              className="w-full rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {crear.isPending ? "Guardando…" : "Agregar mesa"}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Catálogo</h3>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {(catalogo ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm font-black text-primary font-outfit">
                    Mesa {m.numero}
                    {m.etiqueta ? (
                      <span className="ml-2 text-xs font-bold text-muted">· {m.etiqueta}</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted hover:border-muted/50"
                      onClick={() => actualizar.mutate({ id: m.id, body: { activa: !m.activa } })}
                      disabled={actualizar.isPending}
                    >
                      {m.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-danger/30 bg-danger/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/10"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la mesa ${m.numero}?`)) eliminar.mutate(m.id);
                      }}
                      disabled={eliminar.isPending}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {!catalogo?.length ? (
              <p className="mt-3 text-xs font-bold text-muted">No hay mesas cargadas. Agregá al menos una para el salón.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-primary">Estado en tiempo casi real</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {estado?.items
              .filter((it) => it.activa)
              .map((it) => (
                <div
                  key={it.mesa_id}
                  className={`rounded-2xl border-2 p-4 shadow-sm transition-colors ${
                    it.ocupada
                      ? "border-amber-300 bg-amber-50/90"
                      : "border-emerald-200 bg-emerald-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-primary font-outfit">
                      Mesa {it.numero}
                      {it.etiqueta ? (
                        <span className="ml-1 block text-xs font-bold text-muted sm:inline sm:ml-2">{it.etiqueta}</span>
                      ) : null}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        it.ocupada ? "text-amber-800" : "text-emerald-800"
                      }`}
                    >
                      {it.ocupada ? "Ocupada" : "Libre"}
                    </span>
                  </div>
                  {it.ocupada && it.pedido ? (
                    <div className="mt-3 space-y-1 text-xs font-bold text-primary">
                      <p>
                        Pedido{" "}
                        <Link
                          to={`/admin/pedidos/${it.pedido.id}`}
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          #{it.pedido.id}
                        </Link>{" "}
                        · {it.pedido.estado}
                      </p>
                      {it.pedido.cliente_nombre ? <p className="text-muted">{it.pedido.cliente_nombre}</p> : null}
                      {it.pedido.cliente_email ? (
                        <p className="break-all text-[11px] font-bold text-muted">{it.pedido.cliente_email}</p>
                      ) : null}
                      <button
                        type="button"
                        disabled={liberar.isPending}
                        onClick={() => liberar.mutate(it.mesa_id)}
                        className="mt-3 w-full rounded-lg border border-emerald-700/30 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100/80 disabled:opacity-50"
                      >
                        {liberar.isPending ? "Actualizando…" : "Marcar mesa libre"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
          {estado?.items.length && !estado.items.some((i) => i.activa) ? (
            <p className="text-sm font-bold text-muted">No tenés mesas activas en el catálogo.</p>
          ) : null}
        </div>
      </div>

      {estado?.fuera_de_catalogo?.length ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-900">Pedidos en mesas no registradas</h2>
          <p className="mt-2 text-xs font-bold text-amber-900/80">
            El cliente eligió un número de mesa que no está en tu catálogo. Convén crear esa mesa o corregir el flujo de checkout.
          </p>
          <ul className="mt-4 divide-y divide-amber-200/80">
            {estado.fuera_de_catalogo.map((row) => (
              <li key={`${row.pedido_id}-${row.numero_mesa}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-black text-primary font-outfit">Mesa {row.numero_mesa}</span>
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
    </div>
  );
}
