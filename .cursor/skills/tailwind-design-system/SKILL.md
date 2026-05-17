---
name: tailwind-design-system
description: >
  Tokens Tailwind y estilos globales de FoodStore (variables CSS, theme extend, utilidades).
  Activar al crear componentes UI, páginas públicas o admin, o al ajustar layout/colores.
license: MIT
metadata:
  author: foodstore
  version: "1.0"
---

# Skill: tailwind-design-system (FoodStore)

> **Origen:** no había un ZIP con esta skill en el repo; este documento refleja el **design system real** del frontend (`tailwind.config.js` + `frontend/src/shared/styles/index.css`). Si tenés la versión del paquete dashboard, podés reemplazar este archivo por la copia oficial.

## Cuándo usar esta skill

- Nuevos componentes en `frontend/src/shared/ui/` o páginas en `frontend/src/pages/`
- Ajustes de color, borde, fondo o tipografía que deban mantener coherencia con el resto del sitio
- Admin: combinar con `admin-sidebar-layout` (sidebar usa `slate-950` y clases propias; el contenido usa tokens de abajo)

## Archivos canónicos

| Archivo | Rol |
|---------|-----|
| `frontend/tailwind.config.js` | `theme.extend.colors` mapeadas a variables CSS |
| `frontend/src/shared/styles/index.css` | `:root` tokens, `@layer base`, `@layer components` |

## Tokens `:root` (referencia rápida)

| Variable CSS | Uso típico |
|--------------|------------|
| `--color-primary` | Texto principal / encabezados contexto claro |
| `--color-primary-hover` | Hover sobre superficies primary |
| `--color-accent` | CTAs, marca “FoodStore”, acentos |
| `--color-accent-hover` | Hover en acento |
| `--color-success` | estados OK |
| `--color-warning` | advertencias |
| `--color-danger` | errores, acciones destructivas |
| `--color-muted` | texto secundario |
| `--color-border` | bordes de cards y inputs |
| `--color-bg` | fondo página |
| `--color-bg-secondary` | paneles suaves |
| `--color-bg-tertiary` | franjas alternadas |

En Tailwind usá las clases del theme extend, por ejemplo: `bg-bg`, `text-primary`, `border-border`, `text-muted`, `text-danger`, `bg-accent`, `text-accent`.

## Tipografía

- **Body:** Inter (definido en `body` en `index.css`)
- **Títulos `h1`–`h6`:** Outfit, `font-semibold tracking-tight`

Mantené jerarquía con utilidades existentes (`text-sm`, `md:text-base` en `html`, etc.) en lugar de tamaños arbitrarios salvo casos puntuales.

## Componentes utilitarios (`@layer components`)

- **`.glass`:** superficies translúcidas con borde suave
- **`.premium-shadow`:** sombra de elevación para cards premium
- **`.admin-sidebar`:** fondo sidebar admin (`bg-slate-950`, borde derecho, sticky)

No dupliqués estas reglas en JSX inline; reutilizá la clase o extendé en el mismo archivo CSS si hace falta una variante.

## Animación

- **`.fade-in`:** entrada suave (usada en layout admin / main)

## Reglas de trabajo

1. **Preferir tokens del theme** (`bg-bg`, `text-primary`, `border-border`) antes que colores Tailwind crudos (`bg-slate-50`), salvo en zonas con contrato fijo (ej. sidebar oscuro del admin).
2. **No** introducir nuevas variables CSS sin actualizar `tailwind.config.js` para exponerlas como utilidades coherentes.
3. **Contraste y accesibilidad:** estados hover/focus visibles; no depender solo del color para transmitir estado (acompañar con texto o ícono + `aria-label` donde corresponda).
4. **Responsive:** seguir breakpoints estándar de Tailwind (`sm`, `md`, `lg`); el proyecto ya usa `md:` para sidebar vs drawer en admin.

## Checklist rápido

- [ ] Colores alineados a variables / `theme.extend`
- [ ] Tipografía body/títulos respetada
- [ ] Bordes y fondos usan `border-border`, `bg-bg` o variantes secundarias
- [ ] No se mezclan dos sistemas (tokens + paleta arbitraria) en la misma vista sin motivo
