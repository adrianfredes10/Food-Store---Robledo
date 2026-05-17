from sqlmodel import Session, col, select

from app.core.repository.base_repository import BaseRepository
from app.modules.mesas.model import Mesa


class MesaRepository(BaseRepository[Mesa]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Mesa)

    def list_all_ordered(self) -> list[Mesa]:
        stmt = select(Mesa).order_by(col(Mesa.numero).asc())
        return list(self._session.exec(stmt).all())

    def get_by_numero(self, numero: int) -> Mesa | None:
        stmt = select(Mesa).where(Mesa.numero == numero)
        return self._session.exec(stmt).first()
