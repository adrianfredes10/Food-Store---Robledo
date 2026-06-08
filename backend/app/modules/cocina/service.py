"""Servicio del display de cocina (KDS)."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.core.enums import EstadoPedido
from app.modules.cocina.schemas import (
    CocinaDetalleLinea,
    CocinaPedidoItem,
    CocinaPedidosResponse,
    CocinaTransicionResponse,
)
from app.modules.pedidos.model import DetallePedido, Pedido
from app.modules.pedidos.service import PedidoService

if TYPE_CHECKING:
    from app.core.uow.unit_of_work import UnitOfWork


def _map_detalle(d: DetallePedido) -> CocinaDetalleLinea:
    return CocinaDetalleLinea(
        nombre_producto=d.nombre_producto,
        cantidad=d.cantidad,
        personalizacion=d.personalizacion,
    )


def _map_pedido(p: Pedido, confirmado_en) -> CocinaPedidoItem:
    assert p.id is not None
    detalles = [_map_detalle(d) for d in (p.detalles or [])]
    return CocinaPedidoItem(
        id=p.id,
        estado=p.estado.value,
        tipo_servicio=p.tipo_servicio.value,
        numero_mesa=p.numero_mesa,
        observaciones_cliente=p.observaciones_cliente,
        confirmado_en=confirmado_en,
        total=p.total,
        detalles=detalles,
    )


def cocina_pedido_dict_for_ws(uow: UnitOfWork, pedido_id: int) -> dict[str, Any] | None:
    """Serializa un pedido KDS para payloads WebSocket (mismo shape que REST)."""
    row = uow.pedidos.get_para_cocina(pedido_id)
    if row is None:
        return None
    pedido, confirmado_en = row
    return _map_pedido(pedido, confirmado_en).model_dump(mode="json")


def listar_pedidos_cocina(uow: UnitOfWork) -> CocinaPedidosResponse:
    rows = uow.pedidos.listar_para_cocina()
    items = [_map_pedido(p, confirmado_en) for p, confirmado_en in rows]
    return CocinaPedidosResponse(items=items)


def transicionar_pedido_cocina(
    uow: UnitOfWork,
    pedido_id: int,
    estado_str: str,
    *,
    actor_usuario_id: int | None,
    roles_actor: frozenset[str],
) -> CocinaTransicionResponse:
    try:
        nuevo = EstadoPedido(estado_str.strip())
    except ValueError as e:
        raise ValueError(f"Estado de pedido inválido: {estado_str!r}") from e
    svc = PedidoService()
    pedido = svc.transicionar_estado(
        uow,
        pedido_id,
        nuevo,
        actor_usuario_id=actor_usuario_id,
        roles_actor=roles_actor,
    )
    assert pedido.id is not None
    return CocinaTransicionResponse(id=pedido.id, estado=pedido.estado.value)
