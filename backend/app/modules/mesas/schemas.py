from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MesaDisponibleReservaRead(BaseModel):
    """Mesa del catálogo habilitada y sin pedido en curso (elegible en checkout)."""

    id: int
    numero: int
    etiqueta: str | None = None


class MesaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    etiqueta: str | None
    activa: bool
    created_at: datetime


class MesaCreate(BaseModel):
    numero: int = Field(..., ge=1, le=999)
    etiqueta: str | None = Field(default=None, max_length=80)


class MesaUpdate(BaseModel):
    etiqueta: str | None = Field(default=None, max_length=80)
    activa: bool | None = None


class PedidoMesaOcupacionDTO(BaseModel):
    id: int
    estado: str
    cliente_nombre: str | None
    cliente_email: str | None


class MesaEstadoItem(BaseModel):
    mesa_id: int
    numero: int
    etiqueta: str | None
    activa: bool
    ocupada: bool
    pedido: PedidoMesaOcupacionDTO | None = None


class MesaFueraCatalogoItem(BaseModel):
    """Pedido en local con mesa activa pero sin fila en catálogo (numeración libre en checkout)."""

    numero_mesa: int
    pedido_id: int
    estado: str
    cliente_nombre: str | None
    cliente_email: str | None


class MesasEstadoResumen(BaseModel):
    total_mesas_activas: int
    ocupadas: int
    libres: int


class MesasEstadoResponse(BaseModel):
    resumen: MesasEstadoResumen
    items: list[MesaEstadoItem]
    fuera_de_catalogo: list[MesaFueraCatalogoItem]
