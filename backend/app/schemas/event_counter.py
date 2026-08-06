from pydantic import BaseModel


class EventCounter(BaseModel):
    event_type_id: int
    event_type_name: str
    count: int
    label: str
