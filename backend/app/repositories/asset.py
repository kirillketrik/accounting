from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset, AssetStatus
from app.models.asset_type import AssetType
from app.repositories.base import BaseRepository

SORTABLE_FIELDS: dict[str, object] = {
    "name": Asset.name,
    "inventory_number": Asset.inventory_number,
    "status": Asset.status,
    "location": Asset.location,
    "responsible_person": Asset.responsible_person,
    "created_at": Asset.created_at,
    "asset_type": AssetType.name,
}


class AssetRepository(BaseRepository[Asset]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Asset)

    def get_with_type(self, id_: int) -> Asset | None:
        return self.db.scalar(
            select(Asset).options(joinedload(Asset.asset_type)).where(Asset.id == id_)
        )

    def get_by_inventory_number_and_type(
        self, inventory_number: str, asset_type_id: int
    ) -> Asset | None:
        return self.db.scalar(
            select(Asset).where(
                Asset.inventory_number == inventory_number,
                Asset.asset_type_id == asset_type_id,
            )
        )

    def list_inventory_numbers(self, asset_type_id: int) -> list[str]:
        stmt = select(Asset.inventory_number).where(
            Asset.asset_type_id == asset_type_id, Asset.inventory_number.isnot(None)
        )
        return [value for value in self.db.scalars(stmt) if value]

    def list_by_inventory_number(self, inventory_number: str) -> list[Asset]:
        """Inventory numbers are only unique within an asset type, so this can match more than one asset."""
        stmt = (
            select(Asset)
            .options(joinedload(Asset.asset_type))
            .where(Asset.inventory_number == inventory_number)
        )
        return list(self.db.scalars(stmt).unique())

    def search(
        self,
        *,
        search: str | None = None,
        status: AssetStatus | None = None,
        asset_type_id: int | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Asset], int]:
        stmt = select(Asset).options(joinedload(Asset.asset_type)).join(AssetType)

        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Asset.name.ilike(like),
                    Asset.inventory_number.ilike(like),
                    Asset.serial_number.ilike(like),
                    Asset.location.ilike(like),
                    Asset.responsible_person.ilike(like),
                )
            )
        if status is not None:
            stmt = stmt.where(Asset.status == status)
        if asset_type_id is not None:
            stmt = stmt.where(Asset.asset_type_id == asset_type_id)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery()))

        sort_column = SORTABLE_FIELDS.get(sort_by, Asset.created_at)
        order = sort_column.desc() if sort_dir == "desc" else sort_column.asc()
        stmt = stmt.order_by(order).offset((page - 1) * page_size).limit(page_size)

        items = list(self.db.scalars(stmt).unique())
        return items, total or 0

    def list_for_export(
        self,
        *,
        status: AssetStatus | None = None,
        asset_type_id: int | None = None,
    ) -> list[Asset]:
        stmt = select(Asset).options(joinedload(Asset.asset_type)).join(AssetType)
        if status is not None:
            stmt = stmt.where(Asset.status == status)
        if asset_type_id is not None:
            stmt = stmt.where(Asset.asset_type_id == asset_type_id)
        stmt = stmt.order_by(Asset.name.asc())
        return list(self.db.scalars(stmt).unique())

    def count_by_status(self) -> list[tuple[AssetStatus, int]]:
        stmt = select(Asset.status, func.count()).group_by(Asset.status)
        return list(self.db.execute(stmt).all())

    def total_count(self) -> int:
        return self.db.scalar(select(func.count()).select_from(Asset)) or 0
