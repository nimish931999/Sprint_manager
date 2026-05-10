from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

_initialized = False


async def init_db():
    global _initialized
    if _initialized:
        return
    from app.models.user import User
    from app.models.project import Project
    from app.models.task import Task

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[User, Project, Task],
    )
    _initialized = True
