from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketException, status
from sqlmodel import Session

from app.core.db import get_engine
from app.core.security.jwt_tokens import AccessTokenValidationError, decode_and_require_access_token
from app.core.uow.unit_of_work import UnitOfWork
from app.core.roles import ROL_ADMIN, ROL_COCINA, ROL_PEDIDOS
from app.deps.roles import get_user_roles, require_cocina_o_pedidos_o_admin
from app.deps.uow import get_uow
from app.modules.cocina import service as cocina_service
from app.modules.cocina.schemas import (
    CocinaPedidosResponse,
    CocinaTransicionRequest,
    CocinaTransicionResponse,
)
from app.modules.cocina.ws_manager import cocina_ws_manager
from app.modules.pedidos.exceptions import (
    ErrorDominioPedido,
    MesaOcupadaParaPedidoError,
    PedidoNoEncontradoError,
    TransicionPedidoNoAutorizadaError,
)
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/cocina", tags=["cocina"])

_ROLES_WS = frozenset({ROL_COCINA, ROL_PEDIDOS, ROL_ADMIN})


def _map_pedido_domain(exc: ErrorDominioPedido) -> HTTPException:
    if isinstance(exc, PedidoNoEncontradoError):
        return HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, TransicionPedidoNoAutorizadaError):
        return HTTPException(status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, MesaOcupadaParaPedidoError):
        return HTTPException(status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/pedidos", response_model=CocinaPedidosResponse)
def listar_pedidos_cocina(
    _: Usuario = Depends(require_cocina_o_pedidos_o_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> CocinaPedidosResponse:
    return cocina_service.listar_pedidos_cocina(uow)


@router.post("/pedidos/{pedido_id}/transicion", response_model=CocinaTransicionResponse)
def transicion_pedido_cocina(
    pedido_id: int,
    body: CocinaTransicionRequest,
    usuario: Usuario = Depends(require_cocina_o_pedidos_o_admin),
    roles: frozenset[str] = Depends(get_user_roles),
    uow: UnitOfWork = Depends(get_uow),
) -> CocinaTransicionResponse:
    try:
        return cocina_service.transicionar_pedido_cocina(
            uow,
            pedido_id,
            body.estado,
            actor_usuario_id=usuario.id,
            roles_actor=roles,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except ErrorDominioPedido as e:
        raise _map_pedido_domain(e) from e


def _roles_desde_token(token: str, uow: UnitOfWork) -> frozenset[str]:
    try:
        payload = decode_and_require_access_token(token)
        user_id = int(payload["sub"])
    except (AccessTokenValidationError, KeyError, TypeError, ValueError) as e:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Token inválido") from e
    usuario = uow.usuarios.get_by_id(user_id)
    if usuario is None or not usuario.activo:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Usuario no autorizado")
    codes = frozenset(uow.usuarios.list_codigos_roles_activos(user_id))
    if not codes & _ROLES_WS:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Rol no autorizado")
    return codes


@router.websocket("/ws")
async def cocina_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
) -> None:
    with Session(get_engine()) as session:
        uow = UnitOfWork(session)
        _roles_desde_token(token, uow)
    await cocina_ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        await cocina_ws_manager.disconnect(websocket)
