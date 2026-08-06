from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.asset_naming_rule import AssetNamingRule
from app.repositories.asset_naming_rule import AssetNamingRuleRepository
from app.repositories.asset_type import AssetTypeRepository
from app.schemas.asset_naming_rule import AssetNamingRuleCreate, AssetNamingRuleUpdate


class AssetNamingRuleService:
    def __init__(self, db: Session) -> None:
        self.repo = AssetNamingRuleRepository(db)
        self.asset_type_repo = AssetTypeRepository(db)

    def list(self) -> list[AssetNamingRule]:
        return self.repo.list_with_type()

    def get(self, id_: int) -> AssetNamingRule:
        obj = self.repo.get_with_type(id_)
        if obj is None:
            raise NotFoundError("AssetNamingRule", id_)
        return obj

    def _get_asset_type_or_raise(self, asset_type_id: int) -> None:
        if self.asset_type_repo.get(asset_type_id) is None:
            raise NotFoundError("AssetType", asset_type_id)

    def _ensure_unique(
        self, asset_type_id: int, serial_number: str, *, exclude_id: int | None = None
    ) -> None:
        existing = self.repo.get_by_type_and_serial(asset_type_id, serial_number)
        if existing is not None and existing.id != exclude_id:
            raise ConflictError(
                f"Rule for serial number '{serial_number}' already exists for this asset type"
            )

    def create(self, data: AssetNamingRuleCreate) -> AssetNamingRule:
        self._get_asset_type_or_raise(data.asset_type_id)
        self._ensure_unique(data.asset_type_id, data.serial_number)
        obj = self.repo.create(**data.model_dump())
        return self.get(obj.id)

    def update(self, id_: int, data: AssetNamingRuleUpdate) -> AssetNamingRule:
        obj = self.get(id_)
        payload = data.model_dump(exclude_unset=True)
        if "asset_type_id" in payload:
            self._get_asset_type_or_raise(payload["asset_type_id"])
        if "asset_type_id" in payload or "serial_number" in payload:
            asset_type_id = payload.get("asset_type_id", obj.asset_type_id)
            serial_number = payload.get("serial_number", obj.serial_number)
            self._ensure_unique(asset_type_id, serial_number, exclude_id=id_)
        self.repo.update(obj, **payload)
        return self.get(id_)

    def delete(self, id_: int) -> None:
        obj = self.get(id_)
        self.repo.delete(obj)
