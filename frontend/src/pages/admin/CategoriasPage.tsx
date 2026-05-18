import { useMemo, useState } from "react";

import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from "@/features/admin";
import { apiErrorDetail } from "@/shared/api/apiErrorDetail";
import type { CategoriaRead } from "@/shared/api/endpoints/categorias";
import { ConfirmDialog, FormField, LoadingButton, ModalLayer, AdminConstrainedSelect } from "@/shared/ui";
import { toast } from "sonner";

type ModalMode = "closed" | "create" | "edit";

export function AdminCategoriasPage() {
  const { data: categorias = [], isLoading } = useCategorias();
  const crear = useCrearCategoria();
  const actualizar = useActualizarCategoria();
  const eliminar = useEliminarCategoria();

  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  /** Si true, el alta es solo raíz (sin categoría padre). */
  const [crearSoloRaiz, setCrearSoloRaiz] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    parent_id: "" as string,
    descripcion: "",
    orden: "0",
  });

  const [deleteTarget, setDeleteTarget] = useState<CategoriaRead | null>(null);

  const porId = useMemo(() => {
    const m = new Map<number, CategoriaRead>();
    for (const c of categorias) m.set(c.id, c);
    return m;
  }, [categorias]);

  const categoriasRaiz = useMemo(() => {
    return categorias
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
  }, [categorias]);

  const subcategorias = useMemo(() => {
    return categorias
      .filter((c) => c.parent_id !== null)
      .sort((a, b) => {
        const an = porId.get(a.parent_id!)?.nombre ?? "";
        const bn = porId.get(b.parent_id!)?.nombre ?? "";
        const cmpPadre = an.localeCompare(bn, "es");
        if (cmpPadre !== 0) return cmpPadre;
        const cmpOrden = a.orden - b.orden;
        if (cmpOrden !== 0) return cmpOrden;
        return a.nombre.localeCompare(b.nombre, "es");
      });
  }, [categorias, porId]);

  const opcionesPadre = useMemo(() => {
    return categorias
      .filter((c) => c.activo && c.id !== editingId)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [categorias, editingId]);

  function abrirCrearRaiz() {
    setEditingId(null);
    setCrearSoloRaiz(true);
    setForm({ nombre: "", parent_id: "", descripcion: "", orden: "0" });
    setModalMode("create");
  }

  function abrirCrearSubcategoria() {
    if (categoriasRaiz.length === 0) {
      toast.info("Creá primero al menos una categoría raíz en el panel izquierdo.");
      return;
    }
    setEditingId(null);
    setCrearSoloRaiz(false);
    const primeraRaiz = categoriasRaiz[0];
    setForm({
      nombre: "",
      parent_id: primeraRaiz ? String(primeraRaiz.id) : "",
      descripcion: "",
      orden: "0",
    });
    setModalMode("create");
  }

  function abrirEditar(c: CategoriaRead) {
    setEditingId(c.id);
    setCrearSoloRaiz(false);
    setForm({
      nombre: c.nombre,
      parent_id: c.parent_id === null ? "" : String(c.parent_id),
      descripcion: c.descripcion ?? "",
      orden: String(c.orden),
    });
    setModalMode("edit");
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
    if (nombre.length > 120) {
      toast.error("El nombre no puede superar 120 caracteres.");
      return;
    }
    const ordenNum = Number(form.orden);
    const orden = Number.isFinite(ordenNum) && ordenNum >= 0 ? ordenNum : 0;

    const parent_id =
      modalMode === "create" && crearSoloRaiz ? null : form.parent_id === "" ? null : Number(form.parent_id);

    if (!(modalMode === "create" && crearSoloRaiz)) {
      if (form.parent_id !== "" && (!Number.isFinite(parent_id) || (parent_id as number) < 1)) {
        toast.error("Seleccioná una categoría padre válida.");
        return;
      }
      if (modalMode === "create" && !crearSoloRaiz && parent_id === null) {
        toast.error("Las subcategorías requieren una categoría padre.");
        return;
      }
    }

    const descripcion = form.descripcion.trim() ? form.descripcion.trim() : null;

    if (modalMode === "create") {
      crear.mutate(
        {
          nombre,
          parent_id,
          descripcion,
          orden,
          activo: true,
        },
        {
          onSuccess: () => {
            toast.success(crearSoloRaiz ? "Categoría raíz creada." : "Subcategoría creada.");
            cerrarModal();
          },
          onError: (err) => toast.error(apiErrorDetail(err, "No se pudo crear la categoría.")),
        },
      );
      return;
    }

    if (modalMode === "edit" && editingId !== null) {
      actualizar.mutate(
        {
          id: editingId,
          data: {
            nombre,
            parent_id,
            descripcion,
            orden,
          },
        },
        {
          onSuccess: () => {
            toast.success("Categoría actualizada.");
            cerrarModal();
          },
          onError: (err) => {
            toast.error(apiErrorDetail(err, "No se pudo actualizar la categoría."));
          },
        },
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Sincronizando categorías...
        </p>
      </div>
    );
  }

  const modalTitulo =
    modalMode === "edit"
      ? "Editar categoría"
      : crearSoloRaiz
        ? "Nueva categoría raíz"
        : "Nueva subcategoría";

  function filaAcciones(c: CategoriaRead) {
    return (
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors"
          onClick={() => abrirEditar(c)}
        >
          Editar
        </button>
        <button
          type="button"
          className="text-xs font-bold uppercase tracking-widest text-danger hover:text-danger/80 transition-colors"
          onClick={() => setDeleteTarget(c)}
        >
          Eliminar
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-8 pb-16 max-md:overflow-x-clip sm:space-y-8 sm:pb-20 md:overflow-x-visible">
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm max-md:px-3 md:p-6">
        <p className="text-xs font-medium text-muted leading-relaxed max-w-3xl">
          <span className="font-bold text-primary">Categorías raíz</span> son las principales del menú. Las{" "}
          <span className="font-bold text-primary">subcategorías</span> dependen de una raíz (u otra categoría)
          y se listan con su padre a la derecha.
        </p>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {/* Panel categorías raíz */}
        <div className="min-w-0 flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm max-md:px-3 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Categorías raíz</h2>
            <button
              type="button"
              onClick={abrirCrearRaiz}
              className="rounded-xl shrink-0 bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-sm transition-all"
            >
              Nueva categoría
            </button>
          </div>
          <div className="max-w-full overflow-hidden rounded-xl border border-border">
            <div className="max-h-[min(28rem,55vh)] overflow-y-auto overscroll-y-contain">
              <table className="w-full min-w-0 border-collapse text-left">
                <thead className="sticky top-0 bg-bg-secondary border-b border-border z-[1]">
                  <tr>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Nombre
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Orden
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoriasRaiz.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-xs font-bold uppercase tracking-widest text-muted">
                        No hay categorías raíz. Creá la primera.
                      </td>
                    </tr>
                  ) : (
                    categoriasRaiz.map((c) => (
                      <tr key={c.id} className="hover:bg-bg-secondary/50 transition-colors">
                        <td className="px-3 py-3 md:px-4">
                          <span className="text-sm font-bold text-primary">{c.nombre}</span>
                        </td>
                        <td className="px-3 py-3 font-outfit text-sm font-black text-primary md:px-4">{c.orden}</td>
                        <td className="px-3 py-3 md:px-4">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest md:px-3 md:text-[10px] ${
                              c.activo
                                ? "border-accent/20 bg-accent/10 text-accent"
                                : "border-muted/20 bg-muted/10 text-muted"
                            }`}
                          >
                            {c.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right md:px-4">{filaAcciones(c)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel subcategorías */}
        <div className="min-w-0 flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm max-md:px-3 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Subcategorías</h2>
            <button
              type="button"
              onClick={abrirCrearSubcategoria}
              disabled={categoriasRaiz.length === 0}
              className="rounded-xl shrink-0 bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Nueva subcategoría
            </button>
          </div>
          <div className="max-w-full overflow-hidden rounded-xl border border-border">
            <div className="max-h-[min(28rem,55vh)] overflow-y-auto overscroll-y-contain">
              <table className="w-full min-w-0 border-collapse text-left">
                <thead className="sticky top-0 bg-bg-secondary border-b border-border z-[1]">
                  <tr>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Nombre
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Categoría padre
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Orden
                    </th>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Estado
                    </th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted md:px-4 md:text-xs">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subcategorias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-xs font-bold uppercase tracking-widest text-muted">
                        {categoriasRaiz.length === 0
                          ? "Primero creá categorías raíz."
                          : "No hay subcategorías. Usá «Nueva subcategoría»."}
                      </td>
                    </tr>
                  ) : (
                    subcategorias.map((c) => {
                      const padreNombre =
                        c.parent_id === null ? "—" : (porId.get(c.parent_id)?.nombre ?? "—");
                      return (
                        <tr key={c.id} className="hover:bg-bg-secondary/50 transition-colors">
                          <td className="px-3 py-3 md:px-4">
                            <span className="text-sm font-bold text-primary">{c.nombre}</span>
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-accent md:px-4">{padreNombre}</td>
                          <td className="px-3 py-3 font-outfit text-sm font-black text-primary md:px-4">{c.orden}</td>
                          <td className="px-3 py-3 md:px-4">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest md:px-3 md:text-[10px] ${
                                c.activo
                                  ? "border-accent/20 bg-accent/10 text-accent"
                                  : "border-muted/20 bg-muted/10 text-muted"
                              }`}
                            >
                              {c.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right md:px-4">{filaAcciones(c)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalMode !== "closed" && (
        <ModalLayer>
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="fade-in max-h-[min(90dvh,100vh)] w-full min-w-0 max-w-lg max-md:max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-white p-4 shadow-xl max-md:mx-auto sm:rounded-2xl sm:p-6 md:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-4 mb-6">
              {modalTitulo}
            </h3>
            <div className="space-y-4">
              <FormField label="Nombre">
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  maxLength={120}
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </FormField>
              {!(modalMode === "create" && crearSoloRaiz) && (
                <FormField label="Categoría padre" className="min-w-0">
                  <AdminConstrainedSelect
                    value={form.parent_id}
                    onChange={(v) => setForm((f) => ({ ...f, parent_id: v }))}
                    options={[
                      { value: "", label: "Sin categoría padre (raíz)" },
                      ...opcionesPadre.map((c) => ({ value: String(c.id), label: c.nombre })),
                    ]}
                  />
                </FormField>
              )}
              {modalMode === "create" && crearSoloRaiz && (
                <p className="rounded-xl border border-border/80 bg-bg-secondary px-4 py-3 text-xs font-medium text-muted">
                  Esta categoría será <span className="font-bold text-primary">raíz</span> (sin padre). Aparecerá en el
                  panel izquierdo.
                </p>
              )}
              <FormField label="Descripción">
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-y"
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                />
              </FormField>
              <FormField label="Orden">
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  value={form.orden}
                  onChange={(e) => setForm((f) => ({ ...f, orden: e.target.value }))}
                />
              </FormField>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar categoría"
        destructive
        confirmLabel={eliminar.isPending ? "Eliminando..." : "Eliminar"}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget === null) return;
          const id = deleteTarget.id;
          eliminar.mutate(id, {
            onSuccess: () => {
              toast.success("Categoría eliminada.");
              setDeleteTarget(null);
            },
            onError: (err) => {
              toast.error(apiErrorDetail(err, "No se pudo eliminar la categoría."));
            },
          });
        }}
      >
        <p className="text-sm font-medium text-muted">
          ¿Eliminar la categoría &apos;<span className="font-bold">{deleteTarget?.nombre}</span>&apos;? Solo se puede si
          no tiene subcategorías ni productos en el catálogo; si hay productos, eliminalos o reasignalos desde Productos
          (no se reubican automáticamente).
        </p>
      </ConfirmDialog>
    </div>
  );
}
