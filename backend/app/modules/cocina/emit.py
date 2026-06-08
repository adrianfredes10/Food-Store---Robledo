"""Emisión best-effort de eventos WS tras commit de la UoW."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from app.modules.cocina.events import PEDIDO_CONFIRMADO, PEDIDO_EN_CAMINO, PEDIDO_EN_PREPARACION
from app.modules.cocina.service import cocina_pedido_dict_for_ws
from app.modules.cocina.ws_manager import cocina_ws_manager

if TYPE_CHECKING:
    from app.core.uow.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)

_EVENTOS_CON_PEDIDO = frozenset({PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION, PEDIDO_EN_CAMINO})


def enrich_cocina_events_for_broadcast(
    uow: UnitOfWork,
    events: list[dict[str, object]],
) -> list[dict[str, Any]]:
    """Normaliza `type` y adjunta `pedido` completo para eventos que lo requieren."""
    enriched: list[dict[str, Any]] = []
    for raw in events:
        payload: dict[str, Any] = dict(raw)
        if "event" in payload and "type" not in payload:
            payload["type"] = payload.pop("event")
        evt_type = payload.get("type")
        pedido_id = payload.get("pedido_id")
        if evt_type in _EVENTOS_CON_PEDIDO and isinstance(pedido_id, int):
            pedido = cocina_pedido_dict_for_ws(uow, pedido_id)
            if pedido is not None:
                payload["pedido"] = pedido
        enriched.append(payload)
    return enriched


async def _broadcast_all(payloads: list[dict[str, Any]]) -> None:
    await cocina_ws_manager.broadcast_many(payloads)


def emit_cocina_events_after_commit(events: list[dict[str, Any]]) -> None:
    if not events:
        return
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            asyncio.run(_broadcast_all(events))
        except Exception:
            logger.exception("No se pudieron emitir eventos de cocina (sin loop)")
        return
    loop.create_task(_broadcast_all(events))
