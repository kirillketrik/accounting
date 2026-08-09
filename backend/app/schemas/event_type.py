from pydantic import BaseModel, ConfigDict, Field

from app.schemas.asset_status import AssetStatusRead


class EventTypeBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    target_status_id: int
    counter_label: str | None = Field(default=None, max_length=200)


class EventTypeCreate(EventTypeBase):
    pass


class EventTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    target_status_id: int | None = None
    counter_label: str | None = Field(default=None, max_length=200)


class EventTypeRead(EventTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    target_status: AssetStatusRead
