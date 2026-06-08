from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CocinaDetalleLinea(BaseModel):
    nombre_producto: str
    cantidad: int
    personalizacion: list[int] | None = None


class CocinaPedidoItem(BaseModel):
    id: int
    estado: str
    tipo_servicio: str
    numero_mesa: int | None = None
    observaciones_cliente: str | None = None
    confirmado_en: datetime
    total: Decimal
    detalles: list[CocinaDetalleLinea] = Field(default_factory=list)


class CocinaPedidosResponse(BaseModel):
    items: list[CocinaPedidoItem]


class CocinaTransicionRequest(BaseModel):
    estado: str = Field(..., description="Código de estado destino (EN_PREP, EN_CAMINO, etc.)")


class CocinaTransicionResponse(BaseModel):
    id: int
    estado: str
