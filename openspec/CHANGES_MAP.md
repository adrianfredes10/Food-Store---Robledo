# Mapa de Changes — FoodStore

**Metodología:** [SDD.md](SDD.md) · **Skills por change:** [SKILLS_REGISTRY.md](SKILLS_REGISTRY.md)

## Orden de implementación

| Change | Funcionalidad | Historias | Depende de | Skills (ver registro) |
|--------|--------------|-----------|------------|------------------------|
| us-000-setup | Setup inicial y arquitectura base | Todas | — | pre-registro |
| us-001-auth | Login, registro, JWT, refresh token | US-001 | us-000-setup | pre-registro |
| us-002-catalogo | Categorías, Ingredientes, Productos | US-002, US-007 | us-001-auth | pre-registro |
| us-003-carrito | Carrito con personalización | US-003 | us-002-catalogo | pre-registro |
| us-004-pedidos | Crear pedido, FSM de estados | US-004, US-006, US-008 | us-003-carrito | pre-registro |
| us-005-pagos | MercadoPago, webhook, confirmación | US-005 | us-004-pedidos | pre-registro |
| us-006-direcciones | CRUD direcciones, marcar principal | US-009 | us-001-auth | pre-registro |
| us-007-admin | Panel admin completo | US-007, US-008 | us-002-catalogo | pre-registro |
| incremental-2026-mesas-docker | Mesas (catálogo + salón), retiro en local en pedidos, admin usuarios, stack Docker dev | Extensión US-004/US-007 | us-007-admin | `dashboard-crud-page`, `admin-sidebar-layout`, `openspec-apply-change` |
| incremental-2026-display-cocina | KDS `/cocina`, rol COCINA, WebSocket, transiciones cocina en FSM | US-COCINA-01..09 (`docs/feature-display-cocina/`) | us-004-pedidos, us-005-pagos | `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `admin-sidebar-layout`, `tailwind-design-system` |
| incremental-2026-ux-checkout-opsx | Stepper checkout, admin layout compacto, comandos/skills OPSX Cursor, Groq imagen | Extensión UX US-003..US-007 | us-007-admin | `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `admin-sidebar-layout`, `dashboard-crud-page`, `tailwind-design-system` |

## Estado actual

- [x] us-000-setup — Archivado ✅
- [x] us-001-auth — Archivado ✅
- [x] us-002-catalogo — Archivado ✅
- [x] us-003-carrito — Archivado ✅
- [x] us-004-pedidos — Archivado ✅
- [x] us-005-pagos — Archivado ✅
- [x] us-006-direcciones — Archivado ✅
- [x] us-007-admin — Archivado ✅
- [x] incremental-2026-mesas-docker — Archivado ✅ · `openspec/changes/archive/incremental-2026-mesas-docker/`
- [x] incremental-2026-display-cocina — Archivado ✅ · `openspec/changes/archive/incremental-2026-display-cocina/`
- [x] incremental-2026-ux-checkout-opsx — Archivado ✅ · `openspec/changes/archive/incremental-2026-ux-checkout-opsx/`

## Verificación frente a `docs/` (última revisión manual/agente)

Eje **implementación ↔ historias**:

| US / pack | Estado | Observación breve |
|-----------|--------|---------------------|
| US-001 Auth | ✅ | JWT, refresh en BD; tests `test_auth_completo.py`. |
| US-002 Catálogo | ✅ | Productos categoría/búsqueda en API + UI catálogo. |
| US-003 Carrito | ✅ | Zustand + persistencia; personalización ítems; stepper en funnel. |
| US-004 Pedidos | ✅ | Snapshot, stock validado en servicio; envío variable (50 delivery / 0 local). |
| US-005 Pagos | ✅ | Checkout + webhook; mock `MERCADOPAGO_MOCK`; tests `test_pagos.py`. |
| US-006 Mis pedidos | ✅ | Lista + historial + polling ~30 s (`usePedidoDetalle` hasta terminal). |
| US-007 Catálogo admin | ⚠️ | CRUD existe; **`/admin` solo rol ADMIN UI** — STOCK no entra al panel como en la redacción de la historia. |
| US-008 Pedidos admin | ⚠️ | FSM/historial en admin; mismo gap **solo ADMIN** en SPA. |
| US-009 Direcciones | ✅ | CRUD + principal + uso en checkout. |
| US-COCINA (pack) | ✅ | KDS `/cocina`, rol COCINA, WS, transiciones; tests `test_cocina.py`. Despacho `EN_CAMINO→ENTREGADO` sigue en PEDIDOS/ADMIN. |

**Automatizado (última corrida CI local):**

| Verificación | Comando | Resultado esperado |
|--------------|---------|-------------------|
| Backend | `cd backend` · `$env:PYTEST_DISABLE_RATE_LIMIT=1` · **`pytest`** | **≥ 91 passed**, cobertura ≥ 60 % |
| Frontend | **`cd frontend && npm ci && npm run build`** | `tsc` + `vite build` sin errores |
| Compose (opc.) | **`docker compose up -d`** y `GET /health` | `{"status":"ok"}` |

### Pruebas por change (tracé a `backend/tests`)

| Change | Evidencia principal en tests |
|--------|-------------------------------|
| us-000-setup | `test_health.py`, `test_domain_enums.py`, `conftest` (app + SQLite) |
| us-001-auth | `test_auth_completo.py`, `test_auth.py` |
| us-002-catalogo | `test_categorias.py`, `test_ingredientes.py`, `test_productos.py` |
| us-003-carrito | cubierto vía creación de pedidos + estado Zustand no unit-test repo aislado |
| us-004-pedidos | `test_pedidos_fsm.py`, `test_pedidos_cliente_api.py` (retiro/local, mesas disponibles) |
| us-005-pagos | `test_pagos.py` |
| us-006-direcciones | `test_direcciones.py` |
| us-007-admin | `test_admin_api.py`, transiciones/admin en `test_pedidos_fsm.py` |
| incremental-2026-mesas-docker | `test_admin_api.py` (mesas), `test_pedidos_*` + `test_pagos.py`; `GET /mesas/disponibles` |
| incremental-2026-display-cocina | `test_cocina.py` (listado, RBAC, transiciones, eventos WS) |
| incremental-2026-ux-checkout-opsx | sin tests backend dedicados; verificación `npm run build` + UI manual |

### Metodología SDD y tooling Cursor

| Artefacto | Ubicación |
|-----------|-----------|
| Metodología SDD | [openspec/SDD.md](SDD.md) |
| Registro de skills | [openspec/SKILLS_REGISTRY.md](SKILLS_REGISTRY.md) |
| Índice skills | [.cursor/skills/README.md](../.cursor/skills/README.md) |
| Comandos OPSX | `.cursor/commands/opsx-{explore,propose,apply,archive}.md` |
| Skills | `.cursor/skills/` (7 skills — ver registro) |
