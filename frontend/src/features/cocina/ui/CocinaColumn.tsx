import type { ReactNode } from "react";

type CocinaColumnProps = {
  title: string;
  count: number;
  emptyLabel: string;
  children: ReactNode;
};

export function CocinaColumn({ title, count, emptyLabel, children }: CocinaColumnProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg-secondary px-2 py-1.5 md:px-3 md:py-2">
        <h2 className="truncate text-[9px] font-bold uppercase tracking-widest text-muted md:text-[10px]">
          {title}
        </h2>
        <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-xs font-black tabular-nums text-primary">
          {count}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-1.5 md:p-2">
        {count === 0 ? (
          <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
