from pydantic import BaseModel
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = "#6366f1"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    archived: bool | None = None


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str | None
    color: str
    archived: bool
    created_at: datetime
    owner_id: str
    task_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, "id") and not isinstance(obj, dict):
            data = {
                "id": str(obj.id),
                "name": obj.name,
                "description": obj.description,
                "color": obj.color,
                "archived": obj.archived,
                "created_at": obj.created_at,
                "owner_id": obj.owner_id,
                "task_count": 0,
            }
            return cls(**data)
        return super().model_validate(obj, **kwargs)
