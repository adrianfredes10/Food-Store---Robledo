# Mapa de Changes — FoodStore

## Orden de implementación

| Change | Funcionalidad | Historias | Depende de |
|--------|--------------|-----------|------------|
| us-000-setup | Setup inicial y arquitectura base | Todas | — |
| us-001-auth | Login, registro, JWT, refresh token | US-001 | us-000-setup |
| us-002-catalogo | Categorías, Ingredientes, Productos | US-002, US-007 | us-001-auth |
| us-003-carrito | Carrito con personalización | US-003 | us-002-catalogo |
| us-004-pedidos | Crear pedido, FSM de estados | US-004, US-006, US-008 | us-003-carrito |
| us-005-pagos | MercadoPago, webhook, confirmación | US-005 | us-004-pedidos |
| us-006-direcciones | CRUD direcciones, marcar principal | US-009 | us-001-auth |
| us-007-admin | Panel admin completo | US-007, US-008 | us-002-catalogo |
| incremental-2026-mesas-docker | Mesas (catálogo + salón), retiro en local en pedidos, admin usuarios, stack Docker dev | Extensión US-004/US-007 | us-007-admin |

## Estado actual
- [x] us-000-setup — Archivado ✅
- [x] us-001-auth — Archivado ✅
- [x] us-002-catalogo — Archivado ✅
- [x] us-003-carrito — Archivado ✅
- [x] us-004-pedidos — Archivado ✅
- [x] us-005-pagos — Archivado ✅
- [x] us-006-direcciones — Archivado ✅
- [x] us-007-admin — Archivado ✅
- [x] incremental-2026-mesas-docker — Implementado en repo ✅ · artefactos en `openspec/changes/archive/incremental-2026-mesas-docker/` (proposal)

## Verificación frente a `docs/` (última revisión manual/agente)

Eje **implementación ↔ historias**:

| US | Estado | Observación breve |
|----|--------|---------------------|
| US-001 Auth | ✅ | JWT, refresh en BD; tests `test_auth_completo.py`. |
| US-002 Catálogo | ✅ | Productos categoría/búsqueda en API + UI catálogo. |
| US-003 Carrito | ✅ | Zustand + persistencia; personalización ítems. |
| US-004 Pedidos | ✅ | Snapshot, stock validado en servicio; envío variable (50 delivery / 0 local). |
| US-005 Pagos | ✅ | Checkout + webhook; mock `MERCADOPAGO_MOCK`; tests `test_pagos.py`. |
| US-006 Mis pedidos | ✅ | Lista + historial + **polling ~30 s** (`usePedidoDetalle` hasta terminal). |
| US-007 Catálogo admin | ⚠️ | CRUD existe; **`/admin` solo rol ADMIN UI** — STOCK no entra al panel como en la redacción de la historia. |
| US-008 Pedidos admin | ⚠️ | FSM/historial en admin; mismo gap **solo ADMIN** en SPA. |
| US-009 Direcciones | ✅ | CRUD + principal + uso en checkout. |

**Automatizado (última corrida CI local):**

| Verificación | Comando | Resultado esperado |
|--------------|---------|-------------------|
| Backend | `cd backend && set PYTEST_DISABLE_RATE_LIMIT=1` (PowerShell: `$env:...=1`) luego **`pytest`** | **82 passed**, cobertura ≥ 60 % |
| Frontend | **`cd frontend && npm ci && npm run build`** | `tsc` + `vite build` sin errores |
| Compose (opc.) | **`docker compose up -d`** y `GET /health` | `{"status":"ok"}` |

### Pruebas por change (tracé a `backend/tests`)

| Change | Evidencia principal en tests |
|--------|-------------------------------|
| us-000-setup | `test_health.py`, `test_domain_enums.py`, `conftest` (app + SQLite) |
| us-001-auth | `test_auth_completo.py`, `test_auth.py` |
| us-002-catalogo | `test_categorias.py`, `test_ingredientes.py`, `test_productos.py` |
| us-003-carrito | cubierto vía creación de pedidos + estado Zustand no unit-test repo aislado |
| us-004-pedidos | `test_pedidos_fsm.py`, `test_pedidos_cliente_api.py` (incluye retiro/local y **mesas disponibles**) |
| us-005-pagos | `test_pagos.py` |
| us-006-direcciones | `test_direcciones.py` |
| us-007-admin | `test_admin_api.py`, transiciones/admin en `test_pedidos_fsm.py` |
| incremental-2026-mesas-docker | `test_admin_api.py` (mesas CRUD/ocupación), `test_pedidos_*` + `test_pagos.py`; endpoint cliente `GET /mesas/disponibles` en `test_pedidos_cliente_api.py` |
