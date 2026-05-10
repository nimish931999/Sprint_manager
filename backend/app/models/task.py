from datetime import datetime, date
from beanie import Document
from pydantic import Field


class Task(Document):
    title: str
    description: str | None = None
    status: str = "backlog"       # backlog | in_progress | done
    priority: str = "medium"      # low | medium | high
    labels: str | None = None     # comma-separated
    due_date: date | None = None
    story_points: int | None = None
    project_id: str
    assignee_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tasks"
