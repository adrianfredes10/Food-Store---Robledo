import axios from "axios";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, CreditCard, CheckCircle2, MapPin } from "lucide-react";

import { useAuthHydrated } from "@/features/auth";
import { useCartHydrated } from "@/features/carrito/hooks/useCartHydrated";
import { useDirecciones } from "@/features/direcciones";
import { useCrearPedido } from "@/features/pedidos";
import { useAuthStore } from "@/shared/store/auth-store";
import { useCartStore } from "@/shared/store/cart-store";
import type { TipoServicioPedidoDTO } from "@/shared/api/endpoints/pedidos";
import { LoadingButton, CheckoutFlowShell } from "@/shared/ui";

const COSTO_ENVIO_ARS = 50;
const MESA_MIN = 1;
const MESA_MAX = 999;

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const cartHydrated = useCartHydrated();
  const authHydrated = useAuthHydrated();
  const access_token = useAuthStore((s) => s.access_token);
  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);
  const mutation = useCrearPedido();
  const { data: direcciones = [], isLoading: dirLoading } = useDirecciones();

  const [tipoServicio, setTipoServicio] = useState<TipoServicioPedidoDTO>("DELIVERY");
  const [direccionId, setDireccionId] = useState<number | "">("");
  const [numeroMesaRaw, setNumeroMesaRaw] = useState("");

  const principal = direcciones.find((d) => d.es_principal);
  useEffect(() => {
    if (principal && direccionId === "") {
      setDireccionId(principal.id);
    }
  }, [principal, direccionId]);

  const subtotalItems = useMemo(() => items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0), [items]);
  const costoEnvio = tipoServicio === "DELIVERY" ? COSTO_ENVIO_ARS : 0;
  const totalConEnvio = useMemo(() => subtotalItems + costoEnvio, [subtotalItems, costoEnvio]);

  const numeroMesa = useMemo(() => {
    const n = Number.parseInt(numeroMesaRaw.trim(), 10);
    return Number.isFinite(n) ? n : NaN;
  }, [numeroMesaRaw]);

  const deliveryDatosOk = direcciones.length > 0 && direccionId !== "";
  const retiroMesaOk =
    Number.isFinite(numeroMesa) && numeroMesa >= MESA_MIN && numeroMesa <= MESA_MAX;
  const formularioOk = tipoServicio === "DELIVERY" ? deliveryDatosOk : retiroMesaOk;

  const body = useMemo(() => {
    const base = {
      items: items.map((i) => ({
        producto_id: i.productoId,
        cantidad: i.cantidad,
        personalizacion: i.personalizacion ?? [],
      })),
      forma_pago_codigo: "MERCADOPAGO",
      tipo_servicio: tipoServicio,
    } as const;
    if (tipoServicio === "DELIVERY") {
      return {
        ...base,
        direccion_entrega_id: direccionId === "" ? undefined : (direccionId as number),
      };
    }
    return {
      ...base,
      direccion_entrega_id: null,
      numero_mesa: numeroMesa,
    };
  }, [items, tipoServicio, direccionId, numeroMesa]);

  const listoParaValidar = cartHydrated && authHydrated;

  if (!listoParaValidar) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  if (!access_token) {
    return <Navigate to="/login" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/carrito" replace />;
  }

  const handleConfirmar = (e?: FormEvent) => {
    e?.preventDefault();
    if (mutation.isPending || !formularioOk) return;
    mutation.mutate(body, {
      onSuccess: (data) => {
        clearCart();
        toast.success(`¡Pedido creado! Número #${data.id}`);
        navigate(`/pedido/${data.id}`, { replace: true });
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const detail = error.response?.data as { detail?: unknown } | undefined;
          const d = detail?.detail;
          const mensaje =
            typeof d === "string"
              ? d
              : "Error al crear el pedido. Verificá disponibilidad e inventario de ingredientes.";
          toast.error(mensaje);
          return;
        }
        toast.error("Error al crear el pedido. Verificá disponibilidad e inventario de ingredientes.");
      },
    });
  };

  return (
    <CheckoutFlowShell
      phase="checkout"
      title="Confirmar pedido"
      description="Elegí entrega o mesa; el pago es con Mercado Pago después de crear el pedido."

      back={{ to: "/carrito", label: "Volver al carrito" }}
    >
      <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-2 pb-24 lg:grid-cols-12 lg:gap-3 lg:overflow-hidden lg:pb-0">
        {/* Columna formulario */}
        <div className="min-h-0 space-y-2 lg:col-span-7 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable]">
          {/* Entrega */}
          <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">¿Cómo recibís?</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-all ${
                  tipoServicio === "DELIVERY"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="tipoServicio"
                  className="mt-0.5 h-4 w-4 shrink-0 border-border text-primary focus:ring-primary"
                  checked={tipoServicio === "DELIVERY"}
                  onChange={() => setTipoServicio("DELIVERY")}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm font-bold text-primary">Domicilio</span>
                  </div>
                  <p className="mt-0.5 pl-0 text-[11px] leading-snug text-muted">+ envío fijo</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-all ${
                  tipoServicio === "RETIRO_EN_LOCAL"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="tipoServicio"
                  className="mt-0.5 h-4 w-4 shrink-0 border-border text-primary focus:ring-primary"
                  checked={tipoServicio === "RETIRO_EN_LOCAL"}
                  onChange={() => setTipoServicio("RETIRO_EN_LOCAL")}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm font-bold text-primary">En el local</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">Nº de mesa · sin envío</p>
                </div>
              </label>
            </div>
          </section>

          {tipoServicio === "DELIVERY" && (
            <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Dirección
                </h2>
                <Link
                  className="shrink-0 text-[11px] font-bold text-primary underline-offset-2 hover:underline sm:text-xs"
                  to="/direcciones"
                >
                  Editar
                </Link>
              </div>

              {dirLoading && <p className="text-xs font-medium text-muted animate-pulse">Cargando…</p>}
              {!dirLoading && direcciones.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-bg-secondary px-3 py-3 text-center">
                  <p className="mb-2 text-xs text-muted">Necesitás una dirección guardada.</p>
                  <Link
                    className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-hover"
                    to="/direcciones"
                  >
                    Agregar
                  </Link>
                </div>
              )}
              {!dirLoading && direcciones.length > 0 && (
                <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 lg:max-h-[min(42vh,320px)]">
                  {direcciones.map((d) => (
                    <li key={d.id}>
                      <label
                        className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition-all ${
                          direccionId === d.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/35"
                        }`}
                      >
                        <input
                          type="radio"
                          name="dir"
                          className="mt-0.5 h-4 w-4 shrink-0 border-border text-primary focus:ring-primary"
                          checked={direccionId === d.id}
                          onChange={() => setDireccionId(d.id)}
                        />
                        <div className="min-w-0 flex-1 text-xs leading-snug">
                          <span className="font-bold text-primary">
                            {d.alias ?? "Dirección"}
                            {d.es_principal && (
                              <span className="ml-1.5 rounded bg-primary/10 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-primary">
                                Principal
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-muted">
                            {d.calle} {d.numero}
                            {d.piso_dpto ? `, ${d.piso_dpto}` : ""} · {d.ciudad} ({d.codigo_postal})
                          </span>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tipoServicio === "RETIRO_EN_LOCAL" && (
            <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                Mesa ({MESA_MIN}–{MESA_MAX})
              </h2>
              <input
                type="number"
                min={MESA_MIN}
                max={MESA_MAX}
                inputMode="numeric"
                value={numeroMesaRaw}
                onChange={(e) => setNumeroMesaRaw(e.target.value)}
                placeholder="Ej. 12"
                className="w-full max-w-[10rem] rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm font-bold text-primary focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {!retiroMesaOk && numeroMesaRaw.trim() !== "" && (
                <p className="mt-1.5 text-xs font-medium text-warning">Número no válido.</p>
              )}
            </section>
          )}

          {/* Pago: franja compacta */}
          <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
            <h2 className="sr-only">Forma de pago</h2>
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-secondary px-2.5 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs font-bold text-primary sm:text-sm">Mercado Pago</span>
                </div>
                <p className="text-[10px] text-muted sm:text-[11px]">Al confirmar te redirigimos a pagar.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Resumen */}
        <div className="flex min-h-0 flex-col lg:col-span-5 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
          <div className="rounded-lg border border-border bg-bg-secondary p-2.5 shadow-sm lg:sticky lg:top-0">
            <h3 className="mb-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wide text-primary">
              Tu pedido
            </h3>

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
                <span className="font-bold tabular-nums text-primary">{formatMoney(subtotalItems)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Envío</span>
                <span className="font-bold tabular-nums text-primary">{formatMoney(costoEnvio)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-xs font-bold text-primary">Total</span>
              <span className="font-outfit text-xl font-black tabular-nums tracking-tight text-primary sm:text-2xl">
                {formatMoney(totalConEnvio)}
              </span>
            </div>

            <form id="checkout-confirm-form" className="mt-3" onSubmit={handleConfirmar}>
              <LoadingButton
                type="submit"
                isLoading={mutation.isPending}
                disabled={!formularioOk || mutation.isPending}
                className="hidden w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-hover sm:py-3 lg:inline-flex"
              >
                Confirmar pedido
              </LoadingButton>
            </form>

            {!formularioOk && (
              <p className="mt-2 hidden text-center text-[11px] font-bold text-warning lg:block">
                {tipoServicio === "DELIVERY" ? "Elegí una dirección" : "Indicá la mesa"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 p-2.5 backdrop-blur-sm lg:hidden">
        <LoadingButton
          form="checkout-confirm-form"
          type="submit"
          isLoading={mutation.isPending}
          disabled={!formularioOk || mutation.isPending}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-hover"
        >
          Confirmar pedido · {formatMoney(totalConEnvio)}
        </LoadingButton>
        {!formularioOk && (
          <p className="mt-2 text-center text-[10px] font-bold text-warning">
            {tipoServicio === "DELIVERY" ? "Elegí una dirección" : "Indicá la mesa"}
          </p>
        )}
      </div>
    </CheckoutFlowShell>
  );
}
