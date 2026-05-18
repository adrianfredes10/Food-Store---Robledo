from pydantic import BaseModel, Field
from decimal import Decimal


class ProductoIngredienteEntrada(BaseModel):
    ingrediente_id: int = Field(ge=1)
    cantidad: Decimal = Field(gt=0, max_digits=10, decimal_places=3)
    es_removible: bool = True


class ProductoIngredienteSalida(BaseModel):
    ingrediente_id: int
    nombre: str
    es_alergeno: bool
    cantidad: Decimal
    es_removible: bool


class ProductoCreate(BaseModel):
    categoria_id: int = Field(ge=1)
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = Field(default=None, max_length=10_000)
    precio: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    sku: str | None = Field(default=None, max_length=64)
    imagen_url: str | None = Field(default=None, max_length=2048)
    activo: bool = True
    disponible: bool = True
    ingredientes: list[ProductoIngredienteEntrada] = Field(default_factory=list)


class ProductoUpdate(BaseModel):
    categoria_id: int | None = Field(default=None, ge=1)
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    descripcion: str | None = None
    precio: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    sku: str | None = Field(default=None, max_length=64)
    imagen_url: str | None = Field(default=None, max_length=2048)
    activo: bool | None = None
    disponible: bool | None = None
    ingredientes: list[ProductoIngredienteEntrada] | None = None


class ProductoRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None
    precio: Decimal
    sku: str | None
    imagen_url: str | None
    activo: bool
    disponible: bool
    ingredientes: list[ProductoIngredienteSalida]


class ProductoListadoItem(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None
    precio: Decimal
    disponible: bool
    sku: str | None
    imagen_url: str | None
    ingredientes: list[ProductoIngredienteSalida] = Field(default_factory=list)


class PaginaProductos(BaseModel):
    items: list[ProductoListadoItem]
    total: int
    page: int
    size: int
    pages: int
