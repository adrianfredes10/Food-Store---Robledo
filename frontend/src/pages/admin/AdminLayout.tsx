import { useState } from "react";
import { NavLink, Navigate, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Leaf,
  ClipboardList,
  Menu,
  PanelLeftClose,
  LogOut,
  Users,
  Table2,
  Eye,
} from "lucide-react";

import { LOGOUT_CONFIRM_MESSAGE } from "@/shared/lib/confirm-logout";
import { useAuthHydrated, useMe } from "@/features/auth";
import { useAuthStore } from "@/shared/store/auth-store";
import { ConfirmDialog } from "@/shared/ui";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Productos", to: "/admin/productos", icon: ShoppingBag },
  { label: "Categorías", to: "/admin/categorias", icon: Tag },
  { label: "Ingredientes", to: "/admin/ingredientes", icon: Leaf },
  { label: "Mesas y reservas", to: "/admin/mesas", icon: Table2 },
  { label: "Usuarios", to: "/admin/usuarios", icon: Users },
  { label: "Pedidos", to: "/admin/pedidos", icon: ClipboardList },
] as const;

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const { data: me, isLoading } = useMe();

  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Sincronizando...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!me?.roles?.includes("ADMIN")) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm fade-in mt-12">
        <h1 className="mb-4 text-xl font-bold text-primary">Acceso Denegado</h1>
        <p className="text-sm text-muted mb-8">
          Se requiere autorización de nivel administrador para este sector.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
        >
          Volver al Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-md:overflow-x-clip bg-admin-shell md:overflow-x-visible">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-admin-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
      admin-sidebar z-30 flex min-h-0 flex-col transition-all duration-300
      fixed inset-y-0 left-0 md:sticky md:top-0 md:h-screen md:max-h-screen
      ${collapsed ? "w-16" : "w-56"}
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-admin-sidebar-border">
          <span className="text-admin-sidebar-brand text-xl font-black">FS</span>
          {!collapsed && (
            <span className="text-sm font-bold uppercase tracking-widest text-admin-sidebar-fg">
              Admin
            </span>
          )}
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item && item.end === true}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest
             transition-all duration-150
             ${
               isActive
                 ? "bg-admin-sidebar-highlight text-admin-sidebar-fg"
                 : "text-admin-sidebar-muted hover:bg-admin-sidebar-subtle hover:text-admin-sidebar-fg"
             }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden md:flex px-2 pb-4">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                   text-admin-sidebar-muted hover:text-admin-sidebar-fg hover:bg-admin-sidebar-subtle transition-colors text-xs"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <PanelLeftClose size={16} className={collapsed ? "rotate-180" : ""} />
            {!collapsed && <span className="uppercase tracking-widest">Colapsar</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="admin-topbar sticky top-0 z-10 flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="md:hidden shrink-0 p-2 rounded-lg text-muted hover:text-primary hover:bg-bg-secondary/80 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-stretch justify-center md:items-center" />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-white/50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:border-accent/40 hover:bg-accent/5 sm:px-3 sm:text-xs"
            >
              <Eye size={16} className="shrink-0" />
              <span className="hidden sm:inline">Vista previa catálogo</span>
              <span className="sm:hidden">Catálogo</span>
            </Link>
            {me?.nombre && (
              <span className="hidden sm:block text-xs font-bold text-muted uppercase tracking-widest">
                {me.nombre}
              </span>
            )}
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/80 bg-white/50
                     text-xs font-bold uppercase tracking-widest text-danger
                     hover:bg-danger/10 hover:border-danger/30 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 max-w-full max-md:overflow-x-clip px-2 py-4 md:p-8 fade-in md:overflow-x-visible">
          <Outlet />
        </main>
      </div>

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
