import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  aplanarCategoriasParaSelect,
  buildCategoriaArbol,
  useActualizarProducto,
  useAdminProductoMutations,
  useCategorias,
  useIngredientesTodos,
  type CategoriaNodo,
} from "@/features/admin";
import { useProductos } from "@/features/productos/hooks/useProductos";
import { apiErrorDetail } from "@/shared/api/apiErrorDetail";
import type { IngredienteRead } from "@/shared/api/endpoints/ingredientes";
import type { ProductoListadoItemDTO } from "@/shared/api/endpoints/productos";
import { ConfirmDialog, FormField, LoadingButton, ModalLayer, AdminConstrainedSelect } from "@/shared/ui";
import { toast } from "sonner";

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function collectDescendantIds(nodo: CategoriaNodo): number[] {
  return [nodo.id, ...nodo.hijos.flatMap(collectDescendantIds)];
}

function getCategoryScopeIds(arbol: CategoriaNodo[], catId: number): Set<number> {
  function findNode(nodes: CategoriaNodo[]): CategoriaNodo | null {
    for (const n of nodes) {
      if (n.id === catId) return n;
      const found = findNode(n.hijos);
      if (found) return found;
    }
    return null;
  }
  const node = findNode(arbol);
  return node ? new Set(collectDescendantIds(node)) : new Set([catId]);
}

function categoriaTieneHijos(arbol: CategoriaNodo[], catId: number): boolean {
  function findNode(nodes: CategoriaNodo[]): CategoriaNodo | null {
    for (const n of nodes) {
      if (n.id === catId) return n;
      const found = findNode(n.hijos);
      if (found) return found;
    }
    return null;
  }
  return (findNode(arbol)?.hijos.length ?? 0) > 0;
}

function findAncestorIds(arbol: CategoriaNodo[], targetId: number): number[] {
  function walk(nodes: CategoriaNodo[], path: number[]): number[] | null {
    for (const n of nodes) {
      const next = [...path, n.id];
      if (n.id === targetId) return path;
      const found = walk(n.hijos, next);
      if (found) return found;
    }
    return null;
  }
  return walk(arbol, []) ?? [];
}

function CategoriaTreeRows({
  nodos,
  nivel,
  expanded,
  onToggleExpand,
  categoriaFiltroId,
  onSelect,
  contarEnScope,
}: {
  nodos: CategoriaNodo[];
  nivel: number;
  expanded: Set<number>;
  onToggleExpand: (id: number) => void;
  categoriaFiltroId: number | null;
  onSelect: (id: number) => void;
  contarEnScope: (id: number) => number;
}) {
  return (
    <>
      {nodos.map((n) => {
        const hasHijos = n.hijos.length > 0;
        const isExpanded = expanded.has(n.id);
        const activa = categoriaFiltroId === n.id;
        const count = contarEnScope(n.id);

        return (
          <div key={n.id}>
            <div
              className="flex min-w-0 items-center gap-0.5"
              style={{ paddingLeft: `${nivel * 0.75 + 0.25}rem` }}
            >
              {hasHijos ? (
                <button
                  type="button"
                  aria-label={isExpanded ? "Contraer subcategorías" : "Expandir subcategorías"}
                  className="shrink-0 rounded p-0.5 text-muted transition-colors hover:bg-bg-secondary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(n.id);
                  }}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className="w-4 shrink-0" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => onSelect(n.id)}
                className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[10px] font-bold transition-colors ${
                  activa ? "bg-primary text-white" : "text-primary hover:bg-bg-secondary"
                }`}
              >
                <span className="truncate">{n.nombre}</span>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black tabular-nums ${
                    activa ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  {count}
                </span>
              </button>
            </div>
            {hasHijos && isExpanded ? (
              <CategoriaTreeRows
                nodos={n.hijos}
                nivel={nivel + 1}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                categoriaFiltroId={categoriaFiltroId}
                onSelect={onSelect}
                contarEnScope={contarEnScope}
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

function CategoriasNavDesplegable({
  arbol,
  categoriaFiltroId,
  onSelect,
  contarEnScope,
  totalItems,
  categoriaById,
}: {
  arbol: CategoriaNodo[];
  categoriaFiltroId: number | null;
  onSelect: (id: number | null) => void;
  contarEnScope: (id: number) => number;
  totalItems: number;
  categoriaById: Map<number, string>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const label =
    categoriaFiltroId === null
      ? `Todas las categorías (${totalItems})`
      : `${categoriaById.get(categoriaFiltroId) ?? "Categoría"} (${contarEnScope(categoriaFiltroId)})`;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || categoriaFiltroId === null) return;
    const ancestors = findAncestorIds(arbol, categoriaFiltroId);
    if (ancestors.length === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) next.add(id);
      return next;
    });
  }, [open, categoriaFiltroId, arbol]);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function select(id: number | null) {
    onSelect(id);
    setOpen(false);
  }

  if (arbol.length === 0) return null;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:max-w-[16rem]">
      <button
        type="button"
        aria-haspopup="tree"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-left text-[10px] font-bold text-primary transition-all hover:border-primary/30 focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="max-h-52 overflow-y-auto overscroll-contain p-1">
            <button
              type="button"
              onClick={() => select(null)}
              className={`mb-0.5 flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold transition-colors ${
                categoriaFiltroId === null ? "bg-primary text-white" : "text-primary hover:bg-bg-secondary"
              }`}
            >
              <span>Todas las categorías</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[8px] font-black tabular-nums ${
                  categoriaFiltroId === null ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {totalItems}
              </span>
            </button>
            <CategoriaTreeRows
              nodos={arbol}
              nivel={0}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              categoriaFiltroId={categoriaFiltroId}
              onSelect={select}
              contarEnScope={contarEnScope}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IngredientesPicker({
  items,
  selectedIds,
  onToggle,
}: {
  items: IngredienteRead[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [q, setQ] = useState("");

  if (items.length === 0) {
    return (
      <p className="text-sm font-medium text-muted italic">
        No hay ingredientes cargados. Creálos en <span className="font-semibold text-primary">Ingredientes</span> del
        panel admin.
      </p>
    );
  }

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const seleccionados = selectedIds
    .map((id) => byId.get(id))
    .filter((i): i is IngredienteRead => i !== undefined);

  const ordenados = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const sinSeleccionar = ordenados.filter((i) => !selectedIds.includes(i.id));
  const filtrados = q.trim()
    ? sinSeleccionar.filter((i) => i.nombre.toLowerCase().includes(q.trim().toLowerCase()))
    : sinSeleccionar;

  return (
    <div className="space-y-2">
      {seleccionados.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {seleccionados.map((ing) => (
            <li
              key={ing.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-2 py-1"
            >
              <span className="truncate text-xs font-bold text-success">{ing.nombre}</span>
              {ing.es_alergeno ? (
                <span className="shrink-0 rounded-full border border-danger/20 bg-danger/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-danger">
                  Alerg.
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Quitar ${ing.nombre}`}
                className="shrink-0 rounded-md px-1 text-sm font-bold leading-none text-success/70 hover:bg-success/15 hover:text-success"
                onClick={() => onToggle(ing.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => setPanelOpen((open) => !open)}
        className="w-full rounded-xl bg-success px-3 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
      >
        + Agregar ingrediente
      </button>

      {panelOpen ? (
        <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
          {sinSeleccionar.length > 3 ? (
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrar…"
              className="mb-2 w-full rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5 text-xs font-bold text-primary placeholder:font-normal placeholder:text-muted focus:border-success focus:bg-white outline-none transition-all"
            />
          ) : null}
          {filtrados.length === 0 ? (
            <p className="py-2 text-center text-xs font-bold text-muted">
              {sinSeleccionar.length === 0
                ? "Ya agregaste todos los ingredientes."
                : `Sin resultados para "${q}"`}
            </p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto overscroll-contain sm:max-h-48">
              {filtrados.map((ing) => (
                <li key={ing.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bg-secondary"
                    onClick={() => {
                      onToggle(ing.id);
                      setQ("");
                    }}
                  >
                    <span className="flex-1 text-sm font-bold text-primary leading-tight">{ing.nombre}</span>
                    {ing.es_alergeno ? (
                      <span className="shrink-0 rounded-full border border-danger/20 bg-danger/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-danger">
                        Alérgeno
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

type EditForm = {
  nombre: string;
  precio: string;
  descripcion: string;
  categoria_id: string;
  disponible: boolean;
  ingredientes_ids: number[];
};

const EDIT_FORM_INICIAL: EditForm = {
  nombre: "",
  precio: "",
  descripcion: "",
  categoria_id: "",
  disponible: true,
  ingredientes_ids: [],
};

export function AdminProductosPage() {
  const { data, isLoading } = useProductos({ page: 1, size: 100 });
  const { data: categorias = [], isLoading: categoriasLoading } = useCategorias();
  const { data: todosIngredientes = [] } = useIngredientesTodos();
  const { crear, patch, eliminar } = useAdminProductoMutations();
  const actualizarProducto = useActualizarProducto();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoriaFiltroId, setCategoriaFiltroId] = useState<number | null>(null);

  // ── Estado del modal de edición ──────────────────────────────────────────
  const [editProduct, setEditProduct] = useState<ProductoListadoItemDTO | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EDIT_FORM_INICIAL);

  // ── Estado del formulario de creación ────────────────────────────────────
  const [form, setForm] = useState({
    categoria_id: "",
    nombre: "",
    precio: "",
    descripcion: "",
    ingredientes_ids: [] as number[],
  });

  // ── Opciones de categoría para selects ──────────────────────────────────
  const opcionesCategoria = useMemo(() => {
    const arbol = buildCategoriaArbol(categorias);
    return aplanarCategoriasParaSelect(arbol);
  }, [categorias]);

  const arbolCategorias = useMemo(() => buildCategoriaArbol(categorias), [categorias]);

  const categoriaById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categorias) m.set(c.id, c.nombre);
    return m;
  }, [categorias]);

  useEffect(() => {
    setForm((f) => {
      if (f.categoria_id !== "" || opcionesCategoria.length === 0) return f;
      return { ...f, categoria_id: String(opcionesCategoria[0].id) };
    });
  }, [opcionesCategoria]);

  const allItems = data?.items ?? [];

  const conteoPorCategoria = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of allItems) {
      m.set(p.categoria_id, (m.get(p.categoria_id) ?? 0) + 1);
    }
    return m;
  }, [allItems]);

  function contarEnScope(catId: number): number {
    const ids = getCategoryScopeIds(arbolCategorias, catId);
    let total = 0;
    for (const id of ids) {
      total += conteoPorCategoria.get(id) ?? 0;
    }
    return total;
  }

  const items = useMemo(() => {
    if (categoriaFiltroId === null) return allItems;
    const ids = getCategoryScopeIds(arbolCategorias, categoriaFiltroId);
    return allItems.filter((p) => ids.has(p.categoria_id));
  }, [allItems, arbolCategorias, categoriaFiltroId]);

  const categoriaFiltroLabel = useMemo(() => {
    if (categoriaFiltroId === null) return null;
    return categoriaById.get(categoriaFiltroId) ?? null;
  }, [categoriaFiltroId, categoriaById]);

  const pendingDelete = useMemo(
    () => items.find((p) => p.id === deleteId)?.nombre ?? "",
    [deleteId, items],
  );

  function abrirEditar(p: ProductoListadoItemDTO) {
    setEditProduct(p);
    setEditForm({
      nombre: p.nombre,
      precio: String(Number(p.precio)),
      descripcion: p.descripcion ?? "",
      categoria_id: String(p.categoria_id),
      disponible: p.disponible,
      ingredientes_ids: (p.ingredientes ?? []).map((i) => i.ingrediente_id),
    });
  }

  function cerrarEditar() {
    setEditProduct(null);
    setEditForm(EDIT_FORM_INICIAL);
  }

  function abrirCrear() {
    setForm((f) => ({
      ...f,
      nombre: "",
      precio: "",
      descripcion: "",
      ingredientes_ids: [],
      categoria_id:
        categoriaFiltroId !== null
          ? String(categoriaFiltroId)
          : f.categoria_id !== ""
            ? f.categoria_id
            : opcionesCategoria.length > 0
              ? String(opcionesCategoria[0].id)
              : "",
    }));
    setCreateOpen(true);
  }

  function cerrarCrear() {
    setCreateOpen(false);
  }

  function toggleIngredienteCreate(id: number) {
    setForm((f) => ({
      ...f,
      ingredientes_ids: f.ingredientes_ids.includes(id)
        ? f.ingredientes_ids.filter((x) => x !== id)
        : [...f.ingredientes_ids, id],
    }));
  }

  function toggleIngrediente(id: number) {
    setEditForm((f) => ({
      ...f,
      ingredientes_ids: f.ingredientes_ids.includes(id)
        ? f.ingredientes_ids.filter((x) => x !== id)
        : [...f.ingredientes_ids, id],
    }));
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    const categoria_id = Number(form.categoria_id);
    const precio = Number(form.precio);
    if (!form.nombre.trim()) {
      toast.error("Indicá el nombre del producto.");
      return;
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      toast.error("El precio tiene que ser un número mayor a 0.");
      return;
    }
    const idsValidos = new Set(opcionesCategoria.map((o) => o.id));
    if (!Number.isFinite(categoria_id) || !idsValidos.has(categoria_id)) {
      toast.error("Seleccioná una categoría válida del listado.");
      return;
    }
    const ingredientesPayload = form.ingredientes_ids.map((ingId) => ({
      ingrediente_id: ingId,
      cantidad: 1,
      es_removible: true,
    }));
    crear.mutate(
      {
        categoria_id: Number.isFinite(categoria_id) && categoria_id >= 1 ? categoria_id : 1,
        nombre: form.nombre.trim(),
        precio,
        descripcion: form.descripcion.trim() || null,
        ingredientes: ingredientesPayload as unknown[],
      },
      {
        onSuccess: () => {
          toast.success("Producto creado.");
          cerrarCrear();
        },
        onError: (err) => {
          toast.error(apiErrorDetail(err, "No se pudo crear el producto."));
        },
      },
    );
  }

  function guardarEdicion() {
    if (!editProduct) return;

    const nombre = editForm.nombre.trim();
    if (!nombre) { toast.error("El nombre es obligatorio."); return; }

    const precio = Number(editForm.precio);
    if (!Number.isFinite(precio) || precio <= 0) {
      toast.error("El precio debe ser mayor a 0.");
      return;
    }

    const categoria_id = Number(editForm.categoria_id);
    if (!Number.isFinite(categoria_id) || categoria_id < 1) {
      toast.error("Seleccioná una categoría válida.");
      return;
    }

    const cantidadesPrevias = new Map(
      (editProduct.ingredientes ?? []).map((i) => [i.ingrediente_id, Number(i.cantidad)]),
    );

    const ingredientes = editForm.ingredientes_ids.map((ingId) => ({
      ingrediente_id: ingId,
      cantidad: cantidadesPrevias.get(ingId) ?? 1,
      es_removible: true,
    }));

    actualizarProducto.mutate(
      {
        id: editProduct.id,
        data: {
          nombre,
          precio,
          descripcion: editForm.descripcion.trim() || null,
          categoria_id,
          disponible: editForm.disponible,
          ingredientes: ingredientes as unknown[],
        },
      },
      {
        onSuccess: () => {
          toast.success("Producto actualizado.");
          cerrarEditar();
        },
        onError: (err) => {
          toast.error(apiErrorDetail(err, "No se pudo actualizar el producto."));
        },
      },
    );
  }

  if (isLoading || categoriasLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Sincronizando Catálogo...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 md:gap-3">

      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary md:hidden">Productos</h2>
        <CategoriasNavDesplegable
          arbol={arbolCategorias}
          categoriaFiltroId={categoriaFiltroId}
          onSelect={setCategoriaFiltroId}
          contarEnScope={contarEnScope}
          totalItems={allItems.length}
          categoriaById={categoriaById}
        />
        <button type="button" onClick={abrirCrear} className="admin-btn-primary ml-auto shrink-0">
          + Nuevo Producto
        </button>
      </div>

      {categoriaFiltroLabel ? (
        <p className="shrink-0 text-[10px] font-bold text-muted">
          Mostrando <span className="text-primary">{items.length}</span> producto{items.length === 1 ? "" : "s"} en{" "}
          <span className="text-primary">{categoriaFiltroLabel}</span>
          {categoriaFiltroId !== null && categoriaTieneHijos(arbolCategorias, categoriaFiltroId)
            ? " (incluye subcategorías)"
            : ""}
        </p>
      ) : null}

      <section className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain rounded-xl border border-border bg-white shadow-sm md:overflow-hidden md:p-0">
        <div className="md:h-full md:overflow-y-auto md:overscroll-y-contain">
          <table className="admin-table w-full min-w-0 border-collapse text-left">
            <thead className="border-b border-border">
              <tr>
                <th className="hidden lg:table-cell">ID</th>
                <th>Producto</th>
                <th className="hidden lg:table-cell">Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
                    {allItems.length === 0
                      ? 'No hay productos. Usá el botón "+ Nuevo Producto" para crear el primero.'
                      : categoriaFiltroId !== null
                        ? `No hay productos en "${categoriaFiltroLabel ?? "esta categoría"}".`
                        : "No hay productos para mostrar."}
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="hidden font-outfit text-xs font-black text-primary lg:table-cell">#{p.id}</td>
                    <td>
                      <span className="block text-xs font-bold text-primary">{p.nombre}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-bold text-muted lg:hidden">
                        {categoriaById.get(p.categoria_id) ?? "—"} · #{p.id}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="text-xs font-medium text-muted">{categoriaById.get(p.categoria_id) ?? "—"}</span>
                    </td>
                    <td className="whitespace-nowrap text-xs font-bold text-primary">
                      {formatMoney(typeof p.precio === "number" ? p.precio : Number(p.precio))}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all ${
                          p.disponible
                            ? "border-success/25 bg-success/10 text-success"
                            : "border-muted/20 bg-muted/10 text-muted"
                        }`}
                        onClick={() => patch.mutate({ id: p.id, body: { disponible: !p.disponible } })}
                      >
                        <span className="md:hidden">{p.disponible ? "Disp." : "Pausa"}</span>
                        <span className="hidden md:inline">{p.disponible ? "Disponible" : "Pausado"}</span>
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-primary"
                          onClick={() => abrirEditar(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase tracking-widest text-danger transition-colors hover:text-danger/80"
                          onClick={() => setDeleteId(p.id)}
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
      </section>

      {/* ── Modal de creación ─────────────────────────────────────────────── */}
      {createOpen && (
        <ModalLayer>
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="fade-in w-full min-w-0 max-w-lg max-md:max-w-[calc(100vw-1rem)] rounded-t-2xl border border-border bg-white p-4 shadow-xl max-md:mx-auto sm:rounded-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-3 mb-4">
                Nuevo Producto
              </h3>
              <form className="space-y-3" onSubmit={handleCrear}>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Categoría" className="min-w-0 col-span-2 sm:col-span-1">
                    <AdminConstrainedSelect
                      value={form.categoria_id}
                      onChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
                      options={opcionesCategoria.map((o) => ({ value: String(o.id), label: o.label }))}
                      placeholder="Sin categorías"
                    />
                  </FormField>
                  <FormField label="Precio ($)" className="col-span-2 sm:col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold text-primary focus:border-accent focus:bg-white outline-none transition-all"
                      value={form.precio}
                      onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                    />
                  </FormField>
                </div>

                <FormField label="Nombre">
                  <input
                    className="mt-1 w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold text-primary focus:border-accent focus:bg-white outline-none transition-all"
                    placeholder="Ej: Hamburguesa Simple"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                </FormField>

                <FormField label="Descripción (opcional)">
                  <textarea
                    className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm font-bold text-primary focus:border-accent focus:bg-white outline-none transition-all resize-none"
                    maxLength={10000}
                    rows={2}
                    placeholder="Ej: medallón de carne, cheddar, panceta crocante…"
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  />
                </FormField>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Ingredientes (opcional)</p>
                  <IngredientesPicker
                    items={todosIngredientes}
                    selectedIds={form.ingredientes_ids}
                    onToggle={toggleIngredienteCreate}
                  />
                </div>

                <div className="pt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cerrarCrear}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-muted hover:bg-bg-secondary transition-colors sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <LoadingButton
                    type="submit"
                    isLoading={crear.isPending}
                    className="w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover shadow-sm sm:w-auto"
                  >
                    Crear Producto
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        </ModalLayer>
      )}

      {/* ── Modal de edición ──────────────────────────────────────────────── */}
      {editProduct !== null && (
        <ModalLayer>
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="fade-in w-full min-w-0 max-w-lg max-md:max-w-[calc(100vw-1rem)] max-h-[min(92dvh,100vh)] overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-white p-4 shadow-xl max-md:mx-auto sm:rounded-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-3 mb-4">
              Editar producto <span className="font-outfit font-black">#{editProduct.id}</span>
            </h3>

            <div className="space-y-3">
              <FormField label="Nombre">
                <input
                  className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  maxLength={200}
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </FormField>

              <FormField label="Precio ($)">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="mt-1 w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                  value={editForm.precio}
                  onChange={(e) => setEditForm((f) => ({ ...f, precio: e.target.value }))}
                />
              </FormField>

              <FormField label="Descripción (opcional)">
                <textarea
                  className="mt-1 min-h-[80px] w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-y"
                  maxLength={10000}
                  rows={3}
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
                />
              </FormField>

              <FormField label="Categoría" className="min-w-0">
                <AdminConstrainedSelect
                  value={editForm.categoria_id}
                  onChange={(v) => setEditForm((f) => ({ ...f, categoria_id: v }))}
                  options={opcionesCategoria.map((o) => ({ value: String(o.id), label: o.label }))}
                  placeholder="Sin categorías"
                />
              </FormField>

              <div className="pt-1">
                <label className="flex cursor-pointer items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted hover:text-primary transition-colors max-w-fit">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-md border-border text-accent focus:ring-accent transition-colors"
                    checked={editForm.disponible}
                    onChange={(e) => setEditForm((f) => ({ ...f, disponible: e.target.checked }))}
                  />
                  Disponible para la venta
                </label>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Ingredientes</p>
                <IngredientesPicker
                  items={todosIngredientes}
                  selectedIds={editForm.ingredientes_ids}
                  onToggle={toggleIngrediente}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarEditar}
                className="w-full rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted hover:bg-bg-secondary transition-colors sm:w-auto"
              >
                Cancelar
              </button>
              <LoadingButton
                type="button"
                onClick={guardarEdicion}
                isLoading={actualizarProducto.isPending}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover shadow-sm sm:w-auto"
              >
                Guardar cambios
              </LoadingButton>
            </div>
          </div>
        </div>
        </ModalLayer>
      )}

      {/* ── Confirm delete ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar Producto"
        destructive
        confirmLabel={eliminar.isPending ? "Eliminando..." : "Eliminar"}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) eliminar.mutate(deleteId);
          setDeleteId(null);
        }}
      >
        <p className="text-sm font-medium text-muted">
          ¿Confirmás que querés eliminar el producto <strong>{pendingDelete}</strong> del catálogo? Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
