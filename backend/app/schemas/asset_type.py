from pydantic import BaseModel, ConfigDict, Field


class AssetTypeBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class AssetTypeCreate(AssetTypeBase):
    pass


class AssetTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class AssetTypeRead(AssetTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
