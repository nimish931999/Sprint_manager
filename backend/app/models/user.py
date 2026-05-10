from datetime import datetime
from beanie import Document
from pydantic import EmailStr


class User(Document):
    email: EmailStr
    name: str
    hashed_password: str
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
        indexes = ["email"]
