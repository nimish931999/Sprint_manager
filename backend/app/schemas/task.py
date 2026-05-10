from pydantic import BaseModel
from datetime import datetime, date
from app.schemas.user import UserOut


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "backlog"
    priority: str = "medium"
    labels: str | None = None
    due_date: date | None = None
    story_points: int | None = None
    assignee_id: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    labels: str | None = None
    due_date: date | None = None
    story_points: int | None = None
    assignee_id: str | None = None


class TaskOut(BaseModel):
    id: str
    title: str
    description: str | None
    status: str
    priority: str
    labels: str | None
    due_date: date | None
    story_points: int | None
    project_id: str
    assignee_id: str | None
    assignee: UserOut | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, "id") and not isinstance(obj, dict):
            data = {
                "id": str(obj.id),
                "title": obj.title,
                "description": obj.description,
                "status": obj.status,
                "priority": obj.priority,
                "labels": obj.labels,
                "due_date": obj.due_date,
                "story_points": obj.story_points,
                "project_id": obj.project_id,
                "assignee_id": obj.assignee_id,
                "assignee": None,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
            }
            return cls(**data)
        return super().model_validate(obj, **kwargs)
