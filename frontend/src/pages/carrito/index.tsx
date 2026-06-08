import { useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { PackageOpen } from "lucide-react";

import { CartItem } from "@/features/carrito/ui/CartItem";
import { useAuthHydrated } from "@/features/auth";
import { useCartStore } from "@/shared/store/cart-store";
import { useAuthStore } from "@/shared/store/auth-store";
import { EmptyState, CheckoutFlowShell } from "@/shared/ui";

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function CarritoPage() {
  const navigate = useNavigate();
  const authHydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const items = useCartStore((s) => s.items);

  if (!authHydrated) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: "/carrito" }} />;
  }

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0), [items]);
  const envio = 50;
  const total = subtotal > 0 ? subtotal + envio : 0;

  const hayItems = items.length > 0;
  const estaVacio = !hayItems;

  return (
    <CheckoutFlowShell
      phase="carrito"
      title="Carrito"
      description="Revisá productos y cantidades; envío o mesa los indicás en el siguiente paso."

      back={{ to: "/", label: "Seguir comprando" }}
      headerExtra={null}
    >
      {estaVacio ? (
        <EmptyState
          titulo="Tu carrito está vacío"
          descripcion="Descubrí el catálogo y agregá productos para continuar."
          accion={{ label: "Explorar catálogo", href: "/" }}
          icon={PackageOpen}
        />
      ) : (
        <>
          <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-2 pb-24 lg:grid-cols-12 lg:gap-3 lg:overflow-hidden lg:pb-0">
            <div className="min-h-0 space-y-2 lg:col-span-7 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable]">
              <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
                <h2 className="sr-only">Productos</h2>
                <div className="flex flex-col">
                  {items.map((item) => (
                    <CartItem key={`${item.productoId}-${item.personalizacion.join(",")}`} item={item} />
                  ))}
                </div>
              </section>
            </div>

            <div className="flex min-h-0 flex-col lg:col-span-5 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
              <div className="rounded-lg border border-border bg-bg-secondary p-2.5 shadow-sm lg:sticky lg:top-0">
                <h3 className="mb-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wide text-primary">Tu pedido</h3>

                <ul className="custom-scrollbar mb-3 max-h-[36vh] space-y-2 overflow-y-auto text-xs lg:max-h-[min(38vh,280px)]">
                  {items.map((item) => (
                    <li
                      key={`${item.productoId}-${item.personalizacion.join(",")}`}
                      className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-bold leading-tight text-primary">{item.nombre}</span>
                        <span className="text-[11px] text-muted">×{item.cantidad}</span>
                      </div>
                      <span className="shrink-0 font-bold tabular-nums text-primary">
                        {formatMoney(item.precioUnitario * item.cantidad)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 border-t border-border pt-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold tabular-nums text-primary">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">Envío</span>
                    <span className="font-bold tabular-nums text-primary">{formatMoney(envio)}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                  <span className="text-xs font-bold text-primary">Total</span>
                  <span className="font-outfit text-xl font-black tabular-nums tracking-tight text-primary sm:text-2xl">{formatMoney(total)}</span>
                </div>

                <div className="mt-3 hidden lg:block">
                  <button
                    type="button"
                    onClick={() => navigate("/checkout")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-hover sm:py-2.5"
                  >
                    Siguiente paso: confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 p-2.5 backdrop-blur-sm lg:hidden">
            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 active:scale-[0.99]"
            >
              Siguiente: confirmar · {formatMoney(total)}
            </button>
          </div>
        </>
      )}
    </CheckoutFlowShell>
  );
}
