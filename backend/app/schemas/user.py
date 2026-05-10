from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, "id"):
            data = {
                "id": str(obj.id),
                "email": obj.email,
                "name": obj.name,
                "created_at": obj.created_at,
            }
            return cls(**data)
        return super().model_validate(obj, **kwargs)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
