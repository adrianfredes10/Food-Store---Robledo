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

## Estado actual
- [x] us-000-setup — Archivado ✅
- [x] us-001-auth — Archivado ✅
- [x] us-002-catalogo — Archivado ✅
- [x] us-003-carrito — Archivado ✅
- [x] us-004-pedidos — Archivado ✅
- [x] us-005-pagos — Archivado ✅
- [x] us-006-direcciones — Archivado ✅
- [x] us-007-admin — Archivado ✅
