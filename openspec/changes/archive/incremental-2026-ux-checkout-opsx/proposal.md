# Proposal — incremental-2026-ux-checkout-opsx

## Problema

El flujo carrito → checkout → pago carecía de continuidad visual; el panel admin tenía scroll de página y modales poco compactos; faltaban comandos/skills OPSX completos en Cursor para el ciclo explore → apply → archive.

## Alcance IN

### Checkout / cliente

- **`CheckoutFlowShell`** + **`CheckoutFlowStepper`**: stepper compartido en carrito, checkout, direcciones, mis-pedidos y detalle de pedido.
- Ajustes de layout y copy en páginas públicas del funnel.

### Admin

- **`AdminLayout`**: `h-screen` + overflow controlado (tablas con scroll interno).
- Páginas CRUD admin: estructura flex compacta, menos texto decorativo.
- Modal productos más compacto; **`IOSSwitch`** donde aplica.
- Portal en modales, select acotado, confirmación logout in-app, login sin footer.

### Tooling Cursor / OPSX

- Comandos: **`opsx-explore`**, **`opsx-apply`**, **`opsx-archive`** (además de `opsx-propose`).
- Skills: **`openspec-explore`**, **`openspec-apply-change`**, **`openspec-archive-change`**.

### Integraciones

- Refinamientos **`producto_imagen_groq`** (descarga/materialización) y tests asociados.

## Alcance OUT

- Routing admin por rol STOCK/PEDIDOS (brecha US-007/US-008 sin cambiar).
- JR Stack Full / skills de fundación global.

## Historias

| Referencia | Notas |
|------------|-------|
| US-003..US-006 | Mejora UX del funnel de compra |
| US-007 | Mejora layout admin (sigue solo **ADMIN** en SPA) |

## Estado OPSX

Implementado en repo. Archivado en `openspec/changes/archive/incremental-2026-ux-checkout-opsx/`.
