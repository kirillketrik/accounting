from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssetNamingRule(Base):
    """Maps (asset type, serial number) to a standardized asset name.

    Used to auto-fill the asset name when creating or bulk-creating assets:
    given a serial number and asset type, the matching active rule's
    ``name_result`` is used instead of the generic fallback name.
    """

    __tablename__ = "asset_naming_rules"
    __table_args__ = (
        UniqueConstraint("asset_type_id", "serial_number", name="uq_naming_rule_type_serial"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_type_id: Mapped[int] = mapped_column(
        ForeignKey("asset_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name_result: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    asset_type: Mapped["AssetType"] = relationship()
