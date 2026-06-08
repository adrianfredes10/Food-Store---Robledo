import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, Crosshair, MapPin, Package, AlertTriangle } from "lucide-react";

import {
  useCancelarPedido,
  usePedidoDetalle,
  usePedidoHistorial,
} from "@/features/pedidos";
import { useIniciarCheckout } from "@/features/pagos";
import { apiErrorDetail } from "@/shared/api/apiErrorDetail";
import { ConfirmDialog, SkeletonPedidoDetalle, EstadoBadge, FormField, LoadingButton, CheckoutFlowShell } from "@/shared/ui";

function formatMoney(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatHistorialFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelFormaPago(codigo: string | null): string {
  if (!codigo) return "—";
  if (codigo === "MERCADOPAGO") return "Mercado Pago";
  return codigo;
}

export function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivoCancel, setMotivoCancel] = useState("");

  const pedidoId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [id]);

  // cargo los datos del back
  const {
    data: pedido,
    isLoading,
    isError,
    error,
    refetch,
  } = usePedidoDetalle(pedidoId);
  const { data: historialRaw = [] } = usePedidoHistorial(pedidoId);
  const cancelMutation = useCancelarPedido();
  const iniciarCheckout = useIniciarCheckout();

  const [searchParams] = useSearchParams();
  const statusMP = searchParams.get("status");

  useEffect(() => {
    if (statusMP && pedidoId) {
      if (statusMP === "approved") {
        toast.success("¡Pago aprobado! Tu pedido está confirmado.");
      } else if (statusMP === "rejected") {
        toast.error("El pago fue rechazado. Podés intentar de nuevo.");
      } else if (statusMP === "pending") {
        toast.info("Tu pago está pendiente de acreditación.");
      }
      // Limpiar query param de la URL
      navigate(`/pedido/${pedidoId}`, { replace: true });
    }
  }, [statusMP, pedidoId, navigate]);

  // ordeno el historial de más reciente a más viejo
  const historialOrdenado = useMemo(() => {
    return [...historialRaw].sort(
      (a, b) => new Date(b.registrado_en).getTime() - new Date(a.registrado_en).getTime(),
    );
  }, [historialRaw]);

  const subtotalItems = useMemo(() => {
    if (!pedido?.detalles?.length) return 0;
    return pedido.detalles.reduce((acc, d) => acc + Number(d.subtotal), 0);
  }, [pedido]);

  const es404 = axios.isAxiosError(error) && error.response?.status === 404;
  /** API siempre envía mayúsculas; normalizamos por si el valor viene distinto. */
  const pendiente = pedido != null && String(pedido.estado).toUpperCase() === "PENDIENTE";

  if (pedidoId === null) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center fade-in md:py-24 px-4">
        <div className="mb-6 flex justify-center text-muted">
            <AlertTriangle strokeWidth={1} size={64} className="opacity-50" />
        </div>
        <h1 className="mb-4 font-outfit text-2xl font-black text-primary md:text-4xl">
          Pedido no encontrado
        </h1>
        <p className="mb-10 text-sm font-medium text-muted">
          El enlace no es válido o el pedido no existe.
        </p>
        <Link
          to="/mis-pedidos"
          className="inline-flex rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
        >
          Ir a mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <>
      {pedidoId === null && (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center fade-in md:py-24">
          <div className="mb-6 flex justify-center text-muted">
            <AlertTriangle strokeWidth={1} size={64} className="opacity-50" />
          </div>
          <h1 className="mb-4 font-outfit text-2xl font-black text-primary md:text-4xl">Pedido no encontrado</h1>
          <p className="mb-10 text-sm font-medium text-muted">El enlace no es válido o el pedido no existe.</p>
          <Link
            to="/mis-pedidos"
            className="inline-flex rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95"
          >
            Ir a mis pedidos
          </Link>
        </div>
      )}

      {pedidoId !== null && isLoading && <SkeletonPedidoDetalle />}

      {pedidoId !== null && isError && !isLoading && (
        <div className="relative mx-auto mt-8 max-w-md rounded-xl border border-border bg-white p-5 text-center shadow-sm sm:p-6">
          {es404 ? (
            <>
              <h1 className="mb-4 text-xl font-bold text-primary">Pedido no encontrado</h1>
              <p className="mb-8 text-sm text-muted">No pudimos encontrar este pedido o no pertenece a tu cuenta.</p>
              <Link
                to="/mis-pedidos"
                className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-hover"
              >
                Mis pedidos
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-bold text-primary">Error al cargar el pedido</h2>
              <p className="mb-8 text-sm text-muted">
                {axios.isAxiosError(error) && error.response?.status === 401
                  ? "Iniciá sesión para ver tu pedido."
                  : apiErrorDetail(error, "No se pudo cargar el pedido.")}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-hover"
              >
                Reintentar
              </button>
            </>
          )}
        </div>
      )}

      {pedido && !isLoading && (
        <CheckoutFlowShell
          phase={pendiente ? "pago_pendiente" : "pago_ok"}
          title={`Pedido #${pedido.id}`}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-primary/90">{formatHistorialFecha(pedido.created_at)}</span>
              <EstadoBadge estado={pedido.estado} />
            </span>
          }

          back={{ to: "/mis-pedidos", label: "Volver a mis pedidos" }}
        >
          <div
            className={`relative grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-3 lg:overflow-hidden ${
              pendiente ? "pb-24 lg:pb-0" : ""
            }`}
          >
            <div className="min-h-0 space-y-2 lg:col-span-7 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable]">
              <section className="relative overflow-hidden rounded-lg border border-border bg-white p-2.5 shadow-sm">
                <div className="pointer-events-none absolute right-0 top-0 p-3 opacity-5 text-primary">
                  <Crosshair size={72} />
                </div>
                <div className="relative z-10">
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> Estado del pedido
                  </h2>
                  <div className="max-h-[min(42vh,320px)] space-y-3 overflow-y-auto overscroll-contain pr-0.5">
                    {historialOrdenado.map((h, i) => (
                      <div key={h.id} className="relative flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`z-10 h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3 ${
                              i === 0 ? "bg-primary shadow-[0_0_0_3px_var(--color-bgSecondary)]" : "bg-muted"
                            }`}
                          />
                          {i < historialOrdenado.length - 1 && (
                            <div className="absolute bottom-[-14px] top-2.5 -z-0 w-0.5 bg-border sm:bottom-[-16px] sm:top-3" />
                          )}
                        </div>
                        <div className="-mt-0.5 min-w-0 flex-1 pb-2">
                          <span
                            className={`block text-sm font-bold capitalize ${i === 0 ? "text-primary" : "text-muted"}`}
                          >
                            {h.estado_nuevo.replace(/_/g, " ").toLowerCase()}
                          </span>
                          <span className="mt-0.5 block text-xs font-medium text-muted">
                            {formatHistorialFecha(h.registrado_en)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <section className="rounded-lg border border-border bg-bg-secondary p-2.5 shadow-sm">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted sm:text-xs">
                    <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    {pedido.tipo_servicio === "RETIRO_EN_LOCAL" ? "En el local" : "Entrega"}
                  </h3>
                  {pedido.tipo_servicio === "RETIRO_EN_LOCAL" ? (
                    <>
                      <p className="text-sm font-bold text-primary">Consumo en el salón</p>
                      <p className="text-xs leading-snug text-muted">Mesa {pedido.numero_mesa ?? "—"}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-primary">{pedido.dir_alias ?? "Dirección de entrega"}</p>
                      <p className="text-xs leading-snug text-muted">{pedido.dir_linea1 ?? "—"}</p>
                    </>
                  )}
                </section>

                <section className="rounded-lg border border-border bg-bg-secondary p-2.5 shadow-sm">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted sm:text-xs">
                    <CreditCard className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    Pago
                  </h3>
                  <p className="text-sm font-bold text-primary">{labelFormaPago(pedido.forma_pago_codigo)}</p>
                  <p className="text-xs text-muted">{formatMoney(Number(pedido.total))}</p>
                </section>
              </div>

              {pendiente && (
                <section className="rounded-lg border border-border bg-white p-2.5 shadow-sm">
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <LoadingButton
                      type="button"
                      isLoading={iniciarCheckout.isPending}
                      onClick={() => pedido && iniciarCheckout.mutate(pedido.id)}
                      className="hidden flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
                    >
                      Pagar ahora
                    </LoadingButton>
                    <button
                      type="button"
                      onClick={() => {
                        setMotivoCancel("");
                        setCancelOpen(true);
                      }}
                      className="flex-1 rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm font-bold text-danger shadow-sm transition-colors hover:bg-danger/10 active:scale-95"
                    >
                      Cancelar pedido
                    </button>
                  </div>
                </section>
              )}
            </div>

            <div className="flex min-h-0 flex-col lg:col-span-5 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]">
              <div className="rounded-lg border border-border bg-bg-secondary p-2.5 shadow-sm lg:sticky lg:top-0">
                <h3 className="mb-2 flex items-center gap-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-wide text-primary">
                  <Package className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2.2} aria-hidden />
                  Tu pedido
                </h3>

                <ul className="custom-scrollbar mb-3 max-h-[36vh] space-y-2 overflow-y-auto text-xs lg:max-h-[min(38vh,280px)]">
                  {pedido.detalles.map((d) => (
                    <li
                      key={`${d.id}-${d.producto_id}`}
                      className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-bold leading-tight text-primary">{d.nombre_producto}</span>
                        <span className="text-[11px] text-muted">
                          ×{d.cantidad} · {formatMoney(Number(d.subtotal) / Math.max(d.cantidad, 1))} c/u
                        </span>
                        {d.personalizacion && d.personalizacion.length > 0 && (
                          <p className="mt-1 text-[11px] font-medium italic text-muted">
                            Sin ingredientes (ref: {d.personalizacion.join(", ")})
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-bold tabular-nums text-primary">
                        {formatMoney(Number(d.subtotal))}
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
                    <span className="font-bold tabular-nums text-primary">{formatMoney(Number(pedido.costo_envio))}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                  <span className="text-xs font-bold text-primary">Total</span>
                  <span className="font-outfit text-xl font-black tabular-nums tracking-tight text-primary sm:text-2xl">
                    {formatMoney(Number(pedido.total))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {pendiente && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 p-2.5 backdrop-blur-sm lg:hidden">
              <LoadingButton
                type="button"
                isLoading={iniciarCheckout.isPending}
                onClick={() => pedido && iniciarCheckout.mutate(pedido.id)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-hover"
              >
                Pagar ahora · {formatMoney(Number(pedido.total))}
              </LoadingButton>
            </div>
          )}
        </CheckoutFlowShell>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title={`Cancelar pedido #${pedidoId}`}
        destructive
        confirmLabel={cancelMutation.isPending ? "Cancelando..." : "Confirmar cancelación"}
        onCancel={() => {
          setCancelOpen(false);
          setMotivoCancel("");
        }}
        onConfirm={() => {
          const m = motivoCancel.trim();
          if (m.length < 1) {
            toast.error("Por favor, indicá un motivo.");
            return;
          }
          if (pedidoId === null) return;
          cancelMutation.mutate(
            { id: pedidoId, motivo: m },
            {
              onSuccess: () => {
                toast.success("El pedido fue cancelado correctamente.");
                setCancelOpen(false);
                setMotivoCancel("");
              },
              onError: (err) => {
                toast.error(apiErrorDetail(err, "No se pudo cancelar el pedido."));
              },
            },
          );
        }}
      >
        <p className="mb-6 text-sm text-muted">
          ¿Estás seguro que deseas cancelar el pedido <strong className="text-primary">#{pedidoId}</strong>? Esta acción no se puede deshacer.
        </p>
        
        <FormField label="Motivo de la cancelación" error={motivoCancel.trim().length === 0 ? "Requerido" : undefined}>
          <input
            type="text"
            className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm font-medium text-primary focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            value={motivoCancel}
            onChange={(e) => setMotivoCancel(e.target.value)}
            placeholder="Ej: Desistí de la compra"
            minLength={1}
            autoFocus
          />
        </FormField>
      </ConfirmDialog>
    </>
  );
}
