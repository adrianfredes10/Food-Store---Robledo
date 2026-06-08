import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Check, CreditCard, Package, ShoppingCart } from "lucide-react";

/** Fase del flujo de compra para la línea de tiempo Carrito → Pedido → Pago */
export type CheckoutFlowPhase = "carrito" | "checkout" | "pago_pendiente" | "pago_ok";

const STEPS: {
  n: 1 | 2 | 3;
  label: string;
  shortLabel: string;
  icon: typeof ShoppingCart;
}[] = [
  { n: 1, label: "Carrito", shortLabel: "Carrito", icon: ShoppingCart },
  { n: 2, label: "Tu pedido", shortLabel: "Pedido", icon: Package },
  { n: 3, label: "Pago", shortLabel: "Pago", icon: CreditCard },
];

function stepCompleted(phase: CheckoutFlowPhase, step: 1 | 2 | 3): boolean {
  switch (phase) {
    case "carrito":
      return false;
    case "checkout":
      return step === 1;
    case "pago_pendiente":
      return step === 1 || step === 2;
    case "pago_ok":
      return true;
    default:
      return false;
  }
}

function stepActive(phase: CheckoutFlowPhase, step: 1 | 2 | 3): boolean {
  switch (phase) {
    case "carrito":
      return step === 1;
    case "checkout":
      return step === 2;
    case "pago_pendiente":
      return step === 3;
    case "pago_ok":
      /** Paso 3 como cierre del flujo (todos los círculos ya van en “hecho”, pero el 3 queda destacado). */
      return step === 3;
    default:
      return false;
  }
}

/** Línea entre el paso anterior y el siguiente: activa si el paso de origen ya quedó completado. */
function connectorCompleted(phase: CheckoutFlowPhase, afterStep: 2 | 3): boolean {
  if (afterStep === 2) return stepCompleted(phase, 1);
  return stepCompleted(phase, 2);
}

type Props = {
  phase: CheckoutFlowPhase;
  className?: string;
  /** Menos alto: útil en carrito/checkout/pago para ver todo sin tanto scroll. */
  compact?: boolean;
};

/**
 * Línea de tiempo horizontal: Carrito → Pedido (checkout) → Pago.
 */
export function CheckoutFlowStepper({ phase, className = "", compact = false }: Props) {
  const hrefForStep = (step: 1 | 2 | 3): string | null => {
    if (step === 1 && phase !== "carrito") return "/carrito";
    if (step === 2 && phase === "carrito") return "/checkout";
    return null;
  };

  return (
    <nav
      aria-label="Pasos del pedido"
      className={`w-full min-w-0 ${className}`}
    >
      <div
        className={`mx-auto flex w-full min-w-0 items-center justify-center px-0.5 ${compact ? "" : "max-w-lg md:max-w-2xl"}`}
      >
        {STEPS.map((s, index) => {
          const completed = stepCompleted(phase, s.n);
          const active = stepActive(phase, s.n);
          const href = hrefForStep(s.n);
          const Icon = s.icon;
          const showCheck = phase === "pago_ok" || (completed && !active);

          const circleClass = [
            "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            compact
              ? "h-6 w-6 sm:h-7 sm:w-7"
              : "h-9 w-9 sm:h-10 sm:w-10",
            phase === "pago_ok"
              ? "border-primary bg-primary text-white"
              : completed && !active
                ? "border-primary bg-primary text-white"
                : active
                  ? "border-primary bg-primary/5 text-primary shadow-[0_0_0_2px_var(--color-bg)] ring-2 ring-primary/30"
                  : "border-border bg-bg-secondary text-muted",
          ].join(" ");

          const labelClass = [
            "text-center font-bold uppercase leading-tight tracking-wide",
            compact
              ? "mt-0.5 text-[7px] sm:text-[8px]"
              : "mt-1.5 text-[9px] sm:text-[10px] md:text-xs",
            phase === "pago_ok" || completed || active ? "text-primary" : "text-muted",
          ].join(" ");

          const cell = (
            <div className={`flex flex-col items-center ${compact ? "px-0 sm:px-1" : "px-0.5 sm:px-2"}`}>
              <span className={circleClass}>
                {showCheck ? (
                  <Check
                    className={
                      compact
                        ? "h-2.5 w-2.5 stroke-[3] sm:h-3 sm:w-3"
                        : "h-4 w-4 stroke-[3] sm:h-[18px] sm:w-[18px]"
                    }
                    aria-hidden
                  />
                ) : (
                  <Icon
                    className={compact ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4"}
                    strokeWidth={2.2}
                    aria-hidden
                  />
                )}
              </span>
              <span className={`${labelClass} max-w-[4.25rem] sm:max-w-none`}>
                <span className="sm:hidden">{s.shortLabel}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </div>
          );

          return (
            <Fragment key={s.n}>
              {index > 0 && (
                <div
                  className={`mx-0.5 h-0.5 min-h-px flex-1 rounded-full sm:mx-1 sm:h-1 ${
                    connectorCompleted(phase, s.n as 2 | 3) ? "bg-primary" : "bg-border"
                  }`}
                  aria-hidden
                />
              )}
              {href ? (
                <Link
                  to={href}
                  className="shrink-0 rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {cell}
                </Link>
              ) : (
                <div className="shrink-0">{cell}</div>
              )}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
