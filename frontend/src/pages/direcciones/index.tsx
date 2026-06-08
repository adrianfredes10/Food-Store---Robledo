import { Star, MapPin, MapPinned } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuthHydrated } from "@/features/auth";
import { useDirecciones, useDireccionesMutations, useMarcarPrincipal } from "@/features/direcciones";
import { useAuthStore } from "@/shared/store/auth-store";
import { ConfirmDialog, FormField, LoadingButton, EmptyState } from "@/shared/ui";

const emptyForm = {
  alias: "",
  calle: "",
  numero: "",
  piso_dpto: "",
  ciudad: "",
  codigo_postal: "",
  referencias: "",
  es_principal: false,
};

export function DireccionesPage() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const { data = [], isLoading } = useDirecciones();
  const { crear, actualizar, eliminar } = useDireccionesMutations();
  const marcarPrincipal = useMarcarPrincipal();
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  const inputClass =
    "mt-0.5 w-full rounded-lg border border-border bg-bg-secondary px-2.5 py-2 text-xs font-bold text-primary transition-all placeholder:text-muted/50 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-1.5 overflow-x-clip pb-1 fade-in lg:pb-0">
      <header className="shrink-0 border-b border-border pb-1.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-outfit text-lg font-black tracking-tight text-primary sm:text-xl">Direcciones</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted sm:text-[10px]">
              Para envíos y checkout
            </p>
          </div>
          <Link
            to="/mis-pedidos"
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-primary underline-offset-2 transition-colors hover:underline sm:text-xs"
          >
            Mis pedidos
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-3 lg:overflow-hidden">
        {/* Lista: primera en móvil; scroll interno en desktop */}
        <div className="order-1 flex min-h-0 flex-col lg:order-2 lg:col-span-7">
          <h2 className="mb-1 flex shrink-0 items-center gap-1.5 border-b border-border pb-1 text-[10px] font-bold uppercase tracking-widest text-primary sm:text-[11px]">
            <MapPinned className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
            Mis direcciones
          </h2>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-gutter:stable]">
            {isLoading && (
              <div className="space-y-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg border border-border bg-bg-secondary sm:h-[5.25rem]"
                  />
                ))}
              </div>
            )}

            {!isLoading && data.length === 0 && (
              <div className="pt-2">
                <EmptyState
                  titulo="Sin direcciones"
                  descripcion="Cargá una dirección con el formulario al lado (o abajo en móvil)."
                  icon={MapPin}
                />
              </div>
            )}

            {!isLoading && data.length > 0 && (
              <ul className="space-y-2 pt-1">
                {data.map((d) => (
                  <li
                    key={d.id}
                    className={`rounded-lg border bg-white p-2.5 shadow-sm transition-all sm:p-3 ${
                      editingId === d.id ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary sm:text-xs">
                            {d.alias ?? "Dirección"}
                          </span>
                          {d.es_principal && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-primary">
                              <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="font-outfit text-sm font-black leading-snug text-primary sm:text-base">
                          {d.calle} {d.numero}
                          {d.piso_dpto ? ` · ${d.piso_dpto}` : ""}
                        </p>
                        <p className="text-[11px] text-muted sm:text-xs">
                          {d.ciudad} (CP {d.codigo_postal})
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:underline sm:text-xs"
                          onClick={() => {
                            setEditingId(d.id);
                            setForm({
                              alias: d.alias ?? "",
                              calle: d.calle,
                              numero: d.numero,
                              piso_dpto: d.piso_dpto ?? "",
                              ciudad: d.ciudad,
                              codigo_postal: d.codigo_postal,
                              referencias: d.referencias ?? "",
                              es_principal: d.es_principal,
                            });
                          }}
                        >
                          Editar
                        </button>
                        {!d.es_principal && (
                          <button
                            type="button"
                            disabled={marcarPrincipal.isPending}
                            className="text-[10px] font-bold uppercase tracking-wide text-muted transition-colors hover:text-primary disabled:opacity-50 sm:text-xs"
                            onClick={() =>
                              marcarPrincipal.mutate(d.id, {
                                onSuccess: () => toast.success("Dirección principal actualizada"),
                                onError: () => toast.error("Hubo un error al actualizar"),
                              })
                            }
                          >
                            Principal
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase tracking-wide text-danger transition-colors hover:text-danger/80 sm:text-xs"
                          onClick={() => setDeleteId(d.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="order-2 flex min-h-0 flex-col lg:order-1 lg:col-span-5 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable]">
          <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm sm:p-3">
            <h2 className="mb-2 flex items-center gap-1.5 border-b border-border pb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary sm:text-[11px]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
              {editingId ? "Editar" : "Nueva"}
            </h2>

            <form
              className="space-y-2 sm:space-y-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.calle.trim() || !form.numero.trim() || !form.ciudad.trim() || !form.codigo_postal.trim()) return;

                const payload = {
                  alias: form.alias.trim() || null,
                  calle: form.calle.trim(),
                  numero: form.numero.trim(),
                  piso_dpto: form.piso_dpto.trim() || null,
                  ciudad: form.ciudad.trim(),
                  codigo_postal: form.codigo_postal.trim(),
                  referencias: form.referencias.trim() || null,
                  es_principal: form.es_principal,
                };

                if (editingId) {
                  actualizar.mutate(
                    { id: editingId, body: payload },
                    {
                      onSuccess: () => {
                        setEditingId(null);
                        setForm(emptyForm);
                      },
                    },
                  );
                } else {
                  crear.mutate(payload, {
                    onSuccess: () => setForm(emptyForm),
                  });
                }
              }}
            >
              <FormField label="Alias" className="[&_label]:text-[10px] [&_label]:sm:text-xs">
                <input className={inputClass} placeholder="Casa, trabajo…" value={form.alias} onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))} />
              </FormField>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Calle *" className="col-span-1 [&_label]:text-[10px] [&_label]:sm:text-xs">
                  <input required className={inputClass} value={form.calle} onChange={(e) => setForm((f) => ({ ...f, calle: e.target.value }))} />
                </FormField>
                <FormField label="Número *" className="col-span-1 [&_label]:text-[10px] [&_label]:sm:text-xs">
                  <input required className={inputClass} value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField label="Piso / Dpto" className="col-span-1 [&_label]:text-[10px] [&_label]:sm:text-xs">
                  <input className={inputClass} value={form.piso_dpto} onChange={(e) => setForm((f) => ({ ...f, piso_dpto: e.target.value }))} />
                </FormField>
                <FormField label="Ciudad *" className="col-span-1 [&_label]:text-[10px] [&_label]:sm:text-xs">
                  <input required className={inputClass} value={form.ciudad} onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))} />
                </FormField>
              </div>

              <FormField label="CP *" className="[&_label]:text-[10px] [&_label]:sm:text-xs">
                <input required className={inputClass} value={form.codigo_postal} onChange={(e) => setForm((f) => ({ ...f, codigo_postal: e.target.value }))} />
              </FormField>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="esPrincipal"
                  className="h-3.5 w-3.5 cursor-pointer rounded border-border text-primary focus:ring-primary"
                  checked={form.es_principal}
                  onChange={(e) => setForm((f) => ({ ...f, es_principal: e.target.checked }))}
                />
                <label htmlFor="esPrincipal" className="cursor-pointer select-none text-[10px] font-bold uppercase tracking-wide text-muted sm:text-[11px]">
                  Principal
                </label>
              </div>

              <div className="flex flex-col gap-1.5 pt-1 sm:gap-2">
                <LoadingButton
                  type="submit"
                  isLoading={crear.isPending || actualizar.isPending}
                  className="w-full rounded-lg bg-primary py-2 text-xs font-bold tracking-wide text-white shadow-sm hover:bg-primary-hover sm:py-2.5 sm:text-sm"
                >
                  {editingId ? "Guardar" : "Registrar"}
                </LoadingButton>
                {editingId && (
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border bg-white py-2 text-xs font-bold tracking-wide text-muted transition-colors hover:bg-bg-secondary sm:text-sm"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar dirección"
        destructive
        confirmLabel={eliminar.isPending ? "Eliminando..." : "Eliminar"}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) eliminar.mutate(deleteId);
          setDeleteId(null);
        }}
      >
        <p className="text-xs font-medium text-muted sm:text-sm">¿Eliminar esta dirección? No se puede deshacer.</p>
      </ConfirmDialog>
    </div>
  );
}
