"""event-driven asset status and history table

Revision ID: 96cc51fa10b0
Revises: 90c959992973
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96cc51fa10b0'
down_revision: Union[str, Sequence[str], None] = '90c959992973'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ASSET_STATUS_ENUM = sa.Enum(
    'ON_REFILL', 'IN_STORAGE', 'IN_USE', 'DISPOSED', name='assetstatus', native_enum=False, length=50
)


def upgrade() -> None:
    """Upgrade schema."""
    # Old seed data / statuses / event types are being replaced wholesale, so
    # the simplest correct path on SQLite is to drop and recreate the
    # dependent tables rather than attempt in-place enum/column migrations.
    op.drop_table('asset_events')
    op.drop_table('assets')
    op.drop_table('event_types')

    op.create_table(
        'event_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('target_status', ASSET_STATUS_ENUM, nullable=False),
        sa.Column('counter_label', sa.String(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_event_types_name'), 'event_types', ['name'], unique=True)

    op.create_table(
        'assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_type_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('status', ASSET_STATUS_ENUM, server_default='in_storage', nullable=False),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_type_id'], ['asset_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number'),
    )
    op.create_index(op.f('ix_assets_asset_type_id'), 'assets', ['asset_type_id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)

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


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_asset_history_asset_name'), table_name='asset_history')
    op.drop_table('asset_history')

    op.drop_index(op.f('ix_asset_events_event_type_id'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_event_date'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_asset_id'), table_name='asset_events')
    op.drop_table('asset_events')

    op.drop_index(op.f('ix_assets_name'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_type_id'), table_name='assets')
    op.drop_table('assets')

    op.drop_index(op.f('ix_event_types_name'), table_name='event_types')
    op.drop_table('event_types')

    op.create_table(
        'event_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_event_types_name'), 'event_types', ['name'], unique=True)

    op.create_table(
        'assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_type_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'IN_REPAIR', 'IN_STORAGE', 'DISPOSED', 'LOST', name='assetstatus', native_enum=False, length=50), server_default='active', nullable=False),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_type_id'], ['asset_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number'),
    )
    op.create_index(op.f('ix_assets_asset_type_id'), 'assets', ['asset_type_id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)

    op.create_table(
        'asset_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('event_type_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('performed_by', sa.String(length=200), nullable=True),
        sa.Column('cost', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_type_id'], ['event_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_events_asset_id'), 'asset_events', ['asset_id'], unique=False)
    op.create_index(op.f('ix_asset_events_event_date'), 'asset_events', ['event_date'], unique=False)
    op.create_index(op.f('ix_asset_events_event_type_id'), 'asset_events', ['event_type_id'], unique=False)
