"""Pedido: mesa_liberada_por_admin (salón tras pago; admin libera mesa a mano).

Revision ID: 0005_pedido_mesa_liberada_admin
Revises: 0004_mesas
Create Date: 2026-05-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_pedido_mesa_liberada_admin"
down_revision: Union[str, Sequence[str], None] = "0004_mesas"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _is_sqlite() -> bool:
    return op.get_bind().dialect.name == "sqlite"


def upgrade() -> None:
    col = sa.Column(
        "mesa_liberada_por_admin",
        sa.Boolean(),
        nullable=False,
        server_default=sa.false(),
    )
    if _is_sqlite():
        with op.batch_alter_table("pedidos") as batch:
            batch.add_column(col)
        return
    op.add_column("pedidos", col)


def downgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("pedidos") as batch:
            batch.drop_column("mesa_liberada_por_admin")
        return
    op.drop_column("pedidos", "mesa_liberada_por_admin")
