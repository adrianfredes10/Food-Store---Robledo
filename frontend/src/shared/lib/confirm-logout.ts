/** Mensaje y acción reutilizable para cerrar sesión desde la UI. */

export const LOGOUT_CONFIRM_MESSAGE =
  "¿Seguro que querés cerrar sesión? Se borrará la sesión en este dispositivo.";

export function userConfirmedLogout(): boolean {
  if (typeof window === "undefined") return true;
  return window.confirm(LOGOUT_CONFIRM_MESSAGE);
}
