import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, MapPin, UtensilsCrossed } from "lucide-react";

import type { CocinaDetalleLinea, CocinaPedidoItem } from "@/shared/api/endpoints/cocina";
import { LoadingButton } from "@/shared/ui";

type UrgenciaNivel = "normal" | "advertencia" | "urgente";

function calcUrgencia(
  confirmadoEn: string,
  now: number,
): { minutos: number; elapsedLabel: string; nivel: UrgenciaNivel } {
  const diffMs = Math.max(0, now - new Date(confirmadoEn).getTime());
  const totalSec = Math.floor(diffMs / 1000);
  const minutos = Math.floor(totalSec / 60);
  const segundos = totalSec % 60;
  const elapsedLabel = `${minutos}:${String(segundos).padStart(2, "0")}`;
  if (minutos >= 20) return { minutos, elapsedLabel, nivel: "urgente" };
  if (minutos >= 10) return { minutos, elapsedLabel, nivel: "advertencia" };
  return { minutos, elapsedLabel, nivel: "normal" };
}

const BORDER_STYLES: Record<UrgenciaNivel, string> = {
  normal: "border-l-border",
  advertencia: "border-l-accent",
  urgente: "border-l-red-500 animate-pulse",
};

const TIMER_STYLES: Record<UrgenciaNivel, string> = {
  normal: "text-muted bg-bg-secondary",
  advertencia: "text-accent bg-accent/10",
  urgente: "text-red-600 bg-red-50",
};

function formatPersonalizacion(detalle: CocinaDetalleLinea): string | null {
  if (detalle.personalizacion?.length) {
    return detalle.personalizacion.map((id) => `#${id}`).join(", ");
  }
  return null;
}

function etiquetaServicio(pedido: CocinaPedidoItem): { label: string; isMesa: boolean } {
  if (pedido.numero_mesa != null) {
    return { label: `Mesa ${pedido.numero_mesa}`, isMesa: true };
  }
  if (pedido.tipo_servicio === "RETIRO_EN_LOCAL") {
    return { label: "Retiro", isMesa: false };
  }
  return { label: "Delivery", isMesa: false };
}

type CocinaPedidoCardProps = {
  pedido: CocinaPedidoItem;
  onAvanzar?: () => void;
  avanzarLabel?: string;
  isPending?: boolean;
  finalizado?: boolean;
};

export function CocinaPedidoCard({
  pedido,
  onAvanzar,
  avanzarLabel,
  isPending,
  finalizado,
}: CocinaPedidoCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { elapsedLabel, nivel } = calcUrgencia(pedido.confirmado_en, now);
  const servicio = etiquetaServicio(pedido);
  const ServicioIcon = servicio.isMesa ? UtensilsCrossed : MapPin;

  return (
    <article
      className={`relative overflow-hidden rounded-lg border border-border border-l-4 bg-white p-2 shadow-sm transition-colors hover:bg-bg-secondary/30 ${BORDER_STYLES[nivel]}`}
    >
      <header className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-base font-black tabular-nums text-primary">#{pedido.id}</h3>
            <span className="inline-flex items-center gap-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-muted">
              <ServicioIcon size={10} strokeWidth={2.5} className="shrink-0" />
              {servicio.label}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider tabular-nums ${TIMER_STYLES[nivel]}`}
        >
          <Clock size={11} strokeWidth={2.5} />
          {elapsedLabel}
        </span>
      </header>

      <ul className="space-y-1">
        {pedido.detalles.map((detalle, idx) => {
          const exclusiones = formatPersonalizacion(detalle);
          return (
            <li key={`${pedido.id}-${idx}`} className="border-b border-border/60 pb-1 last:border-0 last:pb-0">
              <p className="text-xs font-bold leading-snug text-primary">
                <span className="text-accent">{detalle.cantidad}×</span> {detalle.nombre_producto}
              </p>
              {exclusiones ? (
                <p className="mt-0.5 text-[9px] font-semibold text-accent">Sin: {exclusiones}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {pedido.observaciones_cliente?.trim() ? (
        <p className="mt-1.5 rounded-md border border-border bg-bg-secondary px-2 py-1 text-[10px] leading-snug text-primary">
          <span className="font-bold uppercase tracking-wider text-muted">Nota: </span>
          {pedido.observaciones_cliente.trim()}
        </p>
      ) : null}

      <div className="mt-2">
        {finalizado ? (
          <span className="flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-bg-secondary py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            <Check size={12} strokeWidth={2.5} />
            Listo
          </span>
        ) : onAvanzar ? (
          <LoadingButton
            type="button"
            isLoading={isPending}
            onClick={onAvanzar}
            className="admin-btn-primary flex w-full items-center justify-center gap-1 py-1.5"
          >
            {avanzarLabel ?? "Avanzar"}
            <ArrowRight size={12} strokeWidth={2.5} />
          </LoadingButton>
        ) : null}
      </div>
    </article>
  );
}
