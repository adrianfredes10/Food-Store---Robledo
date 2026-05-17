"""Pedido: tipo_servicio (DELIVERY | RETIRO_EN_LOCAL) y numero_mesa.

Revision ID: 0003_pedido_tipo_servicio_mesa
Revises: 0002_pedido_snapshot
Create Date: 2026-05-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_pedido_tipo_servicio_mesa"
down_revision: Union[str, Sequence[str], None] = "0002_pedido_snapshot"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_sqlite() -> bool:
    return op.get_bind().dialect.name == "sqlite"


def upgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("pedidos") as batch:
            batch.add_column(
                sa.Column(
                    "tipo_servicio",
                    sa.String(32),
                    nullable=False,
                    server_default="DELIVERY",
                ),
            )
            batch.add_column(sa.Column("numero_mesa", sa.Integer(), nullable=True))
        return

    op.add_column(
        "pedidos",
        sa.Column("tipo_servicio", sa.String(32), nullable=False, server_default="DELIVERY"),
    )
    op.add_column("pedidos", sa.Column("numero_mesa", sa.Integer(), nullable=True))


def downgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("pedidos") as batch:
            batch.drop_column("numero_mesa")
            batch.drop_column("tipo_servicio")
        return

    op.drop_column("pedidos", "numero_mesa")
    op.drop_column("pedidos", "tipo_servicio")
