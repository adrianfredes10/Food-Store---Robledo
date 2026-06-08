import { useEffect, useRef, useState } from "react";
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
  User,
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
  { label: "Mesas", to: "/admin/mesas", icon: Table2 },
  { label: "Usuarios", to: "/admin/usuarios", icon: Users },
  { label: "Pedidos", to: "/admin/pedidos", icon: ClipboardList },
] as const;

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.access_token);
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [userMenuOpen]);

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
    <div className="flex h-screen overflow-hidden bg-admin-shell">
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
      ${collapsed ? "w-14" : "w-44"}
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-admin-sidebar-border px-3 py-3">
          <span className="text-admin-sidebar-brand text-xl font-black leading-none">FS</span>
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest text-admin-sidebar-fg">
              Admin
            </span>
          )}
        </div>

        <nav className="flex-1 min-h-0 space-y-0.5 overflow-y-auto overscroll-y-contain px-1.5 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item && item.end === true}
                onClick={() => setSidebarOpen(false)}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-150
             ${
               isActive
                 ? "bg-admin-sidebar-highlight text-admin-sidebar-fg"
                 : "text-admin-sidebar-muted hover:bg-admin-sidebar-subtle hover:text-admin-sidebar-fg"
             }`
                }
              >
                <Icon size={15} className="shrink-0" strokeWidth={2.25} />
                {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-0.5 border-t border-admin-sidebar-border px-1.5 py-2">
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-150 ${
                userMenuOpen
                  ? "bg-admin-sidebar-highlight text-admin-sidebar-fg"
                  : "text-admin-sidebar-muted hover:bg-admin-sidebar-subtle hover:text-admin-sidebar-fg"
              }`}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              title={me?.nombre ?? "Cuenta"}
            >
              <User size={15} className="shrink-0" strokeWidth={2.25} />
              {!collapsed && (
                <span className="min-w-0 flex-1 truncate text-left normal-case">{me?.nombre ?? "Admin"}</span>
              )}
            </button>

            {userMenuOpen ? (
              <div
                role="menu"
                className={`absolute z-50 overflow-hidden rounded-xl border border-admin-sidebar-border bg-admin-sidebar shadow-xl fade-in ${
                  collapsed
                    ? "left-full bottom-0 ml-2 w-52"
                    : "bottom-full left-0 mb-2 w-full min-w-[12rem]"
                }`}
              >
                {me?.nombre && !collapsed ? (
                  <div className="border-b border-admin-sidebar-border px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-admin-sidebar-muted">Sesión</p>
                    <p className="truncate text-xs font-bold text-admin-sidebar-fg">{me.nombre}</p>
                  </div>
                ) : null}

                <div className="p-1.5">
                  <Link
                    to="/"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-admin-sidebar-fg transition-colors hover:bg-admin-sidebar-subtle"
                  >
                    <Eye size={16} className="shrink-0" />
                    <span>Vista previa catálogo</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] text-admin-sidebar-muted transition-colors hover:bg-admin-sidebar-subtle hover:text-admin-sidebar-fg"
              aria-label={collapsed ? "Expandir menú" : "Ocultar menú"}
            >
              <PanelLeftClose size={14} className={collapsed ? "rotate-180" : ""} />
              {!collapsed && <span className="uppercase tracking-wide">Ocultar</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="admin-topbar sticky top-0 z-10 flex shrink-0 items-center gap-3 px-4 py-3 md:hidden">
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bg-secondary/80 hover:text-primary"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden p-2 max-md:py-4 md:p-4 fade-in">
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
