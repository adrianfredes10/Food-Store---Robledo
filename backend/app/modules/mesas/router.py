from fastapi import APIRouter, Depends, status

from app.core.uow.unit_of_work import UnitOfWork
from app.deps.uow import get_uow
from app.deps.roles import require_admin
from app.modules.mesas import service as mesas_service
from app.modules.mesas.schemas import MesaCreate, MesaRead, MesaUpdate, MesasEstadoResponse
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/admin/mesas", tags=["admin"])


@router.get("/estado", response_model=MesasEstadoResponse)
def admin_mesas_estado(
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> MesasEstadoResponse:
    return mesas_service.obtener_estado_mesas(uow)


@router.get("", response_model=list[MesaRead])
def admin_listar_mesas(
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> list[MesaRead]:
    return mesas_service.listar_mesas(uow)


@router.post("", response_model=MesaRead, status_code=status.HTTP_201_CREATED)
def admin_crear_mesa(
    body: MesaCreate,
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> MesaRead:
    return mesas_service.crear_mesa(uow, body)


@router.patch("/{mesa_id}", response_model=MesaRead)
def admin_actualizar_mesa(
    mesa_id: int,
    body: MesaUpdate,
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> MesaRead:
    return mesas_service.actualizar_mesa(uow, mesa_id, body)


@router.delete("/{mesa_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_eliminar_mesa(
    mesa_id: int,
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    mesas_service.eliminar_mesa(uow, mesa_id)


@router.post("/{mesa_id}/liberar", status_code=status.HTTP_204_NO_CONTENT)
def admin_liberar_mesa_salon(
    mesa_id: int,
    _: Usuario = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    mesas_service.liberar_mesa_salon_admin(uow, mesa_id)
