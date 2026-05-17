from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.repository.base_repository import BaseRepository
from app.modules.usuarios.model import Rol, Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Usuario)

    def list_codigos_roles_activos(self, usuario_id: int) -> set[str]:
        stmt = (
            select(Rol)
            .join(UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo)
            .where(UsuarioRol.usuario_id == usuario_id, Rol.activo == True)  # noqa: E712
        )
        return {r.codigo for r in self._session.exec(stmt).all()}

    def count_all(self) -> int:
        stmt = select(func.count()).select_from(Usuario)
        return int(self._session.exec(stmt).one())

    def list_all_ordered_desc(self, offset: int, limit: int) -> list[Usuario]:
        stmt = (
            select(Usuario)
            .order_by(col(Usuario.id).desc())
            .offset(offset)
            .limit(limit)
            .options(selectinload(Usuario.roles_vinculos).selectinload(UsuarioRol.rol))
        )
        return list(self._session.exec(stmt).all())
