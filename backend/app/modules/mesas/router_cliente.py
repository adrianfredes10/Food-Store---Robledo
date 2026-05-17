"""Mesas visibles para el cliente (checkout en local)."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.uow.unit_of_work import UnitOfWork
from app.deps.auth import get_current_user
from app.deps.uow import get_uow
from app.modules.mesas import service as mesas_service
from app.modules.mesas.schemas import MesaDisponibleReservaRead
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/mesas", tags=["mesas"])


@router.get("/disponibles", response_model=list[MesaDisponibleReservaRead])
def listar_mesas_disponibles(
    usuario: Usuario = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> list[MesaDisponibleReservaRead]:
    if usuario.id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida")
    return mesas_service.listar_mesas_disponibles_para_reserva(uow)
