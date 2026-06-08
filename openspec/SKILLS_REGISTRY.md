# Registro de Skills — FoodStore

Trazabilidad **SDD**: qué **skills Cursor del proyecto** se usaron (o aplican) en cada change implementado.

Skills instaladas en el repo: **`.cursor/skills/`**  
Comandos asociados: **`.cursor/commands/opsx-*.md`**

> Skills **globales** de JR Stack Full (`jr-orchestrator`, `kb-creator`, …) no viven en este repo; este proyecto usa **JR Stack Lite** + skills locales listadas abajo.

---

## Catálogo de skills del proyecto

| Skill | Archivo | Cuándo activarla |
|-------|---------|------------------|
| `openspec-explore` | `.cursor/skills/openspec-explore/SKILL.md` | Antes de proponer; alcance incierto |
| `openspec-propose` | `.cursor/skills/openspec-propose/SKILL.md` | Crear `proposal.md` + `design.md` + `tasks.md` |
| `openspec-apply-change` | `.cursor/skills/openspec-apply-change/SKILL.md` | Implementar backend/frontend según `tasks.md` |
| `openspec-archive-change` | `.cursor/skills/openspec-archive-change/SKILL.md` | Archivar change y actualizar `CHANGES_MAP.md` |
| `admin-sidebar-layout` | `.cursor/skills/admin-sidebar-layout/SKILL.md` | `AdminLayout`, sidebar, drawer mobile, rutas `/admin` |
| `dashboard-crud-page` | `.cursor/skills/dashboard-crud-page/SKILL.md` | Páginas CRUD admin (tabla + modal + confirmación) |
| `tailwind-design-system` | `.cursor/skills/tailwind-design-system/SKILL.md` | Tokens, `index.css`, componentes UI y páginas públicas |

### Comandos OPSX ↔ skills

| Comando | Skill principal |
|---------|-----------------|
| `/opsx:explore` | `openspec-explore` |
| `/opsx:propose` | `openspec-propose` |
| `/opsx:apply` | `openspec-apply-change` |
| `/opsx:archive` | `openspec-archive-change` |

---

## Skills por change (trazabilidad)

| Change | Skills utilizadas | Comandos OPSX | Notas |
|--------|-------------------|---------------|-------|
| us-000-setup … us-007-admin | *(pre-registro)* | — | Changes base del TP; implementados antes del catálogo formal en `.cursor/skills/`. Metodología SDD vía `docs/` + `openspec/changes/archive/us-000-setup/`. |
| incremental-2026-mesas-docker | `dashboard-crud-page`, `admin-sidebar-layout`, `openspec-apply-change` | propose · apply | Mesas + usuarios admin + Docker; CRUD y layout admin. |
| incremental-2026-display-cocina | `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `admin-sidebar-layout`, `tailwind-design-system` | explore · propose · apply · archive | KDS `/cocina`; insumo `docs/feature-display-cocina/`. Layout cocina alineado a patrón admin. |
| incremental-2026-ux-checkout-opsx | `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `admin-sidebar-layout`, `dashboard-crud-page`, `tailwind-design-system` | propose · apply · archive | Stepper checkout, admin compacto, instalación comandos/skills OPSX faltantes. |

---

## Skills por área del código (referencia rápida)

| Área del repo | Skills |
|---------------|--------|
| `openspec/changes/*`, `CHANGES_MAP.md` | `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change` |
| `backend/app/modules/*` (API nueva) | `openspec-apply-change` |
| `frontend/src/pages/admin/*` | `admin-sidebar-layout`, `dashboard-crud-page`, `tailwind-design-system` |
| `frontend/src/pages/cocina/*` | `admin-sidebar-layout`, `tailwind-design-system` |
| `frontend/src/pages/{carrito,checkout,direcciones,mis-pedidos,pedido}/*` | `tailwind-design-system` |
| `frontend/src/shared/ui/*`, `shared/styles/index.css` | `tailwind-design-system` |

---

## Cómo actualizar este registro

Al **archivar** un change nuevo con `/opsx:archive`:

1. Agregar fila en la tabla **Skills por change**.
2. Listar skills leídas durante explore/propose/apply (las de la tabla catálogo).
3. Confirmar que `openspec/changes/archive/<slug>/tasks.md` incluye ítem de actualización de este archivo si aplica.

---

*Ver también [SDD.md](SDD.md) (metodología) y [CHANGES_MAP.md](CHANGES_MAP.md) (estado de changes).*
