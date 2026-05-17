"""Tabla mesas — catálogo físico del local (panel admin).

Revision ID: 0004_mesas
Revises: 0003_pedido_tipo_servicio_mesa
Create Date: 2026-05-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_mesas"
down_revision: Union[str, Sequence[str], None] = "0003_pedido_tipo_servicio_mesa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mesas",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("numero", sa.Integer(), nullable=False),
        sa.Column("etiqueta", sa.String(length=80), nullable=True),
        sa.Column("activa", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_mesas_numero", "mesas", ["numero"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_mesas_numero", table_name="mesas")
    op.drop_table("mesas")
