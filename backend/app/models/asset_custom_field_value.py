from __future__ import annotations

from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AssetCustomFieldValue(Base):
    """One asset's value for one custom field definition. Stored as a single
    nullable string column, type-aware serialized/deserialized by the service
    layer per the definition's ``field_type`` — simpler generic read/write path
    than one typed column per field type, and values are never filtered/sorted
    on at the DB level.

    Both FKs cascade: a value is owned data, not an independent reference (unlike
    Asset.place_id/status_id) — it must die with either its asset or its definition.
    """

    __tablename__ = "asset_custom_field_values"
    __table_args__ = (
        UniqueConstraint("asset_id", "definition_id", name="uq_custom_field_value_asset_def"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    definition_id: Mapped[int] = mapped_column(
        ForeignKey("asset_custom_field_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    value: Mapped[str | None] = mapped_column(Text, nullable=True)

    asset: Mapped["Asset"] = relationship(back_populates="custom_field_values")
    definition: Mapped["AssetCustomFieldDefinition"] = relationship(back_populates="values")
