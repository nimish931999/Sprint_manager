from datetime import datetime
from beanie import Document
from pydantic import Field


class Project(Document):
    name: str
    description: str | None = None
    color: str = "#6366f1"
    archived: bool = False
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "projects"
