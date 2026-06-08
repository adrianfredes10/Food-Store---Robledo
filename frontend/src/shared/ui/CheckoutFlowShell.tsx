import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { CheckoutFlowStepper, type CheckoutFlowPhase } from "./CheckoutFlowStepper";

/** Contenedor común paso 1–3: compacto, sin recortar el stepper en móvil. */
const shellRootClass =
  "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-1 overflow-x-clip pb-2 fade-in lg:pb-0";

export type CheckoutFlowShellProps = {
  phase: CheckoutFlowPhase;
  title: string;
  description?: ReactNode;

  back?: { to: string; label: string };
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function CheckoutFlowShell({
  phase,
  title,
  description,

  back,
  headerExtra,
  children,
}: CheckoutFlowShellProps) {
  return (
    <div className={shellRootClass}>
      <header className="shrink-0 space-y-1.5 border-b border-border pb-1.5">
        <div className="flex min-h-[1.125rem] items-center justify-between gap-2">
          {back ? (
            <Link
              to={back.to}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted transition-colors hover:text-primary sm:text-[11px]"
            >
              <ArrowLeft className="h-3 w-3 shrink-0" aria-hidden />
              {back.label}
            </Link>
          ) : (
            <span aria-hidden className="min-w-0" />
          )}
          {headerExtra ? <div className="flex shrink-0 items-center gap-2">{headerExtra}</div> : null}
        </div>

        <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between min-[420px]:gap-3">
          <div className="min-w-0">
            <h1 className="font-outfit text-lg font-black tracking-tight text-primary sm:text-xl">{title}</h1>
            {description != null && description !== "" ? (
              <div className="mt-0 max-w-xl text-[10px] font-medium leading-snug text-muted sm:text-[11px] [&_.font-outfit]:font-outfit">
                {description}
              </div>
            ) : null}
          </div>
          <CheckoutFlowStepper phase={phase} compact className="w-full min-w-0 shrink-0 min-[420px]:max-w-[13rem] sm:max-w-[15rem]" />
        </div>


      </header>

      {children}
    </div>
  );
}
