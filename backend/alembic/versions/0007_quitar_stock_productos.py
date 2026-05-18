"""Quita stock por producto: oferta vía disponible/soft-delete; inventario en ingredientes."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007_quitar_stock_productos"
down_revision = "0006_ingredientes_stock"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_productos_stock_no_negativo", "productos", type_="check")
    op.drop_column("productos", "stock_cantidad")


def downgrade() -> None:
    op.add_column(
        "productos",
        sa.Column("stock_cantidad", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_productos_stock_no_negativo",
        "productos",
        "stock_cantidad >= 0",
    )
