from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class AssetHistory(Base):
    """Append-only snapshot of a disposed asset and its full event chain.

    Intentionally has no foreign keys: it must remain readable after the
    source asset/events rows are deleted.
    """

    __tablename__ = "asset_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    asset_type_name: Mapped[str] = mapped_column(String(100), nullable=False)
    inventory_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    responsible_person: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    asset_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    disposed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    events: Mapped[list[dict]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
 