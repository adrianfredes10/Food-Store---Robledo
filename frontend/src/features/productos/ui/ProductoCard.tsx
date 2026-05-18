import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import type { ProductoListadoItemDTO } from "@/shared/api/endpoints/productos";
import { useCartStore } from "@/shared/store/cart-store";
import { useAuthStore } from "@/shared/store/auth-store";
import { useMe } from "@/features/auth";
import { PersonalizacionModal } from "./PersonalizacionModal";

type Props = {
  producto: ProductoListadoItemDTO;
};

function precioANumero(precio: string | number): number {
  return typeof precio === "number" ? precio : Number.parseFloat(String(precio));
}

export function ProductoCard({ producto }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.access_token);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMe();
  const isAdmin = Boolean(token && me?.roles?.includes("ADMIN"));
  const isGuest = !token;

  const [imgFailed, setImgFailed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const precio = precioANumero(producto.precio);
  const puedeComprar = producto.disponible && Number.isFinite(precio) && !isAdmin;
  const tieneIngredientesEnListado = (producto.ingredientes?.length ?? 0) > 0;
  const tieneAlergenos = producto.ingredientes?.some(i => i.es_alergeno) ?? false;

  const productoParaCarrito = {
    id: producto.id,
    nombre: producto.nombre,
    precio,
    imagen_url: producto.imagen_url,
  };

  // cuando el usuario toca "Agregar", si tiene ingredientes abro el modal de personalización
  // Invitado: ve precios y puede tocar Agregar; se pide iniciar sesión antes de usar el carrito.
  const handleAgregar = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGuest) {
      toast.info("Iniciá sesión para agregar productos al carrito.");
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!puedeComprar) return;
    if (tieneIngredientesEnListado) {
      setShowModal(true);
      return;
    }
    addItem(productoParaCarrito, 1, []);
    toast.success(`¡${producto.nombre} agregado al carrito!`);
  };

  const handleConfirmModal = (cantidad: number, exclusiones: { id: number; nombre: string }[]) => {
    addItem(productoParaCarrito, cantidad, exclusiones);
    setShowModal(false);
    toast.success(`¡${producto.nombre} agregado al carrito!`);
  };

  const imgSrc = producto.imagen_url ?? null;
  const esExterna = Boolean(imgSrc && /^https?:\/\//i.test(imgSrc));
  // si la imagen falló al cargar no la muestro
  const mostrarImagen = Boolean(imgSrc && !imgFailed);

  useEffect(() => {
    setImgFailed(false);
  }, [imgSrc, producto.id]);

  return (
    <>
      <article className="group relative flex w-full max-w-full min-w-0 flex-row overflow-hidden md:flex-col rounded-xl md:rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:shadow-lg md:hover:-translate-y-1 p-2.5 sm:p-3 md:p-0 gap-2 sm:gap-3 md:gap-0 cursor-pointer md:overflow-hidden">
        
        {/* Imagen */}
        <div className="relative isolate h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] md:h-auto md:w-full shrink-0 aspect-square overflow-hidden rounded-lg md:rounded-none bg-slate-100">
          {mostrarImagen ? (
            <img
              src={imgSrc!}
              alt={producto.nombre}
              className="absolute inset-0 h-full w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
              referrerPolicy={esExterna ? "no-referrer" : undefined}
              loading="lazy"
              decoding="sync"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl filter grayscale opacity-30">🍽️</span>
            </div>
          )}

          {/* Badges Desktop (Mobile los ponemos en el texto o más pequeños) */}
          <div className="absolute left-1.5 top-1.5 md:left-3 md:top-3 flex flex-col gap-1.5">
            {!producto.disponible && (
              <span className="rounded bg-danger px-1.5 py-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                No disponible
              </span>
            )}
            {tieneAlergenos && (
              <span className="rounded bg-warning px-1.5 py-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                Alérgenos
              </span>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 md:p-4">
          <div className="mb-2 min-w-0">
            <h3 className="break-words text-sm md:text-base font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 md:line-clamp-2 md:leading-tight">
              {producto.nombre}
            </h3>
            {producto.descripcion && (
              <p className="text-xs text-muted font-medium mt-1 line-clamp-2 hidden md:block leading-relaxed">
                {producto.descripcion}
              </p>
            )}
          </div>

          <div className="mt-auto flex min-w-0 flex-row items-center justify-between gap-1 max-md:pr-0.5 md:flex-col md:items-stretch md:gap-3">
            <p className="min-w-0 flex-1 truncate text-xs font-bold tabular-nums text-accent md:truncate-none md:flex-none md:text-xl md:text-primary md:tracking-tight leading-tight max-md:[overflow-wrap:anywhere] md:[overflow-wrap:normal]">
              {Number.isFinite(precio)
                ? precio.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
                : "—"}
            </p>

            {!isAdmin && (
              <button
                type="button"
                disabled={!puedeComprar}
                onClick={handleAgregar}
                className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 sm:h-10 sm:w-10 md:h-11 md:w-full md:rounded-xl md:shadow-sm"
                title="Agregar al carrito"
              >
                <Plus size={16} strokeWidth={2.5} className="md:hidden" />
                <span className="hidden md:inline font-bold text-sm">Agregar</span>
              </button>
            )}
            {isAdmin && (
              <div className="hidden md:flex h-11 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest border border-slate-200 shadow-sm">
                Modo Admin
              </div>
            )}
          </div>
        </div>
      </article>

      {showModal && (
        <PersonalizacionModal
          producto={productoParaCarrito}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmModal}
        />
      )}
    </>
  );
}
