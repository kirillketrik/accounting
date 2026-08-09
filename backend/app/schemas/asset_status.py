from pydantic import BaseModel, ConfigDict, Field


class AssetStatusBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_default: bool = False
    is_disposal: bool = False


class AssetStatusCreate(AssetStatusBase):
    pass


class AssetStatusUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_default: bool | None = None
    is_disposal: bool | None = None


class AssetStatusRead(AssetStatusBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
