from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


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
    inventory_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status_id: Mapped[int] = mapped_column(
        ForeignKey("asset_statuses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    place_id: Mapped[int | None] = mapped_column(
        ForeignKey("places.id", ondelete="SET NULL"), nullable=True, index=True
    )
    responsible_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    asset_type: Mapped["AssetType"] = relationship(back_populates="assets")
    status: Mapped["AssetStatus"] = relationship(back_populates="assets")
    place: Mapped["Place | None"] = relationship(back_populates="assets")
    responsible_user: Mapped["User | None"] = relationship()
    events: Mapped[list["AssetEvent"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan", order_by="AssetEvent.event_date.desc()"
    )
    custom_field_values: Mapped[list["AssetCustomFieldValue"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan"
    )
