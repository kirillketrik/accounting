from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EventType(Base):
    __tablename__ = "event_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    target_status_id: Mapped[int] = mapped_column(
        ForeignKey("asset_statuses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    counter_label: Mapped[str | None] = mapped_column(String(200), nullable=True)

    target_status: Mapped["AssetStatus"] = relationship(back_populates="event_types")
    events: Mapped[list["AssetEvent"]] = relationship(
        back_populates="event_type", cascade="all, delete-orphan"
    )
