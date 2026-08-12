from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AssetCustomFieldDefinition(Base):
    """Admin-defined custom attribute scoped to an asset type (e.g. "CPU model" on
    "Computer"). ``field_type`` is a plain validated string, not a DB enum, so adding
    a new kind later is a code-only change (see app.schemas.asset_custom_field.CustomFieldType).
    """

    __tablename__ = "asset_custom_field_definitions"
    __table_args__ = (
        UniqueConstraint("asset_type_id", "name", name="uq_custom_field_def_type_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_type_id: Mapped[int] = mapped_column(
        ForeignKey("asset_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_required: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    asset_type: Mapped["AssetType"] = relationship()
    # SQLite does not enforce the DB-level ondelete="CASCADE" on AssetCustomFieldValue
    # without PRAGMA foreign_keys=ON (not set up in this app's engine, see db/session.py),
    # so cleanup on delete must happen at the ORM level, mirroring AssetType.assets.
    values: Mapped[list["AssetCustomFieldValue"]] = relationship(
        back_populates="definition", cascade="all, delete-orphan"
    )
