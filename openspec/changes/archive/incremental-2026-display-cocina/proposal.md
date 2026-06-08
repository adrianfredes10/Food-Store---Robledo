# Proposal — incremental-2026-display-cocina

## Problema

Food Store tenía FSM de pedidos y panel admin, pero **no** pantalla de cocina ni rol operativo para preparación. El gestor de pedidos absorbía todo el flujo post-pago.

## Alcance IN

- Rol **`COCINA`** en seed y RBAC (`app/core/roles.py`, `require_cocina_o_pedidos_o_admin`).
- Usuario seed: `cocina@foodstore.com` / `Cocina1234!`.
- Módulo **`app/modules/cocina/`**: listado KDS, transiciones autorizadas, WebSocket `/api/v1/cocina/ws` (pub/sub en proceso).
- Listado incluye pedidos en **CONFIRMADO**, **EN_PREPARACION** y **EN_CAMINO** (`listar_para_cocina`).
- Eventos WS enriquecidos al confirmar / transicionar (`emit.py`, integración en `PedidoService`).
- Frontend **`/cocina`**: layout dedicado, 3 columnas (pendiente / en preparación / finalizado), cards y hook WS.
- Login redirige rol **COCINA** a `/cocina`.
- Tests **`backend/tests/test_cocina.py`** (REST, RBAC, cola de eventos, enrich WS).
- Feature pack de dominio en **`docs/feature-display-cocina/`** (insumo SDD, no código).

## Alcance OUT

- Estado intermedio `LISTO` / estaciones de cocina (BAR, GRILL).
- Redis / multi-instancia para WS (documentado como límite v1).
- Despacho `EN_CAMINO → ENTREGADO` (sigue en **PEDIDOS** / **ADMIN**).

## Historias

| Referencia | Cobertura |
|------------|-----------|
| `docs/feature-display-cocina/03_historias_de_usuario.md` | US-COCINA-01..09 (KDS, transiciones, tiempo real) |
| US-004 / US-005 | Entrada a cola vía `PENDIENTE → CONFIRMADO` (pago) |

## Dependencias

- us-004-pedidos (FSM, historial)
- us-005-pagos (confirmación post-pago)

## Riesgos / límites

- WebSocket single-instance: sin bus externo entre réplicas de API.
- `EN_PREPARACION → EN_CAMINO` mezcla “listo” y “salió” (aceptable v1 según feature pack).

## Estado OPSX

Implementado en repo. Archivado en `openspec/changes/archive/incremental-2026-display-cocina/`.
