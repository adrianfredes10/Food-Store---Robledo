"""Códigos de rol RBAC (sin dependencias de FastAPI)."""

ROL_ADMIN = "ADMIN"
ROL_STOCK = "STOCK"
ROL_PEDIDOS = "PEDIDOS"
ROL_COCINA = "COCINA"
ROL_CLIENT = "CLIENT"

__all__ = [
    "ROL_ADMIN",
    "ROL_CLIENT",
    "ROL_COCINA",
    "ROL_PEDIDOS",
    "ROL_STOCK",
]
