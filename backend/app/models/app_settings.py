from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppSettings(Base):
    """Per-user defaults used to pre-fill bulk-entry forms."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    default_asset_type_id: Mapped[int | None] = mapped_column(
        ForeignKey("asset_types.id", ondelete="SET NULL"), nullable=True
    )
    default_bulk_asset_template: Mapped[str | None] = mapped_column(String(300), nullable=True)
    default_bulk_asset_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
    default_bulk_event_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
    default_export_template: Mapped[str | None] = mapped_column(String(300), nullable=True)
    default_export_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
