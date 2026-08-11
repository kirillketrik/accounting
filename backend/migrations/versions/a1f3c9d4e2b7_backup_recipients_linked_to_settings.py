"""backup recipients linked to settings, chat_id to recipient_identifier

Revision ID: a1f3c9d4e2b7
Revises: 37e728b7044a
Create Date: 2026-08-10 23:00:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f3c9d4e2b7'
down_revision: Union[str, Sequence[str], None] = '37e728b7044a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    op.drop_index(op.f('ix_backup_recipients_chat_id'), table_name='backup_recipients')
    op.add_column('backup_recipients', sa.Column('backup_settings_id', sa.Integer(), nullable=True))

    # Recipients used to be global; link them all to the first configured
    # destination (or drop them if none exists — they can't function without one).
    first_settings_id = bind.execute(sa.text('SELECT id FROM backup_settings ORDER BY id LIMIT 1')).scalar()
    if first_settings_id is not None:
        bind.execute(
            sa.text('UPDATE backup_recipients SET backup_settings_id = :sid'), {'sid': first_settings_id}
        )
    else:
        bind.execute(sa.text('DELETE FROM backup_recipients'))

    with op.batch_alter_table('backup_recipients', recreate='always') as batch_op:
        batch_op.alter_column(
            'chat_id',
            new_column_name='recipient_identifier',
            existing_type=sa.String(length=64),
            type_=sa.Text(),
            existing_nullable=False,
        )
        batch_op.alter_column('backup_settings_id', existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table('backup_recipients', recreate='always') as batch_op:
        batch_op.create_foreign_key(
            'fk_backup_recipients_backup_settings_id',
            'backup_settings',
            ['backup_settings_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_unique_constraint(
            'uq_backup_recipients_settings_identifier',
            ['backup_settings_id', 'recipient_identifier'],
        )

    # Existing backup_runs.delivery_details rows store {"chat_id": ...} entries —
    # rewrite the key so BackupRunRead (which now expects "recipient_identifier")
    # can still validate them.
    rows = bind.execute(sa.text('SELECT id, delivery_details FROM backup_runs')).fetchall()
    for row_id, details_raw in rows:
        if not details_raw:
            continue
        details = json.loads(details_raw) if isinstance(details_raw, str) else details_raw
        if not details:
            continue
        changed = False
        for entry in details:
            if isinstance(entry, dict) and 'chat_id' in entry:
                entry['recipient_identifier'] = entry.pop('chat_id')
                changed = True
        if changed:
            bind.execute(
                sa.text('UPDATE backup_runs SET delivery_details = :details WHERE id = :id'),
                {'details': json.dumps(details), 'id': row_id},
            )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()

    rows = bind.execute(sa.text('SELECT id, delivery_details FROM backup_runs')).fetchall()
    for row_id, details_raw in rows:
        if not details_raw:
            continue
        details = json.loads(details_raw) if isinstance(details_raw, str) else details_raw
        if not details:
            continue
        changed = False
        for entry in details:
            if isinstance(entry, dict) and 'recipient_identifier' in entry:
                entry['chat_id'] = entry.pop('recipient_identifier')
                changed = True
        if changed:
            bind.execute(
                sa.text('UPDATE backup_runs SET delivery_details = :details WHERE id = :id'),
                {'details': json.dumps(details), 'id': row_id},
            )

    with op.batch_alter_table('backup_recipients', recreate='always') as batch_op:
        batch_op.drop_constraint('uq_backup_recipients_settings_identifier', type_='unique')
        batch_op.drop_constraint('fk_backup_recipients_backup_settings_id', type_='foreignkey')

    with op.batch_alter_table('backup_recipients', recreate='always') as batch_op:
        batch_op.alter_column(
            'recipient_identifier',
            new_column_name='chat_id',
            existing_type=sa.Text(),
            type_=sa.String(length=64),
            existing_nullable=False,
        )
        batch_op.drop_column('backup_settings_id')

    op.create_index(op.f('ix_backup_recipients_chat_id'), 'backup_recipients', ['chat_id'], unique=True)
