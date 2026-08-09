from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssetStatus(Base):
    __tablename__ = "asset_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    is_disposal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    assets: Mapped[list["Asset"]] = relationship(back_populates="status")
    event_types: Mapped[list["EventType"]] = relationship(back_populates="target_status")
