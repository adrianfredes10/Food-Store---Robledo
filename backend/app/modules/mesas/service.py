from __future__ import annotations

from fastapi import HTTPException, status

from app.modules.mesas.model import Mesa
from app.modules.mesas.schemas import (
    MesaCreate,
    MesaDisponibleReservaRead,
    MesaEstadoItem,
    MesaFueraCatalogoItem,
    MesaRead,
    MesaUpdate,
    MesasEstadoResumen,
    MesasEstadoResponse,
    PedidoMesaOcupacionDTO,
)
from app.modules.pedidos.model import Pedido


def _cliente_pedido(p: Pedido) -> tuple[str | None, str | None]:
    u = p.usuario
    if u is None:
        return None, None
    parts = [u.nombre.strip()]
    if u.apellido and str(u.apellido).strip():
        parts.append(str(u.apellido).strip())
    return " ".join(parts), u.email


def listar_mesas_disponibles_para_reserva(uow) -> list[MesaDisponibleReservaRead]:
    """Mesas activas sin pedido **pagado** que las retenga en salón (ver ``map_ocupacion_...``)."""
    ocupacion = uow.pedidos.map_ocupacion_por_numero_mesa_local()
    mesas = uow.mesas.list_all_ordered()
    out: list[MesaDisponibleReservaRead] = []
    for m in mesas:
        if not m.activa:
            continue
        if m.numero in ocupacion:
            continue
        assert m.id is not None
        out.append(MesaDisponibleReservaRead(id=m.id, numero=m.numero, etiqueta=m.etiqueta))
    return out


def listar_mesas(uow) -> list[MesaRead]:
    rows = uow.mesas.list_all_ordered()
    return [MesaRead.model_validate(m) for m in rows]


def crear_mesa(uow, body: MesaCreate) -> MesaRead:
    if uow.mesas.get_by_numero(body.numero) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe la mesa número {body.numero}.",
        )
    m = Mesa(numero=body.numero, etiqueta=body.etiqueta, activa=True)
    uow.session.add(m)
    uow.flush()
    assert m.id is not None
    return MesaRead.model_validate(m)


def actualizar_mesa(uow, mesa_id: int, body: MesaUpdate) -> MesaRead:
    m = uow.mesas.get_by_id(mesa_id)
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa no encontrada.")
    if body.etiqueta is not None:
        m.etiqueta = body.etiqueta.strip() or None
    if body.activa is not None:
        m.activa = body.activa
    uow.session.add(m)
    uow.flush()
    return MesaRead.model_validate(m)


def eliminar_mesa(uow, mesa_id: int) -> None:
    m = uow.mesas.get_by_id(mesa_id)
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa no encontrada.")
    uow.session.delete(m)


def liberar_mesa_salon_admin(uow, mesa_id: int) -> None:
    """Marca la ocupación de salón como cerrada para el pedido que hoy bloquea esa mesa (si hay)."""
    m = uow.mesas.get_by_id(mesa_id)
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mesa no encontrada.")
    ocupacion = uow.pedidos.map_ocupacion_por_numero_mesa_local()
    pedido = ocupacion.get(m.numero)
    if pedido is None or pedido.id is None:
        return
    row = uow.pedidos.get_by_id(pedido.id)
    if row is None:
        return
    row.mesa_liberada_por_admin = True
    uow.session.add(row)
    uow.flush()


def obtener_estado_mesas(uow) -> MesasEstadoResponse:
    ocupacion_por_numero = uow.pedidos.map_ocupacion_por_numero_mesa_local()
    mesas = uow.mesas.list_all_ordered()
    numeros_en_catalogo = {m.numero for m in mesas}

    items: list[MesaEstadoItem] = []
    activas = [m for m in mesas if m.activa]
    ocupadas_en_catalogo = 0

    for m in mesas:
        assert m.id is not None
        pedido = ocupacion_por_numero.get(m.numero) if m.activa else None
        ocupada = pedido is not None
        if m.activa and ocupada:
            ocupadas_en_catalogo += 1
        ped_dto = None
        if pedido is not None and pedido.id is not None:
            nom, em = _cliente_pedido(pedido)
            ped_dto = PedidoMesaOcupacionDTO(
                id=pedido.id,
                estado=pedido.estado.value,
                cliente_nombre=nom,
                cliente_email=em,
            )
        items.append(
            MesaEstadoItem(
                mesa_id=m.id,
                numero=m.numero,
                etiqueta=m.etiqueta,
                activa=m.activa,
                ocupada=ocupada,
                pedido=ped_dto,
            ),
        )

    fuera: list[MesaFueraCatalogoItem] = []
    for num, pedido in sorted(ocupacion_por_numero.items(), key=lambda x: x[0]):
        if num in numeros_en_catalogo:
            continue
        if pedido.id is None:
            continue
        nom, em = _cliente_pedido(pedido)
        fuera.append(
            MesaFueraCatalogoItem(
                numero_mesa=num,
                pedido_id=pedido.id,
                estado=pedido.estado.value,
                cliente_nombre=nom,
                cliente_email=em,
            ),
        )

    total_activas = len(activas)
    libres = total_activas - ocupadas_en_catalogo
    resumen = MesasEstadoResumen(
        total_mesas_activas=total_activas,
        ocupadas=ocupadas_en_catalogo,
        libres=max(0, libres),
    )
    return MesasEstadoResponse(resumen=resumen, items=items, fuera_de_catalogo=fuera)
