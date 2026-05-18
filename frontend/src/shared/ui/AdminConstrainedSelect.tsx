import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type AdminSelectOption = { value: string; label: string };

const BTN_CLASS =
  "mt-1 flex w-full min-w-0 max-w-full cursor-pointer items-center justify-between gap-2 box-border rounded-xl border border-border bg-bg-secondary px-2.5 py-2 text-left text-[11px] font-bold text-primary leading-snug outline-none transition-all hover:bg-bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3 sm:text-sm sm:leading-normal focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function AdminConstrainedSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  disabled,
  id,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxH: number;
  } | null>(null);

  const selected = options.find((o) => o.value === value);

  const measure = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const maxH = Math.max(120, Math.min(240, window.innerHeight - r.bottom - gap - 16));
    setMenuPos({ top: r.bottom + gap, left: r.left, width: r.width, maxH });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  useLayoutEffect(() => {
    if (!open) return;
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if ((t as Element).closest?.("[data-admin-constrained-select-menu]")) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const empty = options.length === 0;
  const list =
    open && menuPos && !empty ? (
      <ul
        role="listbox"
        data-admin-constrained-select-menu
        className="fixed z-[300] overflow-y-auto overscroll-contain rounded-xl border border-border bg-white py-1 shadow-lg"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          maxHeight: menuPos.maxH,
        }}
      >
        {options.map((o) => (
          <li key={o.value === "" ? "__empty__" : o.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={
                o.value === value
                  ? "w-full whitespace-normal break-words px-3 py-2 text-left text-[11px] font-bold leading-snug text-primary sm:text-sm bg-accent/15"
                  : "w-full whitespace-normal break-words px-3 py-2 text-left text-[11px] font-bold leading-snug text-primary hover:bg-bg-secondary sm:text-sm"
              }
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled || empty}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={BTN_CLASS}
        onClick={() => {
          if (disabled || empty) return;
          setOpen((v) => !v);
        }}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {typeof document !== "undefined" && list ? createPortal(list, document.body) : null}
    </div>
  );
}
