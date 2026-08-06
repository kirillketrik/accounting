from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AppSettings(Base):
    """Singleton row (id=1) of app-wide defaults used to pre-fill bulk-entry forms."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    default_responsible_person: Mapped[str | None] = mapped_column(String(200), nullable=True)
    default_asset_type_id: Mapped[int | None] = mapped_column(
        ForeignKey("asset_types.id", ondelete="SET NULL"), nullable=True
    )
    default_bulk_asset_template: Mapped[str | None] = mapped_column(String(300), nullable=True)
    default_bulk_asset_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
    default_bulk_event_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
    default_export_template: Mapped[str | None] = mapped_column(String(300), nullable=True)
    default_export_separator: Mapped[str | None] = mapped_column(String(10), nullable=True)
