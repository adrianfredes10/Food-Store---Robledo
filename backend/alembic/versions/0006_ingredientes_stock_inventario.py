"""Stock de inventario por ingrediente (Numeric), p. ej. huevos comprados vs consumidos por recetas."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0006_ingredientes_stock"
down_revision = "0005_pedido_mesa_liberada_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ingredientes",
        sa.Column("stock_cantidad", sa.Numeric(12, 3), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_ingredientes_stock_no_negativo",
        "ingredientes",
        "stock_cantidad >= 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_ingredientes_stock_no_negativo", "ingredientes", type_="check")
    op.drop_column("ingredientes", "stock_cantidad")
