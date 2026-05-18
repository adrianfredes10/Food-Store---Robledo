import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/**
 * Renderiza hijos en document.body para que overlays fixed cubran también
 * el topbar/sidebar del admin (evita stacking context dentro del área de contenido).
 */
export function ModalLayer({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
