"""users and auth

Revision ID: e7a2c4f18b90
Revises: 12da8c509645
Create Date: 2026-08-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7a2c4f18b90'
down_revision: Union[str, Sequence[str], None] = '12da8c509645'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Introduces user accounts + login sessions. responsible_person/performed_by free
    # text becomes an auto-attributed FK to the logged-in user, and app_settings
    # becomes per-user instead of a single global row. No real production data exists
    # yet, so — following the precedent set by 96cc51fa10b0/d33e6e6af02b/12da8c509645 —
    # dependent tables are dropped and recreated rather than migrated in place.
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('is_admin', sa.Boolean(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    op.create_table(
        'user_sessions',
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token_hash'),
    )
    op.create_index(op.f('ix_user_sessions_user_id'), 'user_sessions', ['user_id'], unique=False)

    op.drop_table('app_settings')
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('default_asset_type_id', sa.Integer(), nullable=True),
        sa.Column('default_bulk_asset_template', sa.String(length=300), nullable=True),
        sa.Column('default_bulk_asset_separator', sa.String(length=10), nullable=True),
        sa.Column('default_bulk_event_separator', sa.String(length=10), nullable=True),
        sa.Column('default_export_template', sa.String(length=300), nullable=True),
        sa.Column('default_export_separator', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['default_asset_type_id'], ['asset_types.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_app_settings_user_id'), 'app_settings', ['user_id'], unique=True)

    op.drop_table('asset_events')
    op.drop_table('assets')

    op.create_table(
        'assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_type_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('inventory_number', sa.String(length=100), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('status_id', sa.Integer(), nullable=False),
        sa.Column('place_id', sa.Integer(), nullable=True),
        sa.Column('responsible_user_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_type_id'], ['asset_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['status_id'], ['asset_statuses.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['place_id'], ['places.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['responsible_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inventory_number', 'asset_type_id', name='uq_assets_inventory_number_asset_type'),
    )
    op.create_index(op.f('ix_assets_asset_type_id'), 'assets', ['asset_type_id'], unique=False)
    op.create_index(op.f('ix_assets_name'), 'assets', ['name'], unique=False)
    op.create_index(op.f('ix_assets_status_id'), 'assets', ['status_id'], unique=False)
    op.create_index(op.f('ix_assets_place_id'), 'assets', ['place_id'], unique=False)
    op.create_index(op.f('ix_assets_responsible_user_id'), 'assets', ['responsible_user_id'], unique=False)

    op.create_table(
        'asset_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('event_type_id', sa.Integer(), nullable=False),
        sa.Column('event_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('performed_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['event_type_id'], ['event_types.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['performed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_asset_events_asset_id'), 'asset_events', ['asset_id'], unique=False)
    op.create_index(op.f('ix_asset_events_event_date'), 'asset_events', ['event_date'], unique=False)
    op.create_index(op.f('ix_asset_events_event_type_id'), 'asset_events', ['event_type_id'], unique=False)
    op.create_index(
        op.f('ix_asset_events_performed_by_user_id'), 'asset_events', ['performed_by_user_id'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_asset_events_performed_by_user_id'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_event_type_id'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_event_date'), table_name='asset_events')
    op.drop_index(op.f('ix_asset_events_asset_id'), table_name='asset_events')
    op.drop_table('asset_events')

    op.drop_index(op.f('ix_assets_responsible_user_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_place_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_status_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_name'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_type_id'), table_name='assets')
    op.drop_table('assets')

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

    op.drop_index(op.f('ix_app_settings_user_id'), table_name='app_settings')
    op.drop_table('app_settings')
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('default_responsible_person', sa.String(length=200), nullable=True),
        sa.Column('default_asset_type_id', sa.Integer(), nullable=True),
        sa.Column('default_bulk_asset_template', sa.String(length=300), nullable=True),
        sa.Column('default_bulk_asset_separator', sa.String(length=10), nullable=True),
        sa.Column('default_bulk_event_separator', sa.String(length=10), nullable=True),
        sa.Column('default_export_template', sa.String(length=300), nullable=True),
        sa.Column('default_export_separator', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['default_asset_type_id'], ['asset_types.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.drop_index(op.f('ix_user_sessions_user_id'), table_name='user_sessions')
    op.drop_table('user_sessions')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
