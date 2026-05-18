import { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { ProductoList } from "@/features/productos/ui/ProductoList";
import { useProductos } from "@/features/productos/hooks/useProductos";
import { CatalogoSkeleton } from "@/shared/ui";
import { categoriasApi } from "@/shared/api/endpoints/categorias";

function catalogoErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const st = error.response?.status;
    const detail = error.response?.data;
    const msg =
      typeof detail === "object" && detail !== null && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : error.message;
    return st ? `HTTP ${st}: ${msg}` : msg;
  }
  return error instanceof Error ? error.message : "Error desconocido";
}

export function CatalogoPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");

  // TODO: agregar busqueda en tiempo real con debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: categoriasResp } = useQuery({
    queryKey: ["categorias", "todas"],
    queryFn: () => categoriasApi.listar({ size: 100 }),
  });

  const categorias = categoriasResp?.items ?? [];

  // cargo los datos del back
  const { data, isLoading, isError, error, refetch } = useProductos({
    page: 1,
    size: 50,
    search: debouncedSearch || undefined,
    categoria_id: categoriaId !== "" ? categoriaId : undefined,
  });

  const isFiltering = debouncedSearch !== "" || categoriaId !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCategoriaId("");
  };

  return (
    <div className="min-w-0 max-w-full max-md:overflow-x-clip space-y-6 pb-16 max-md:px-0 sm:pb-20 md:space-y-12 md:overflow-x-visible">
      {/* Hero Section */}
      <section className="relative max-w-full overflow-hidden rounded-2xl bg-slate-950 px-3 py-6 text-center shadow-2xl sm:px-4 sm:py-8 md:rounded-[2rem] md:px-12 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-100"></div>
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 text-left md:flex-row md:items-start md:gap-8">
            <div className="flex-1 text-center md:text-left">
              <span className="mb-3 inline-block rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.28em] text-slate-400 backdrop-blur-sm md:mb-5 md:px-3 md:py-1 md:text-[10px] md:tracking-[0.3em]">
                  Exclusividad · Calidad · Tradición
              </span>
              <h1 className="break-words font-outfit text-xl font-black uppercase leading-[1.12] tracking-tighter text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  CONCURSO GOURMET <br className="hidden md:block"/> <span className="text-slate-500">PARA PALADARES SELECTOS</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl px-0 text-[10px] font-medium leading-relaxed text-slate-400 line-clamp-2 md:mx-0 md:mt-5 md:line-clamp-none md:text-lg">
                  Una curaduría de los ingredientes más finos y preparaciones artesanales, entregados con la distinción que su mesa merece.
              </p>
            </div>
            {/* Imagen decorativa a la derecha (Desktop) */}
            <div className="hidden h-56 w-56 overflow-hidden rounded-full border-4 border-white/5 opacity-40 grayscale filter transition-all duration-700 hover:grayscale-0 hover:opacity-100 md:block lg:h-64 lg:w-64">
               <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=600&auto=format&fit=crop')" }}></div>
            </div>
        </div>
      </section>

      {/* Control de barra de filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-xl md:text-3xl font-black text-slate-950 font-outfit uppercase tracking-tighter">Nuestro Catálogo</h2>
                <p className="text-slate-400 font-black text-xs md:text-sm uppercase tracking-widest mt-1">
                    {data ? `${data.total} tesoros culinarios encontrados` : "Explorá nuestras delicias"}
                </p>
            </div>
            
            {/* Filtros */}
            <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center md:w-auto">
                <div className="relative min-w-0 flex-1 sm:max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar delicias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="box-border h-11 w-full max-w-full rounded-xl border border-border bg-bg-secondary pl-10 pr-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="box-border h-11 w-full min-w-0 shrink-0 rounded-xl border border-border bg-bg-secondary px-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto sm:min-w-[10rem] appearance-none"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {isFiltering && (
                  <button
                    onClick={clearFilters}
                    className="flex shrink-0 h-11 items-center gap-2 rounded-xl bg-danger/10 px-4 text-sm font-bold text-danger hover:bg-danger/20 transition-colors"
                  >
                    <X size={16} /> <span className="hidden sm:inline">Limpiar</span>
                  </button>
                )}
            </div>
        </div>
      </div>

      {isLoading ? (
        <CatalogoSkeleton />
      ) : isError ? (
        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 text-red-900 premium-shadow">
          <h2 className="text-xl font-bold flex flex-wrap items-center gap-2 mb-2">
              Lo sentimos, hubo un problema
          </h2>
          <p className="text-sm opacity-90 break-words">{catalogoErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 w-full min-h-11 rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-100 sm:w-auto active:scale-95"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <ProductoList productos={data?.items ?? []} />
      )}
    </div>
  );
}
