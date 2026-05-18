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

import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

function MainNav() {
  const location = useLocation();
  const token = useAuthStore((s) => s.access_token);
  const logout = useAuthStore((s) => s.logout);
  const { data: me } = useMe();
  const isAdmin = Boolean(token && me?.roles?.includes("ADMIN"));
  const isClient = Boolean(token && !isAdmin);
  const [isOpen, setIsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
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
  }, [location.pathname]);

  return (
    <nav className="mx-auto flex flex-row items-center justify-between px-4 sm:px-6 h-14 lg:h-[72px] max-w-7xl">
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
      <div className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-semibold text-muted">
        <NavLink to="/" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary border-b-2 border-primary" : ""}`}>Catálogo</NavLink>
        {isClient && <NavLink to="/mis-pedidos" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary border-b-2 border-primary" : ""}`}>Mis Pedidos</NavLink>}
        {isClient && <NavLink to="/direcciones" className={({ isActive }) => `hover:text-primary transition-colors ${isActive ? "text-primary border-b-2 border-primary" : ""}`}>Direcciones</NavLink>}
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
        
        <Link
          to={isClient ? "/direcciones" : isAdmin ? "/admin" : "/login"}
          className={`hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors active:scale-95 shadow-sm ${
            isAdmin ? "bg-warning hover:bg-warning/90" : "bg-primary hover:bg-primary-hover"
          }`}
        >
          <User size={16} strokeWidth={2.5} />
          <span className="max-w-[140px] truncate">
            {token && me
              ? isAdmin
                ? "Panel administrador"
                : me.nombre.split(" ")[0]
              : "Ingresar"}
          </span>
        </Link>

        {token && (
          <button 
            type="button" 
            title="Cerrar sesión"
            onClick={() => setLogoutConfirmOpen(true)} 
            className="hidden lg:flex items-center p-2 text-muted hover:bg-danger/10 hover:text-danger rounded-xl transition-colors active:scale-95"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
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
            className="fixed right-3 top-[3.625rem] z-[100] flex w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl fade-in lg:hidden"
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
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

            <div className="max-h-[min(22rem,calc(100dvh-7rem))] overflow-y-auto overscroll-contain px-3 py-3">
              {token && me && (
                <div className="mb-3 border-b border-white/10 pb-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Hola,</p>
                  <p className="truncate text-base font-bold leading-snug">{me.nombre}</p>
                </div>
              )}

              <nav className="flex flex-col gap-0.5">
                <Link
                  className="rounded-lg px-2 py-2 text-sm font-bold transition-colors hover:bg-white/10 hover:text-accent"
                  to="/"
                  onClick={() => setIsOpen(false)}
                >
                  Catálogo
                </Link>
                {isClient && (
                  <Link
                    className="rounded-lg px-2 py-2 text-sm font-bold transition-colors hover:bg-white/10 hover:text-accent"
                    to="/direcciones"
                    onClick={() => setIsOpen(false)}
                  >
                    Direcciones
                  </Link>
                )}
                {isClient && (
                  <Link
                    className="rounded-lg px-2 py-2 text-sm font-bold transition-colors hover:bg-white/10 hover:text-accent"
                    to="/mis-pedidos"
                    onClick={() => setIsOpen(false)}
                  >
                    Mis pedidos
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    className="rounded-lg px-2 py-2 text-sm font-bold text-warning transition-colors hover:bg-white/10 hover:text-warning/90"
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                  >
                    Panel Administrador
                  </Link>
                )}
              </nav>

              <div className="mt-3 border-t border-white/10 pt-3">
                {token ? (
                  <button
                    type="button"
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="w-full rounded-xl bg-white/10 py-2.5 text-center text-sm font-bold transition-colors hover:bg-white/15 active:scale-[0.99]"
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
  const token = useAuthStore((s) => s.access_token);
  const { data: me } = useMe();
  const isAdmin = Boolean(token && me?.roles?.includes("ADMIN"));
  const isClient = Boolean(token && !isAdmin);

  return (
    <div className="flex min-h-[100dvh] flex-col fade-in max-md:overflow-x-clip md:overflow-x-visible">
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-100 bg-white/95 shadow-sm">
        <MainNav />
      </header>
      <main
        className={
          isLogin
            ? "mx-auto flex w-full min-h-0 min-w-0 max-w-6xl flex-1 flex-col overflow-x-clip overflow-y-auto px-3 py-2 sm:px-4"
            : "mx-auto w-full min-w-0 max-w-6xl flex-1 max-md:max-w-[100vw] max-md:overflow-x-clip px-3 sm:px-4 md:px-6 py-2 sm:py-4 md:py-12 md:overflow-x-visible"
        }
      >
        <Outlet />
      </main>
      {!isLogin && (
      <footer className="bg-slate-950 text-white py-10 md:py-20 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 md:mb-8 text-center md:text-left justify-center md:justify-start">
              <span className="text-lg md:text-2xl font-black tracking-tighter text-white font-outfit">
                FOOD<span className="text-slate-500">STORE</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm font-medium text-[10px] md:text-sm text-center md:text-left mx-auto md:mx-0">
              Experiencias gastronómicas de alta gama entregadas con precisión. 
              Seleccionamos solo lo mejor para los paladares más exigentes.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-2 md:flex md:justify-end md:gap-16">
            <div className="text-center md:text-left">
              <h4 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 mb-4 md:mb-8 font-outfit text-white">Navegación</h4>
              <ul className="space-y-2 md:space-y-4 text-xs md:text-sm text-slate-400 font-medium">
                <li><Link to="/" className="hover:text-white transition-colors">Menú</Link></li>
                {isClient && (
                  <li><Link to="/carrito" className="hover:text-white transition-colors">Carrito</Link></li>
                )}
              </ul>
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 mb-4 md:mb-8 font-outfit text-white">Contacto</h4>
              <div className="space-y-2 md:space-y-4 text-xs md:text-sm text-slate-400 font-medium break-words">
                <p>atencion@foodstore.com</p>
                <p>+54 11 4930-1022</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 md:px-6 mt-10 md:mt-20 pt-6 md:pt-8 border-t border-white/5 text-center text-[7px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} FoodStore HQ. All rights reserved. Premium Service.
        </div>
      </footer>
      )}
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
