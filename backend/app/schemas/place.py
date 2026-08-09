from pydantic import BaseModel, ConfigDict, Field


class PlaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class PlaceRead(PlaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
