"""datetime events and app settings

Revision ID: d33e6e6af02b
Revises: 96cc51fa10b0
Create Date: 2026-08-05 17:31:32.893464

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd33e6e6af02b'
down_revision: Union[str, Sequence[str], None] = '96cc51fa10b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ASSET_STATUS_ENUM = sa.Enum(
    'ON_REFILL', 'IN_STORAGE', 'IN_USE', 'DISPOSED', name='assetstatus', native_enum=False, length=50
)


def upgrade() -> None:
    """Upgrade schema."""
    # event_date/disposed_at need to carry a time-of-day, not just a date. There is no
    # meaningful existing data worth preserving in this pre-production app (the caller
    # is expected to reset their local dev DB alongside this migration), so following
    # the precedent set by 96cc51fa10b0, drop and recreate the dependent tables wholesale
    # rather than attempt in-place column-type migration on SQLite.
    op.drop_table('asset_events')
    op.drop_table('asset_history')

    op.create_table(
        'asset_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('event_type_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('performed_by', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_type_id'], ['event_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_events_asset_id'), 'asset_events', ['asset_id'], unique=False)
    op.create_index(op.f('ix_asset_events_event_date'), 'asset_events', ['event_date'], unique=False)
    op.create_index(op.f('ix_asset_events_event_type_id'), 'asset_events', ['event_type_id'], unique=False)

    op.create_table(
        'asset_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_name', sa.String(length=200), nullable=False),
        sa.Column('asset_type_name', sa.String(length=100), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('asset_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('disposed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_history_asset_name'), 'asset_history', ['asset_name'], unique=False)

    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('default_responsible_person', sa.String(length=200), nullable=True),
        sa.Column('default_asset_type_id', sa.Integer(), nullable=True),
        sa.Column('default_bulk_asset_template', sa.String(length=300), nullable=True),
        sa.Column('default_bulk_asset_separator', sa.String(length=10), nullable=True),
        sa.Column('default_bulk_event_separator', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['default_asset_type_id'], ['asset_types.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    app_settings_table = sa.table(
        'app_settings',
        sa.column('id', sa.Integer),
        sa.column('default_responsible_person', sa.String),
        sa.column('default_asset_type_id', sa.Integer),
        sa.column('default_bulk_asset_template', sa.String),
        sa.column('default_bulk_asset_separator', sa.String),
        sa.column('default_bulk_event_separator', sa.String),
    )
    op.bulk_insert(
        app_settings_table,
        [
            {
                'id': 1,
                'default_responsible_person': None,
                'default_asset_type_id': None,
                'default_bulk_asset_template': None,
                'default_bulk_asset_separator': None,
                'default_bulk_event_separator': None,
            }
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('app_settings')

    op.drop_index(op.f('ix_asset_history_asset_name'), table_name='asset_history')
    op.drop_table('asset_history')

    op.drop_index(op.f('ix_asset_events_event_type_id'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_event_date'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_asset_id'), table_name='asset_events')
    op.drop_table('asset_events')

    op.create_table(
        'asset_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('event_type_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('performed_by', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_type_id'], ['event_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_events_asset_id'), 'asset_events', ['asset_id'], unique=False)
    op.create_index(op.f('ix_asset_events_event_date'), 'asset_events', ['event_date'], unique=False)
    op.create_index(op.f('ix_asset_events_event_type_id'), 'asset_events', ['event_type_id'], unique=False)

    op.create_table(
        'asset_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_name', sa.String(length=200), nullable=False),
        sa.Column('asset_type_name', sa.String(length=100), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('asset_created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('disposed_at', sa.Date(), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_history_asset_name'), 'asset_history', ['asset_name'], unique=False)
