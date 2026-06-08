# Design — incremental-2026-display-cocina

## Decisiones

| ID | Decisión |
|----|----------|
| D-1 | WebSocket push (`/cocina/ws?token=`) con manager en proceso (`ws_manager.py`). |
| D-2 | Cocinero: `CONFIRMADO → EN_PREPARACION` y `EN_PREPARACION → EN_CAMINO`. Sin estados nuevos. |
| D-3 | **PEDIDOS** y **ADMIN** también acceden al KDS (misma API/WS). |
| D-4 | Rol **COCINA**: solo lectura de cola + transiciones permitidas; sin CRUD de catálogo. |

## Backend

```
Router (/cocina)
  → service.listar_pedidos_cocina / transicionar_pedido_cocina
  → PedidoService.transicionar_estado (roles_actor)
  → repository.listar_para_cocina / get_para_cocina
```

- **`emit.py`**: tras transiciones relevantes, encola evento y enriquece payload con pedido serializado para WS.
- **Auth WS**: JWT access en query; roles `COCINA | PEDIDOS | ADMIN`.

## Frontend (FSD)

| Capa | Rutas / piezas |
|------|----------------|
| `pages/cocina/` | `CocinaLayout`, `CocinaPage` |
| `features/cocina/` | `useCocinaPedidos`, `useCocinaWebSocket`, UI columnas/cards |
| `shared/api/endpoints/cocina.ts` | REST + URL WS (proxy Vite `ws: true`) |

UI: tres columnas alineadas al estilo admin; badges de estado reutilizan `EstadoBadge`.

## Seed

- Rol `COCINA` en tabla `roles`.
- Usuario `cocina@foodstore.com` con contraseña `Cocina1234!`.

## Alternativas descartadas

- **SSE**: válido para v1; se mantuvo WebSocket por feature pack D-1.
- **Redis Pub/Sub**: diferido a despliegue multi-réplica.
