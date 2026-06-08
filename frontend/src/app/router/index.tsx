import {
  createBrowserRouter,
  Link,
  NavLink,
  Outlet,
  useLocation,
  Navigate,
} from "react-router-dom";

import { useMe } from "@/features/auth";
import { AuthLoginPage } from "@/pages/auth";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/DashboardPage";
import { AdminPedidoDetallePage } from "@/pages/admin/PedidoDetallePage";
import { AdminPedidosPage } from "@/pages/admin/PedidosPage";
import { AdminCategoriasPage } from "@/pages/admin/CategoriasPage";
import { AdminIngredientesPage } from "@/pages/admin/IngredientesPage";
import { AdminProductosPage } from "@/pages/admin/ProductosPage";
import { AdminUsuariosPage } from "@/pages/admin/UsuariosPage";
import { AdminMesasPage } from "@/pages/admin/MesasPage";
import { CocinaLayout, CocinaPage } from "@/pages/cocina";
import { CarritoPage } from "@/pages/carrito";
import { CatalogoPage } from "@/pages/catalogo";
import { CheckoutPage } from "@/pages/checkout";
import { DireccionesPage } from "@/pages/direcciones";
import { MisPedidosPage } from "@/pages/mis-pedidos";
import { PedidoPage } from "@/pages/pedido";
import { LOGOUT_CONFIRM_MESSAGE } from "@/shared/lib/confirm-logout";
import { useAuthStore } from "@/shared/store/auth-store";
import { ConfirmDialog } from "@/shared/ui";
import { useCartStore } from "@/shared/store/cart-store";

import { ShoppingBag, User, Menu, X, LayoutDashboard, ChevronDown, ClipboardList, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

function AccountMenuCard({
  to,
  icon: Icon,
  title,
  subtitle,
  onClick,
  role = "menuitem",
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick?: () => void;
  role?: string;
}) {
  return (
    <Link
      to={to}
      role={role}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#1a1c23] p-2.5 transition-colors hover:bg-[#22252e] active:scale-[0.99]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-700/90">
        <Icon size={15} className="text-slate-200" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-[10px] font-medium text-slate-400">{subtitle}</span>
      </span>
    </Link>
  );
}

function AccountMenuBody({
  me,
  onLogout,
  children,
}: {
  me?: { nombre: string } | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {me ? (
        <div className="border-b border-white/10 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hola,</p>
          <p className="truncate text-sm font-bold">{me.nombre}</p>
        </div>
      ) : null}
      <div className="px-3 py-2">{children}</div>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          role="menuitem"
          onClick={onLogout}
          className="w-full rounded-xl bg-danger py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-danger/90 active:scale-[0.99]"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

function AdminMenuCards({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-bold text-white">Catálogo</p>
      <AccountMenuCard
        to="/admin"
        icon={LayoutDashboard}
        title="Panel administrador"
        subtitle="Ir al dashboard"
        onClick={onNavigate}
      />
    </div>
  );
}

function ClientMenuCards({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-bold text-white">Mi cuenta</p>
      <AccountMenuCard to="/" icon={ShoppingBag} title="Catálogo" subtitle="Ver productos" onClick={onNavigate} />
      <AccountMenuCard
        to="/mis-pedidos"
        icon={ClipboardList}
        title="Mis pedidos"
        subtitle="Historial de compras"
        onClick={onNavigate}
      />
      <AccountMenuCard
        to="/direcciones"
        icon={MapPin}
        title="Direcciones"
        subtitle="Gestionar entregas"
        onClick={onNavigate}
      />
    </div>
  );
}

function AdminNavTrigger({
  open,
  subtitle = "Administrador",
}: {
  open: boolean;
  subtitle?: string;
}) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-700/90 shadow-[inset_0_1px_0_rgb(255_255_255_/0.08)]">
        <LayoutDashboard size={15} className="text-slate-200" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1 text-left leading-tight">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Panel admin</span>
        <span className="block truncate text-xs font-bold text-white">{subtitle}</span>
      </span>
      <ChevronDown
        size={14}
        strokeWidth={2.5}
        className={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </>
  );
}

function MainNav() {
  const location = useLocation();
  const token = useAuthStore((s) => s.access_token);
  const logout = useAuthStore((s) => s.logout);
  const { data: me } = useMe();
  const isAdmin = Boolean(token && me?.roles?.includes("ADMIN"));
  const isClient = Boolean(token && !isAdmin);
  const [isOpen, setIsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartItems = useCartStore((s) => s.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

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

  return (
    <nav className="mx-auto flex h-14 max-w-6xl flex-row items-center justify-between px-3 sm:px-4 md:px-6 lg:h-[72px]">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 group shrink-0 w-auto lg:w-48">
        <div className="bg-primary p-2 rounded-lg text-white transition-all shadow-md group-hover:scale-105 active:scale-95 shrink-0">
          <ShoppingBag size={18} strokeWidth={2.5} />
        </div>
        <span className="truncate text-lg sm:text-xl font-black tracking-tighter text-primary font-outfit uppercase">
          FOOD<span className="text-muted">STORE</span>
        </span>
      </Link>

      {/* Center: Desktop Links (>1024px) */}
      <div className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-semibold">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `inline-flex border-b-2 pb-0.5 transition-colors hover:text-primary ${
              isActive ? "border-primary text-primary" : "border-transparent text-muted"
            }`
          }
        >
          Catálogo
        </NavLink>
        {isClient && (
          <NavLink
            to="/mis-pedidos"
            className={({ isActive }) =>
              `inline-flex border-b-2 pb-0.5 transition-colors hover:text-primary ${
                isActive ? "border-primary text-primary" : "border-transparent text-muted"
              }`
            }
          >
            Mis Pedidos
          </NavLink>
        )}
        {isClient && (
          <NavLink
            to="/direcciones"
            className={({ isActive }) =>
              `inline-flex border-b-2 pb-0.5 transition-colors hover:text-primary ${
                isActive ? "border-primary text-primary" : "border-transparent text-muted"
              }`
            }
          >
            Direcciones
          </NavLink>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 lg:w-48 lg:justify-end">
        {isClient && (
          <Link to="/carrito" className="relative p-2 text-primary hover:bg-bg-secondary rounded-xl transition-colors active:scale-95">
            <ShoppingBag size={22} strokeWidth={2.2} />
            {totalItems > 0 && (
              <span key={totalItems} className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-300">
                {totalItems}
              </span>
            )}
          </Link>
        )}
        
        {token ? (
          <div className="relative hidden lg:block" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className={
                isAdmin
                  ? `group flex min-w-[9.5rem] max-w-[11.5rem] items-center gap-2 rounded-xl border p-1 pr-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                      userMenuOpen
                        ? "border-accent/40 bg-gradient-to-br from-[#0b1220] to-[#111827] shadow-[0_8px_24px_rgb(11_18_32_/0.35)] ring-2 ring-accent/20 ring-offset-1"
                        : "border-slate-800/60 bg-gradient-to-br from-[#0b1220] to-[#0f172a] shadow-[0_4px_16px_rgb(11_18_32_/0.28)] hover:border-accent/25 hover:shadow-[0_6px_20px_rgb(11_18_32_/0.38)]"
                    }`
                  : "flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98]"
              }
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              title={isAdmin ? "Cuenta y panel administrador" : undefined}
            >
              {isAdmin ? (
                <AdminNavTrigger open={userMenuOpen} subtitle={me?.nombre.split(" ")[0] ?? "Admin"} />
              ) : (
                <>
                  <User size={16} strokeWidth={2.5} />
                  <span className="max-w-[140px] truncate">
                    {me ? me.nombre.split(" ")[0] : "Mi cuenta"}
                  </span>
                </>
              )}
            </button>

            {userMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-[120] w-[min(17.5rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0b] text-white shadow-2xl fade-in"
              >
                <AccountMenuBody
                  me={me}
                  onLogout={() => {
                    setUserMenuOpen(false);
                    setLogoutConfirmOpen(true);
                  }}
                >
                  {isAdmin ? (
                    <AdminMenuCards onNavigate={() => setUserMenuOpen(false)} />
                  ) : isClient ? (
                    <ClientMenuCards onNavigate={() => setUserMenuOpen(false)} />
                  ) : null}
                </AccountMenuBody>
              </div>
            ) : null}
          </div>
        ) : (
          <Link
            to="/login"
            className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors active:scale-95 shadow-sm bg-primary hover:bg-primary-hover"
          >
            <User size={16} strokeWidth={2.5} />
            Ingresar
          </Link>
        )}

        {/* Mobile/Tablet Hamburger Menu */}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -mr-2 text-primary lg:hidden transition-transform active:scale-90" aria-label="Menu">
          {isOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Mobile/Tablet: panel compacto (no fullscreen) */}
      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[98] bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed right-3 top-[3.625rem] z-[100] flex w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden overscroll-none rounded-2xl border border-white/10 bg-[#0a0a0b] text-white shadow-2xl fade-in lg:hidden"
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
              <span className="truncate text-sm font-black tracking-tighter font-outfit uppercase">
                FOOD<span className="text-slate-500">STORE</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-lg p-1.5 transition-transform active:scale-90 hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </header>

            <div className="shrink-0 overflow-hidden">
              {token && me ? (
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hola,</p>
                  <p className="truncate text-sm font-bold leading-snug">{me.nombre}</p>
                </div>
              ) : null}

              <div className="px-3 py-2">
                {isAdmin ? (
                  <AdminMenuCards onNavigate={() => setIsOpen(false)} />
                ) : isClient ? (
                  <ClientMenuCards onNavigate={() => setIsOpen(false)} />
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 p-2.5">
              {token ? (
                <button
                  type="button"
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="w-full rounded-xl bg-danger py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-danger/90 active:scale-[0.99]"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full rounded-xl bg-accent py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-accent-hover active:scale-[0.99]"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Cerrar sesión"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          logout();
          setLogoutConfirmOpen(false);
          setIsOpen(false);
        }}
      >
        <p className="text-sm font-medium text-slate-600">{LOGOUT_CONFIRM_MESSAGE}</p>
      </ConfirmDialog>
    </nav>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  /** Scroll en el documento (html { overflow-y: scroll }): el <main> no compite con barras internas entre catálogo y el resto. */
  const storeMainClassName = [
    "mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-clip",
    "px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3",
  ].join(" ");

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip fade-in">
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-100 bg-white/95 shadow-sm">
        <MainNav />
      </header>
      <main
        className={
          isLogin
            ? "mx-auto flex w-full min-h-0 min-w-0 max-w-6xl flex-1 flex-col overflow-x-clip px-3 py-2 sm:px-4"
            : storeMainClassName
        }
      >
        <Outlet />
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <CatalogoPage /> },
      { path: "guia", element: <Navigate to="/" replace /> },
      { path: "carrito", element: <CarritoPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "direcciones", element: <DireccionesPage /> },
      { path: "mis-pedidos", element: <MisPedidosPage /> },
      { path: "pedido/:id", element: <PedidoPage /> },
      { path: "login", element: <AuthLoginPage /> },
    ],
  },
  {
    path: "/cocina",
    element: <CocinaLayout />,
    children: [{ index: true, element: <CocinaPage /> }],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "productos", element: <AdminProductosPage /> },
      { path: "categorias", element: <AdminCategoriasPage /> },
      { path: "ingredientes", element: <AdminIngredientesPage /> },
      { path: "mesas", element: <AdminMesasPage /> },
      { path: "usuarios", element: <AdminUsuariosPage /> },
      { path: "pedidos", element: <AdminPedidosPage /> },
      { path: "pedidos/:id", element: <AdminPedidoDetallePage /> },
    ],
  },
]);
