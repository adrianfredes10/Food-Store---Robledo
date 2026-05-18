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
import { LoadingButton } from "@/shared/ui/LoadingButton";

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
      <div className="flex items-center justify-center py-12 md:py-20">
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
    <div className="mx-auto max-w-6xl w-full py-4 sm:py-8 lg:py-12 fade-in">
      <header className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-black text-primary font-outfit uppercase tracking-tight">
          Checkout
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative pb-8">
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-primary mb-6 border-b border-border pb-4">
              ¿Cómo querés recibir tu pedido?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all ${
                  tipoServicio === "DELIVERY"
                    ? "border-accent bg-primary/5 shadow-sm"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tipoServicio"
                    className="h-5 w-5 border-border text-accent focus:ring-accent"
                    checked={tipoServicio === "DELIVERY"}
                    onChange={() => setTipoServicio("DELIVERY")}
                  />
                  <MapPin size={20} className="text-accent shrink-0" />
                  <span className="font-bold text-primary">Envío a domicilio</span>
                </div>
                <p className="text-xs text-muted pl-8">Incluye costo de envío fijo.</p>
              </label>
              <label
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all ${
                  tipoServicio === "RETIRO_EN_LOCAL"
                    ? "border-accent bg-primary/5 shadow-sm"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tipoServicio"
                    className="h-5 w-5 border-border text-accent focus:ring-accent"
                    checked={tipoServicio === "RETIRO_EN_LOCAL"}
                    onChange={() => setTipoServicio("RETIRO_EN_LOCAL")}
                  />
                  <Building2 size={20} className="text-accent shrink-0" />
                  <span className="font-bold text-primary">Comer en el local</span>
                </div>
                <p className="text-xs text-muted pl-8">Indicá el número de mesa. Sin costo de envío.</p>
              </label>
            </div>
          </section>

          {tipoServicio === "DELIVERY" && (
            <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                  <MapPin size={20} className="text-accent" />
                  Dirección de entrega
                </h2>
                <Link
                  className="text-sm font-bold text-accent hover:text-accent-hover hover:underline underline-offset-4 transition-colors"
                  to="/direcciones"
                >
                  Administrar
                </Link>
              </div>

              {dirLoading && <p className="text-sm font-medium text-muted animate-pulse">Cargando direcciones...</p>}
              {!dirLoading && direcciones.length === 0 && (
                <div className="py-6 px-4 rounded-xl bg-bg-secondary border border-dashed border-border text-center">
                  <p className="text-sm text-muted font-medium mb-4">
                    Para envío a domicilio necesitás al menos una dirección guardada.
                  </p>
                  <Link
                    className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover active:scale-95 transition-all"
                    to="/direcciones"
                  >
                    Agregar dirección
                  </Link>
                </div>
              )}
              {!dirLoading && direcciones.length > 0 && (
                <ul className="space-y-4">
                  {direcciones.map((d) => (
                    <li key={d.id}>
                      <label
                        className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition-all ${
                          direccionId === d.id
                            ? "bg-primary/5 border-accent shadow-sm"
                            : "bg-white border-border hover:border-accent/50"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          <input
                            type="radio"
                            name="dir"
                            className="h-5 w-5 border-border text-accent focus:ring-accent"
                            checked={direccionId === d.id}
                            onChange={() => setDireccionId(d.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-primary block mb-1">
                            {d.alias ?? "Dirección"}{" "}
                            {d.es_principal && (
                              <span className="ml-2 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Principal
                              </span>
                            )}
                          </span>
                          <span className="text-sm text-muted block leading-snug">
                            {d.calle} {d.numero} {d.piso_dpto && `, ${d.piso_dpto}`}
                            <br />
                            {d.ciudad} ({d.codigo_postal})
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
            <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <Building2 size={20} className="text-accent" />
                <h2 className="text-lg font-bold text-primary">Mesa en el salón</h2>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-primary mb-2 block">Número de mesa ({MESA_MIN}–{MESA_MAX})</span>
                <input
                  type="number"
                  min={MESA_MIN}
                  max={MESA_MAX}
                  inputMode="numeric"
                  value={numeroMesaRaw}
                  onChange={(e) => setNumeroMesaRaw(e.target.value)}
                  placeholder="Ej: 12"
                  className="w-full max-w-xs rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-bold text-primary focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              {!retiroMesaOk && numeroMesaRaw.trim() !== "" && (
                <p className="mt-2 text-sm font-medium text-warning">Ingresá un número de mesa válido.</p>
              )}
            </section>
          )}

          <section className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <div className="flex items-center mb-6 border-b border-border pb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <CreditCard size={20} className="text-accent" />
                Forma de pago
              </h2>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-accent bg-primary/5 p-4 sm:p-6 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#009ee3] text-white">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="font-bold text-primary text-base block mb-1">Mercado Pago</span>
                <span className="text-sm text-muted block">Pagás de forma segura después de confirmar.</span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-6 border-b border-border pb-4">Resumen del Pedido</h3>

            <ul className="mb-6 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <li key={`${item.productoId}-${item.personalizacion.join(",")}`} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-4">
                    <span className="font-bold text-primary block">{item.nombre}</span>
                    <span className="text-muted block text-xs mt-0.5">Cant: {item.cantidad}</span>
                  </div>
                  <span className="font-bold text-primary shrink-0">{formatMoney(item.precioUnitario * item.cantidad)}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-4 mb-6 border-t border-border pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Subtotal ítems</span>
                <span className="font-bold text-primary">{formatMoney(subtotalItems)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-medium">Costo de envío</span>
                <span className="font-bold text-primary">{formatMoney(costoEnvio)}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-between items-end mb-8">
              <span className="text-base font-bold text-primary">Total</span>
              <span className="text-3xl font-black text-accent tracking-tight">{formatMoney(totalConEnvio)}</span>
            </div>

            <form onSubmit={handleConfirmar}>
              <LoadingButton
                type="submit"
                isLoading={mutation.isPending}
                disabled={!formularioOk || mutation.isPending}
                className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-hover shadow-md"
              >
                Confirmar pedido
              </LoadingButton>
            </form>

            {!formularioOk && (
              <p className="mt-4 text-center text-sm font-bold text-warning animate-pulse">
                {tipoServicio === "DELIVERY"
                  ? "Seleccioná una dirección de entrega"
                  : "Indicá el número de mesa (1 a 999)"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
