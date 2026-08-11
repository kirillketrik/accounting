"""inventory_number_to_integer

Revision ID: 37e728b7044a
Revises: 86b160e3f886
Create Date: 2026-08-10 22:29:10.853193

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37e728b7044a'
down_revision: Union[str, Sequence[str], None] = '86b160e3f886'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("assets", recreate="always") as batch_op:
        batch_op.alter_column(
            "inventory_number",
            existing_type=sa.String(length=100),
            type_=sa.Integer(),
            existing_nullable=True,
        )
    with op.batch_alter_table("asset_history", recreate="always") as batch_op:
        batch_op.alter_column(
            "inventory_number",
            existing_type=sa.String(length=100),
            type_=sa.Integer(),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("asset_history", recreate="always") as batch_op:
        batch_op.alter_column(
            "inventory_number",
            existing_type=sa.Integer(),
            type_=sa.String(length=100),
            existing_nullable=True,
        )
    with op.batch_alter_table("assets", recreate="always") as batch_op:
        batch_op.alter_column(
            "inventory_number",
            existing_type=sa.Integer(),
            type_=sa.String(length=100),
            existing_nullable=True,
        )
