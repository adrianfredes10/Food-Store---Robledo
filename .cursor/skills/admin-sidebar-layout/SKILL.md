---
name: admin-sidebar-layout
description: >
  Implementa el panel de administración con sidebar colapsable (desktop) y drawer (mobile).
  Activar cuando se trabaje en AdminLayout.tsx, se agreguen ítems al menú admin, o se cree
  cualquier página bajo pages/admin/.
license: MIT
metadata:
  author: foodstore
  version: "1.0"
---

# Skill: admin-sidebar-layout

## Cuándo usar esta skill

- Modificar o crear `frontend/src/pages/admin/AdminLayout.tsx`
- Agregar ítems de navegación al panel admin
- Crear una nueva página bajo `pages/admin/`
- Implementar el sidebar colapsable en desktop o el drawer en mobile

---

## Diseño del layout

```
┌─────────────────────────────────────────────────────────┐
│  [≡] FoodStore Admin          [usuario] [cerrar sesión] │  ← topbar mobile / header desktop
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDEBAR     │   <Outlet />                             │
│  (colaps.)   │   contenido de la página activa          │
│              │                                          │
│  Dashboard   │                                          │
│  ─────────   │                                          │
│  Catálogo    │                                          │
│  Categorías  │                                          │
│  Ingredientes│                                          │
│  Pedidos     │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

- **Desktop (md+)**: sidebar fijo a la izquierda, colapsable a solo íconos con un botón toggle.
- **Mobile (< md)**: sidebar oculto por defecto. Un botón hamburguesa en el topbar abre un drawer overlay.

---

## Tokens de diseño a usar (de `tailwind.config.js` + `index.css`)

| Token | Clase Tailwind | Valor |
|-------|----------------|-------|
| Fondo sidebar | `bg-slate-950` | `#020617` |
| Texto sidebar | `text-white` | — |
| Borde sidebar | `border-r border-white/10` | — |
| Ítem activo | `bg-white/10 text-white` | — |
| Ítem hover | `hover:bg-white/5 hover:text-white` | — |
| Ítem inactivo | `text-white/60` | — |
| Ancho sidebar expandido | `w-56` | `224px` |
| Ancho sidebar colapsado | `w-16` | `64px` |
| Color acento | `text-accent` / `bg-accent` | `var(--color-accent)` naranja |

La clase `.admin-sidebar` ya existe en `index.css`:
```css
.admin-sidebar {
  @apply bg-slate-950 text-white min-h-screen sticky top-0 border-r border-white/10;
}
```

---

## Ítems de navegación (orden canónico)

```typescript
const NAV_ITEMS = [
  { label: "Dashboard",    to: "/admin",              icon: LayoutDashboard, end: true },
  { label: "Catálogo",     to: "/admin/productos",    icon: ShoppingBag },
  { label: "Categorías",   to: "/admin/categorias",   icon: Tag },
  { label: "Ingredientes", to: "/admin/ingredientes", icon: Leaf },
  { label: "Pedidos",      to: "/admin/pedidos",      icon: ClipboardList },
]
```

Íconos de `lucide-react`. Importar solo los usados.

---

## Estructura del componente AdminLayout

```tsx
// Estado
const [sidebarOpen, setSidebarOpen] = useState(false)     // mobile drawer
const [collapsed, setCollapsed] = useState(false)          // desktop collapse

// Guards (igual que antes)
if (!hydrated || isLoading) → spinner
if (!token) → <Navigate to="/login" />
if (!me?.roles?.includes("ADMIN")) → acceso denegado

// JSX
<div className="flex min-h-screen bg-bg">

  {/* ── MOBILE OVERLAY ── */}
  {sidebarOpen && (
    <div
      className="fixed inset-0 z-20 bg-black/50 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}

  {/* ── SIDEBAR ── */}
  <aside
    className={`
      admin-sidebar z-30 flex flex-col transition-all duration-300
      fixed inset-y-0 left-0 md:sticky md:top-0 md:h-screen
      ${collapsed ? "w-16" : "w-56"}
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
  >
    {/* Logo / nombre */}
    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
      <span className="text-accent text-xl font-black">FS</span>
      {!collapsed && (
        <span className="text-sm font-bold uppercase tracking-widest">Admin</span>
      )}
    </div>

    {/* Navegación */}
    <nav className="flex-1 py-4 space-y-1 px-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest
             transition-all duration-150
             ${isActive
               ? "bg-white/10 text-white"
               : "text-white/60 hover:bg-white/5 hover:text-white"
             }`
          }
        >
          <item.icon size={18} className="shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </nav>

    {/* Colapsar (desktop) */}
    <div className="hidden md:flex px-2 pb-4">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                   text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs"
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <PanelLeftClose size={16} className={collapsed ? "rotate-180" : ""} />
        {!collapsed && <span className="uppercase tracking-widest">Colapsar</span>}
      </button>
    </div>
  </aside>

  {/* ── CONTENIDO PRINCIPAL ── */}
  <div className="flex-1 flex flex-col min-w-0">

    {/* Topbar */}
    <header className="sticky top-0 z-10 flex items-center justify-between
                       px-4 py-3 bg-bg border-b border-border">
      {/* Hamburguesa mobile */}
      <button
        className="md:hidden p-2 rounded-lg text-muted hover:text-primary transition-colors"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Título de sección (opcional, lo puede poner cada página) */}
      <div className="hidden md:block" />

      {/* Acciones derecha */}
      <div className="flex items-center gap-3">
        {me?.nombre && (
          <span className="hidden sm:block text-xs font-bold text-muted uppercase tracking-widest">
            {me.nombre}
          </span>
        )}
        <button
          onClick={() => useAuthStore.getState().logout()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border
                     text-xs font-bold uppercase tracking-widest text-danger
                     hover:bg-danger/10 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>

    {/* Outlet */}
    <main className="flex-1 p-4 md:p-8 fade-in min-w-0">
      <Outlet />
    </main>

  </div>
</div>
```

---

## Imports necesarios

```tsx
import { useState } from "react"
import { NavLink, Navigate, Outlet, Link } from "react-router-dom"
import {
  LayoutDashboard, ShoppingBag, Tag, Leaf, ClipboardList,
  Menu, PanelLeftClose, LogOut,
} from "lucide-react"
import { useAuthStore } from "@/shared/store/auth-store"
import { useAuthHydrated, useMe } from "@/features/auth"
```

---

## Agregar un ítem nuevo al menú

1. Importar el ícono de `lucide-react`.
2. Agregar el objeto a `NAV_ITEMS` con `label`, `to` e `icon`.
3. Asegurarse de que la ruta esté definida en el router (`src/app/router/index.tsx`).
4. Crear el componente de página en `pages/admin/NombrePage.tsx`.
5. Si la página tiene tabla + modal + confirmación, activar también la skill `dashboard-crud-page`.

---

## Checklist antes de hacer merge

- [ ] `collapsed` funciona: íconos solos cuando colapsado, label visible cuando expandido
- [ ] `sidebarOpen` funciona en mobile: overlay cierra al hacer click fuera
- [ ] `NavLink` activo muestra `bg-white/10 text-white`
- [ ] `aria-label` en botón hamburguesa y botón colapsar
- [ ] `useAuthStore.getState().logout()` en el botón salir (no hook dentro de onClick)
- [ ] Guard de rol ADMIN sigue activo
- [ ] Guard `!token → <Navigate to="/login" />` sigue activo
- [ ] Sin imports fuera de `pages/ → features/ → shared/` (FSD)
- [ ] No hay lógica de negocio en el layout (solo auth guards y navegación)
