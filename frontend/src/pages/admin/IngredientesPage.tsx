import { useEffect, useMemo, useState } from "react";

import {
  useActualizarIngrediente,
  useCrearIngrediente,
  useEliminarIngrediente,
  useIngredientesTodos,
  useMutarStockIngrediente,
} from "@/features/admin";
import { apiErrorDetail } from "@/shared/api/apiErrorDetail";
import type { IngredienteRead } from "@/shared/api/endpoints/ingredientes";
import { ConfirmDialog, FormField, LoadingButton, ModalLayer } from "@/shared/ui";
import { toast } from "sonner";

function formatCantidadStock(v: string | number | undefined): string {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n.toLocaleString("es-AR", { maximumFractionDigits: 4 }) : "0";
}

type ModalMode = "closed" | "create" | "edit";

export function AdminIngredientesPage() {
  // cargo los ingredientes del back
  const { data: ingredientes = [], isLoading } = useIngredientesTodos();
  const crear = useCrearIngrediente();
  const actualizar = useActualizarIngrediente();
  const eliminar = useEliminarIngrediente();
  const mutarStock = useMutarStockIngrediente();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [soloAlergenos, setSoloAlergenos] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    unidad: "",
    es_alergeno: false,
    stock_inicial: "",
  });

  const [deleteTarget, setDeleteTarget] = useState<IngredienteRead | null>(null);
  const [inventarioTarget, setInventarioTarget] = useState<IngredienteRead | null>(null);
  const [inventarioModo, setInventarioModo] = useState<"increment" | "absolute">("increment");
  const [inventarioValor, setInventarioValor] = useState("");

  const filtrados = useMemo(() => {
    return ingredientes.filter((i) => {
      if (soloAlergenos && !i.es_alergeno) return false;
      if (debouncedSearch && !i.nombre.toLowerCase().includes(debouncedSearch)) return false;
      return true;
    });
  }, [ingredientes, debouncedSearch, soloAlergenos]);

  const filasOrdenadas = useMemo(() => {
    return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [filtrados]);

  function abrirCrear() {
    setEditingId(null);
    setForm({ nombre: "", unidad: "", es_alergeno: false, stock_inicial: "" });
    setModalMode("create");
  }

  function abrirEditar(i: IngredienteRead) {
    // abro el modal con los datos cargados
    setEditingId(i.id);
    setForm({
      nombre: i.nombre,
      unidad: i.unidad ?? "",
      es_alergeno: i.es_alergeno,
      stock_inicial: "",
    });
    setModalMode("edit");
  }

  function abrirInventario(i: IngredienteRead) {
    setInventarioTarget(i);
    setInventarioModo("increment");
    setInventarioValor("");
  }

  function cerrarInventario() {
    setInventarioTarget(null);
    setInventarioValor("");
  }

  function cerrarModal() {
    setModalMode("closed");
    setEditingId(null);
  }

  function guardar() {
    const nombre = form.nombre.trim();
    if (!nombre) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (nombre.length > 160) {
      toast.error("El nombre no puede superar 160 caracteres.");
      return;
    }
    const unidad = form.unidad.trim() ? form.unidad.trim() : null;

    if (modalMode === "create") {
      let stock_cantidad: string | undefined;
      const rawStock = form.stock_inicial.trim().replace(",", ".");
      if (rawStock !== "") {
        const sn = Number.parseFloat(rawStock);
        if (!Number.isFinite(sn) || sn < 0) {
          toast.error("Stock inicial inválido (usá 0 o más).");
          return;
        }
        stock_cantidad = String(sn);
      }
      crear.mutate(
        { nombre, unidad, es_alergeno: form.es_alergeno, ...(stock_cantidad !== undefined ? { stock_cantidad } : {}) },
        {
          onSuccess: () => {
            toast.success("Ingrediente creado.");
            cerrarModal();
          },
          onError: (err) => {
            toast.error(apiErrorDetail(err, "No se pudo crear el ingrediente."));
          },
        },
      );
      return;
    }

    if (modalMode === "edit" && editingId !== null) {
      actualizar.mutate(
        {
          id: editingId,
          data: { nombre, unidad, es_alergeno: form.es_alergeno },
        },
        {
          onSuccess: () => {
            // esto recarga la lista despues de guardar
            toast.success("Ingrediente actualizado.");
            cerrarModal();
          },
          onError: (err) => {
            // si falla muestro el error en un toast
            toast.error(apiErrorDetail(err, "No se pudo actualizar el ingrediente."));
          },
        },
      );
    }
  }

  function guardarInventario() {
    if (!inventarioTarget) return;
    const raw = inventarioValor.trim().replace(",", ".");
    const v = Number.parseFloat(raw);
    if (!Number.isFinite(v)) {
      toast.error("Ingresá un número válido.");
      return;
    }
    if (inventarioModo === "absolute" && v < 0) {
      toast.error("El stock no puede ser negativo.");
      return;
    }
    mutarStock.mutate(
      {
        id: inventarioTarget.id,
        data: inventarioModo === "increment" ? { incremento: v } : { stock_cantidad: v },
      },
      {
        onSuccess: () => {
          toast.success("Inventario actualizado.");
          cerrarInventario();
        },
        onError: (err) => toast.error(apiErrorDetail(err, "No se pudo actualizar el inventario.")),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Sincronizando ingredientes...
        </p>
      </div>
    );
  }

  const estaVacio = filasOrdenadas.length === 0;

  return (
    <div className="min-w-0 max-w-full max-md:overflow-x-clip space-y-8 pb-16 sm:space-y-8 sm:pb-20 md:overflow-x-visible">
      <section className="box-border max-w-full overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm max-md:px-3 md:p-6">
        <p className="text-xs font-medium text-muted leading-relaxed">
          Registrá aquí lo que comprás (ej.&nbsp;20 huevos). Al <span className="font-bold text-primary">confirmarse un pedido pagado</span>,
          el sistema resta solo automáticamente según la <span className="font-bold text-primary">receta</span> de cada producto (cantidades en la
          ficha del producto). Si el cliente saca un ingrediente opcional en el armado del plato, ese ítem no se descuenta.
        </p>
      </section>

      <section className="box-border max-w-full overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex sm:flex-row sm:items-center sm:justify-between sm:p-6 md:p-8 flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary">
          Ingredientes
        </h2>
        <button
          type="button"
          onClick={abrirCrear}
          className="rounded-xl shrink-0 bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover shadow-sm transition-all"
        >
          Nuevo ingrediente
        </button>
      </section>

      <section className="box-border max-w-full overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <FormField label="Buscar por nombre">
                <input
                className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ej: leche, trigo..."
                />
            </FormField>
          </div>
          <div className="flex items-end gap-3 pb-3">
            <label className="flex cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors">
              <input
                type="checkbox"
                className="h-5 w-5 rounded-md border-border text-accent focus:ring-accent transition-colors"
                checked={soloAlergenos}
                onChange={(e) => setSoloAlergenos(e.target.checked)}
              />
              Solo alérgenos
            </label>
          </div>
        </div>
      </section>

      <div className="max-w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">
                  Nombre
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">
                  Unidad
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">
                  Inventario
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-muted">
                  Alérgeno
                </th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {estaVacio ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      {ingredientes.length === 0
                        ? "No hay ingredientes. Creá el primero con «Nuevo ingrediente»."
                        : "Ningún resultado con los filtros actuales."}
                    </p>
                  </td>
                </tr>
              ) : (
                filasOrdenadas.map((i) => (
                  <tr key={i.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-primary">
                        {i.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-muted">
                      {i.unidad ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-outfit text-sm font-black tabular-nums text-primary">
                        {formatCantidadStock(i.stock_cantidad)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {i.es_alergeno ? (
                        <span className="inline-block rounded-full border border-danger/20 bg-danger/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-danger">
                          Alérgeno
                        </span>
                      ) : (
                        <span className="inline-block rounded-full border border-muted/20 bg-muted/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          className="text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
                          onClick={() => abrirInventario(i)}
                        >
                          Inventario
                        </button>
                        <button
                          type="button"
                          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors"
                          onClick={() => abrirEditar(i)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-xs font-bold uppercase tracking-widest text-danger hover:text-danger/80 transition-colors"
                          onClick={() => setDeleteTarget(i)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode !== "closed" && (
        <ModalLayer>
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="box-border max-h-[min(90dvh,100dvh)] w-full max-w-[min(32rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-white p-4 shadow-xl sm:mx-auto sm:rounded-2xl sm:p-6 md:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] fade-in">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-4 mb-6">
              {modalMode === "create" ? "Nuevo ingrediente" : "Editar ingrediente"}
            </h3>
            <div className="space-y-4">
                <FormField label="Nombre">
                    <input
                        className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                        maxLength={160}
                        value={form.nombre}
                        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                        required
                    />
                </FormField>
                {modalMode === "create" && (
                  <FormField label="Stock inicial (opcional)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                      placeholder="Ej: 20 (huevos, kg según unidad)"
                      value={form.stock_inicial}
                      onChange={(e) => setForm((f) => ({ ...f, stock_inicial: e.target.value }))}
                    />
                  </FormField>
                )}
                <FormField label="Unidad (opcional)">
                    <input
                        className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                        maxLength={32}
                        placeholder="gr, ml, unidad..."
                        value={form.unidad}
                        onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
                    />
                </FormField>
                <div className="pt-2">
                    <label className="flex cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors max-w-fit">
                        <input
                        type="checkbox"
                        className="h-5 w-5 rounded-md border-border text-accent focus:ring-accent transition-colors"
                        checked={form.es_alergeno}
                        onChange={(e) => setForm((f) => ({ ...f, es_alergeno: e.target.checked }))}
                        />
                        Es alérgeno
                    </label>
                </div>
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarModal}
                className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted hover:bg-bg-secondary transition-colors sm:w-auto"
              >
                Cancelar
              </button>
              <LoadingButton
                type="button"
                onClick={guardar}
                isLoading={crear.isPending || actualizar.isPending}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover shadow-sm sm:w-auto"
              >
                Guardar
              </LoadingButton>
            </div>
          </div>
        </div>
        </ModalLayer>
      )}

      {inventarioTarget !== null && (
        <ModalLayer>
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventario-ingrediente-title"
          >
            <div className="box-border max-h-[min(90dvh,100dvh)] w-full max-w-[min(32rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-white p-4 shadow-xl sm:mx-auto sm:rounded-2xl sm:p-6 md:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] fade-in">
            <h3
              id="inventario-ingrediente-title"
              className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-4 mb-4"
            >
              Inventario — {inventarioTarget.nombre}
            </h3>
            <p className="mb-4 text-xs font-medium text-muted">
              Actual:{" "}
              <span className="font-black tabular-nums text-primary">
                {formatCantidadStock(inventarioTarget.stock_cantidad)}
              </span>
              {inventarioTarget.unidad ? ` ${inventarioTarget.unidad}` : ""}
            </p>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
                <input
                  type="radio"
                  name="inv-modo"
                  className="h-4 w-4 accent-accent"
                  checked={inventarioModo === "increment"}
                  onChange={() => setInventarioModo("increment")}
                />
                Sumar compra / ajuste (+ o −)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
                <input
                  type="radio"
                  name="inv-modo"
                  className="h-4 w-4 accent-accent"
                  checked={inventarioModo === "absolute"}
                  onChange={() => setInventarioModo("absolute")}
                />
                Establecer stock total
              </label>
            </div>
            <FormField label={inventarioModo === "increment" ? "Cantidad a sumar (ej. 20 o -2)" : "Nuevo stock total"}>
              <input
                type="text"
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                value={inventarioValor}
                onChange={(e) => setInventarioValor(e.target.value)}
                autoFocus
              />
            </FormField>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarInventario}
                className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted hover:bg-bg-secondary transition-colors sm:w-auto"
              >
                Cancelar
              </button>
              <LoadingButton
                type="button"
                onClick={guardarInventario}
                isLoading={mutarStock.isPending}
                className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-hover shadow-sm sm:w-auto"
              >
                Aplicar
              </LoadingButton>
            </div>
          </div>
        </div>
        </ModalLayer>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar ingrediente"
        destructive
        confirmLabel={eliminar.isPending ? "Eliminando..." : "Eliminar"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget === null) return;
          const id = deleteTarget.id;
          eliminar.mutate(id, {
            onSuccess: () => {
              toast.success("Ingrediente eliminado.");
              setDeleteTarget(null);
            },
            onError: (err) => {
              toast.error(apiErrorDetail(err, "No se pudo eliminar el ingrediente."));
              setDeleteTarget(null);
            },
          });
        }}
      >
        <p className="text-sm font-medium text-muted">
          ¿Eliminar el ingrediente &apos;<span className="font-bold">{deleteTarget?.nombre}</span>&apos;? Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
