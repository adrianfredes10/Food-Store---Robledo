from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.roles import (
    ROL_ADMIN,
    ROL_CLIENT,
    ROL_COCINA,
    ROL_PEDIDOS,
    ROL_STOCK,
)
from app.core.uow.unit_of_work import UnitOfWork
from app.deps.auth import get_current_user
from app.deps.uow import get_uow
from app.modules.usuarios.model import Usuario


def _codigos(uow: UnitOfWork, usuario_id: int) -> set[str]:
    return uow.usuarios.list_codigos_roles_activos(usuario_id)


def require_admin(
    user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Usuario:
    if user.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    if ROL_ADMIN not in _codigos(uow, user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Se requiere rol ADMIN")
    return user


def require_stock_o_admin(
    user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Usuario:
    if user.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    codes = _codigos(uow, user.id)
    if ROL_ADMIN not in codes and ROL_STOCK not in codes:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Se requiere rol STOCK o ADMIN")
    return user


def require_pedidos_o_admin(
    user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Usuario:
    if user.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    codes = _codigos(uow, user.id)
    if ROL_ADMIN not in codes and ROL_PEDIDOS not in codes:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Se requiere rol PEDIDOS o ADMIN")
    return user


def get_user_roles(
    user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> frozenset[str]:
    if user.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    return frozenset(_codigos(uow, user.id))


def require_cocina_o_pedidos_o_admin(
    user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Usuario:
    if user.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    codes = _codigos(uow, user.id)
    if ROL_ADMIN not in codes and ROL_PEDIDOS not in codes and ROL_COCINA not in codes:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol COCINA, PEDIDOS o ADMIN",
        )
    return user
