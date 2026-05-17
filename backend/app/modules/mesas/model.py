from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlmodel import Field, SQLModel


def default_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Mesa(SQLModel, table=True):
    """Mesa física configurable desde el panel admin."""

    __tablename__ = "mesas"

    id: int | None = Field(default=None, primary_key=True)
    numero: int = Field(sa_column=Column(Integer, unique=True, nullable=False, index=True))
    etiqueta: str | None = Field(default=None, sa_column=Column(String(80), nullable=True))
    activa: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default="true"))
    created_at: datetime = Field(
        default_factory=default_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
