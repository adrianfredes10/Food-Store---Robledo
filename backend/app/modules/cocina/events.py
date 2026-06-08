"""Eventos WebSocket del display de cocina (KDS)."""

from __future__ import annotations

from typing import Any

from app.core.enums import EstadoPedido

PEDIDO_CONFIRMADO = "PEDIDO_CONFIRMADO"
PEDIDO_EN_PREPARACION = "PEDIDO_EN_PREPARACION"
PEDIDO_EN_CAMINO = "PEDIDO_EN_CAMINO"
PEDIDO_CANCELADO = "PEDIDO_CANCELADO"

_ESTADOS_FASE_COCINA = frozenset({EstadoPedido.CONFIRMADO, EstadoPedido.EN_PREP})


def evento_para_transicion(
    estado_anterior: EstadoPedido,
    estado_nuevo: EstadoPedido,
    *,
    pedido_id: int,
) -> dict[str, Any] | None:
    if estado_anterior == EstadoPedido.PENDIENTE and estado_nuevo == EstadoPedido.CONFIRMADO:
        return {"type": PEDIDO_CONFIRMADO, "pedido_id": pedido_id}
    if estado_anterior == EstadoPedido.CONFIRMADO and estado_nuevo == EstadoPedido.EN_PREP:
        return {"type": PEDIDO_EN_PREPARACION, "pedido_id": pedido_id}
    if estado_anterior == EstadoPedido.EN_PREP and estado_nuevo == EstadoPedido.EN_CAMINO:
        return {"type": PEDIDO_EN_CAMINO, "pedido_id": pedido_id}
    if estado_nuevo == EstadoPedido.CANCELADO and estado_anterior in _ESTADOS_FASE_COCINA:
        return {"type": PEDIDO_CANCELADO, "pedido_id": pedido_id}
    return None
