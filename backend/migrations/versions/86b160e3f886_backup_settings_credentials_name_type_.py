"""backup settings credentials, name, type; backup run settings fk

Revision ID: 86b160e3f886
Revises: 99d990050beb
Create Date: 2026-08-10 14:09:08.644324

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86b160e3f886'
down_revision: Union[str, Sequence[str], None] = '99d990050beb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('backup_runs') as batch_op:
        batch_op.add_column(sa.Column('backup_settings_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_backup_runs_backup_settings_id_backup_settings',
            'backup_settings',
            ['backup_settings_id'],
            ['id'],
            ondelete='SET NULL',
        )

    # nullable=True + server_default so the ALTER succeeds against any pre-existing row,
    # then tightened to NOT NULL once every row has a real value.
    op.add_column(
        'backup_settings',
        sa.Column('name', sa.String(length=100), nullable=True, server_default='Default'),
    )
    op.add_column(
        'backup_settings',
        sa.Column('type', sa.String(length=30), nullable=True, server_default='telegram'),
    )
    op.add_column('backup_settings', sa.Column('credentials', sa.Text(), nullable=True))

    # Carry over any existing telegram_bot_token, encrypted, into the new opaque
    # credentials column before the old column is dropped.
    from app.core.crypto import encrypt_secret

    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, telegram_bot_token FROM backup_settings WHERE telegram_bot_token IS NOT NULL")
    ).fetchall()
    for row_id, token in rows:
        conn.execute(
            sa.text("UPDATE backup_settings SET credentials = :credentials WHERE id = :id"),
            {"credentials": encrypt_secret(token), "id": row_id},
        )

    with op.batch_alter_table('backup_settings') as batch_op:
        batch_op.drop_column('telegram_bot_token')
        batch_op.alter_column('name', existing_type=sa.String(length=100), nullable=False, server_default=None)
        batch_op.alter_column('type', existing_type=sa.String(length=30), nullable=False, server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('backup_settings') as batch_op:
        batch_op.add_column(sa.Column('telegram_bot_token', sa.VARCHAR(length=300), nullable=True))
        batch_op.drop_column('credentials')
        batch_op.drop_column('type')
        batch_op.drop_column('name')

    with op.batch_alter_table('backup_runs') as batch_op:
        batch_op.drop_constraint('fk_backup_runs_backup_settings_id_backup_settings', type_='foreignkey')
        batch_op.drop_column('backup_settings_id')
