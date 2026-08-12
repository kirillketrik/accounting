"""drop default asset type from app settings

Revision ID: 2510efebe2bb
Revises: a1f3c9d4e2b7
Create Date: 2026-08-12 00:16:15.542511

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2510efebe2bb'
down_revision: Union[str, Sequence[str], None] = 'a1f3c9d4e2b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # The original FK (d33e6e6af02b) was declared inline with no name, so batch mode
    # must recreate the table rather than drop_constraint by name.
    with op.batch_alter_table('app_settings', recreate='always') as batch_op:
        batch_op.drop_column('default_asset_type_id')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('app_settings', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('default_asset_type_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(
            'fk_app_settings_default_asset_type_id_asset_types',
            'asset_types',
            ['default_asset_type_id'],
            ['id'],
            ondelete='SET NULL',
        )
