from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


# lo que manda el cliente al crear
class IngredienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=160)
    unidad: str | None = Field(default=None, max_length=32)
    es_alergeno: bool = False
    stock_cantidad: Decimal | None = Field(default=None, ge=0)


class IngredienteUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=160)
    unidad: str | None = None
    es_alergeno: bool | None = None


class IngredienteStockMutation(BaseModel):
    """Exactamente uno de los dos: fijar inventario o sumar/restar (compra, merma)."""

    stock_cantidad: Decimal | None = Field(default=None, ge=0)
    incremento: Decimal | None = None

    @model_validator(mode="after")
    def uno_solo(self):
        a = self.stock_cantidad is not None
        b = self.incremento is not None
        if a == b:  # ambos True o ambos False
            raise ValueError("Indicá exactamente uno: stock_cantidad (valor absoluto) o incremento (suma al stock)")
        return self


# lo que devuelve la api
class IngredienteRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    nombre: str
    unidad: str | None
    es_alergeno: bool
    stock_cantidad: Decimal


class PaginaIngredientes(BaseModel):
    items: list[IngredienteRead]
    total: int
    page: int
    size: int
    pages: int
