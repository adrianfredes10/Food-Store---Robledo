# Proposal — incremental-2026-mesas-docker

## Alcance cubierto en código

- **Pedidos**: `tipo_servicio` **DELIVERY** | **RETIRO_EN_LOCAL**; `numero_mesa`; costo de envío **50** solo en delivery (`PedidoService`).
- **Mesas**: tabla y catálogo admin (`/admin/mesas`), estado agregado, liberación administrativa; cliente **`GET /api/v1/mesas/disponibles`** autenticado.
- **Admin**: listado **`GET /api/v1/admin/usuarios`**; panel frontend **Mesas** y **Usuarios** bajo `/admin`.
- **Operaciones**: **`docker-compose.yml`**, **`DOCKER.md`**, imágenes `api`/`web` con Postgres en **5433** (host).

## Historias y trazabilidad

| Historia | Notas |
|----------|-------|
| US-004 | Extendido para retiro en local + mesa (además del envío fijo en delivery). |
| US-007 / US-008 | Extendido funcionalmente; ver brecha frontend **solo ADMIN** en `/admin`. |
| (infra) | No mapeado a una US concreta; soporte desarrollo Docker. |

## Brechas conscientes vs `docs/Historias_de_usuario.txt`

- **US-007** y **US-008** citan roles **STOCK** y **PEDIDOS**. El backend expone rutas con `require_admin` / `require_stock_o_admin` / `require_pedidos_o_admin` según módulo; el **`AdminLayout`** del frontend sólo permite rol **`ADMIN`**. Quien necesite STOCK/PEDIDOS operando igual que hoy debe usar API directa u otro flujo hasta que exista routing por rol.

## Estado OPSX

Change **implementado en el repo**. Archivar explícitamente con `/opsx:archive` si se desea mover esta carpeta a un flujo OPSX cerrado paralelo al resto de `us-*`.
