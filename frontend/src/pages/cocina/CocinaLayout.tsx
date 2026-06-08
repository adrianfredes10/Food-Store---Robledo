import { useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { ChefHat, LogOut, Volume2, VolumeX } from "lucide-react";

import { useAuthHydrated, useMe } from "@/features/auth";
import { useCocinaWebSocket } from "@/features/cocina";
import { LOGOUT_CONFIRM_MESSAGE } from "@/shared/lib/confirm-logout";
import { useAuthStore } from "@/shared/store/auth-store";
import { ConfirmDialog } from "@/shared/ui";

const COCINA_ROLES = ["COCINA", "PEDIDOS", "ADMIN"] as const;

function hasCocinaAccess(roles: string[] | undefined): boolean {
  return Boolean(roles?.some((r) => COCINA_ROLES.includes(r as (typeof COCINA_ROLES)[number])));
}

export function CocinaLayout() {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const { data: me, isLoading } = useMe();
  const { isLive, flashActive, soundEnabled, setSoundEnabled } = useCocinaWebSocket();

  if (!hydrated || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-shell">
        <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-muted">
          Sincronizando...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: "/cocina" }} />;
  }

  if (!hasCocinaAccess(me?.roles)) {
    return (
      <div className="flex h-screen items-center justify-center bg-admin-shell px-4">
        <div className="admin-panel mx-auto max-w-lg p-8 text-center fade-in">
          <h1 className="mb-4 text-xl font-bold text-primary">Acceso Denegado</h1>
          <p className="mb-8 text-sm text-muted">
            Se requiere rol Cocina, Pedidos o Administrador para acceder al display de cocina.
          </p>
          <Link
            to="/"
            className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-hover"
          >
            Volver al Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-admin-shell">
      {flashActive ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-50 bg-accent/15"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        />
      ) : null}

      <header className="admin-topbar z-10 flex shrink-0 items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-primary">
            <ChefHat size={18} strokeWidth={2.25} />
          </span>
          <h1 className="truncate text-sm font-black uppercase tracking-tight text-primary sm:text-base">Cocina</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted transition-colors hover:bg-bg-secondary"
            aria-pressed={soundEnabled}
            title={soundEnabled ? "Silenciar alertas" : "Activar alertas sonoras"}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden sm:inline">{soundEnabled ? "Sonido" : "Mudo"}</span>
          </button>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet context={{ isLive }} />
      </main>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Cerrar sesión"
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          useAuthStore.getState().logout();
          setLogoutConfirmOpen(false);
        }}
      >
        <p className="text-sm font-medium text-slate-600">{LOGOUT_CONFIRM_MESSAGE}</p>
      </ConfirmDialog>
    </div>
  );
}

export type CocinaLayoutContext = {
  isLive: boolean;
};
