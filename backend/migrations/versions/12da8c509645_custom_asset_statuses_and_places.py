"""custom asset statuses and places

Revision ID: 12da8c509645
Revises: bd925cf3210b
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12da8c509645'
down_revision: Union[str, Sequence[str], None] = 'bd925cf3210b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ASSET_STATUSES_TABLE = sa.table(
    'asset_statuses',
    sa.column('id', sa.Integer),
    sa.column('name', sa.String),
    sa.column('description', sa.String),
    sa.column('is_default', sa.Boolean),
    sa.column('is_disposal', sa.Boolean),
)

SEED_STATUSES = [
    {'id': 1, 'name': 'На складе', 'description': 'Актив хранится на складе', 'is_default': True, 'is_disposal': False},
    {'id': 2, 'name': 'Используется', 'description': 'Актив введён в эксплуатацию', 'is_default': False, 'is_disposal': False},
    {'id': 3, 'name': 'На заправке', 'description': 'Актив отправлен на заправку', 'is_default': False, 'is_disposal': False},
    {'id': 4, 'name': 'Списан', 'description': 'Актив выведен из эксплуатации', 'is_default': False, 'is_disposal': True},
]


def upgrade() -> None:
    """Upgrade schema."""
    # Statuses move from a fixed Python enum to an admin-managed table, and location
    # becomes a Place FK. Existing assets/events/history under the old enum can't be
    # mapped 1:1 onto new custom status rows, so — following the same precedent as
    # 96cc51fa10b0 for the previous status rework — the dependent tables are dropped
    # and recreated rather than attempting a lossy in-place column migration.
    op.drop_table('asset_events')
    op.drop_table('assets')
    op.drop_table('event_types')

    op.create_table(
        'asset_statuses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('is_disposal', sa.Boolean(), server_default='0', nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_statuses_name'), 'asset_statuses', ['name'], unique=True)
    op.bulk_insert(ASSET_STATUSES_TABLE, SEED_STATUSES)

    op.create_table(
        'places',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_places_name'), 'places', ['name'], unique=True)

    op.create_table(
        'event_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('target_status_id', sa.Integer(), nullable=False),
        sa.Column('counter_label', sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(['target_status_id'], ['asset_statuses.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_event_types_name'), 'event_types', ['name'], unique=True)
    op.create_index(
        op.f('ix_event_types_target_status_id'), 'event_types', ['target_status_id'], unique=False
    )

    op.create_table(
        'assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_type_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('status_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_type_id'], ['asset_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['status_id'], ['asset_statuses.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number', 'asset_type_id', name='uq_assets_inventory_number_asset_type'),
    )
    op.create_index(op.f('ix_assets_asset_type_id'), 'assets', ['asset_type_id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)
    op.create_index(op.f('ix_assets_status_id'), 'assets', ['status_id'], unique=False)
    op.create_index(op.f('ix_assets_place_id'), 'assets', ['place_id'], unique=False)

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

    with op.batch_alter_table('asset_history') as batch_op:
        batch_op.alter_column('location', new_column_name='place_name')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('asset_history') as batch_op:
        batch_op.alter_column('place_name', new_column_name='location')

    op.drop_index(op.f('ix_asset_events_event_type_id'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_event_date'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_asset_id'), table_name='asset_events')
    op.drop_table('asset_events')

    op.drop_index(op.f('ix_assets_place_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_status_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_name'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_type_id'), table_name='assets')
    op.drop_table('assets')

    op.drop_index(op.f('ix_event_types_target_status_id'), table_name='event_types')
    op.drop_index(op.f('ix_event_types_name'), table_name='event_types')
    op.drop_table('event_types')

    op.drop_index(op.f('ix_places_name'), table_name='places')
    op.drop_table('places')

    op.drop_index(op.f('ix_asset_statuses_name'), table_name='asset_statuses')
    op.drop_table('asset_statuses')

    op.create_table(
        'event_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column(
            'target_status',
            sa.Enum('ON_REFILL', 'IN_STORAGE', 'IN_USE', 'DISPOSED', name='assetstatus', native_enum=False, length=50),
            nullable=False,
        ),
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
        sa.Column(
            'status',
            sa.Enum('ON_REFILL', 'IN_STORAGE', 'IN_USE', 'DISPOSED', name='assetstatus', native_enum=False, length=50),
            server_default='in_storage',
            nullable=False,
        ),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('responsible_person', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_type_id'], ['asset_types.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number', 'asset_type_id', name='uq_assets_inventory_number_asset_type'),
    )
    op.create_index(op.f('ix_assets_asset_type_id'), 'assets', ['asset_type_id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)

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
