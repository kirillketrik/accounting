from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssetStatus(str, enum.Enum):
    ON_REFILL = "on_refill"
    IN_STORAGE = "in_storage"
    IN_USE = "in_use"
    DISPOSED = "disposed"


class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = (
        UniqueConstraint(
            "inventory_number", "asset_type_id", name="uq_assets_inventory_number_asset_type"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_type_id: Mapped[int] = mapped_column(
        ForeignKey("asset_types.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    inventory_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[AssetStatus] = mapped_column(
        SAEnum(AssetStatus, native_enum=False, length=50),
        nullable=False,
        default=AssetStatus.IN_STORAGE,
        server_default=AssetStatus.IN_STORAGE.value,
    )
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    responsible_person: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    asset_type: Mapped["AssetType"] = relationship(back_populates="assets")
    events: Mapped[list["AssetEvent"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan", order_by="AssetEvent.event_date.desc()"
    )
