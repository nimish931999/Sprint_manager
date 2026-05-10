from pathlib import Path
from pydantic_settings import BaseSettings

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    MONGODB_URL: str
    MONGODB_DB: str = "sprintmanager"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    # Comma-separated in env: "https://frontend.vercel.app,http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        # Always include localhost for local dev
        defaults = ["http://localhost:5173", "http://localhost:3000"]
        return list(set(origins + defaults))

    class Config:
        env_file = str(ENV_FILE)


settings = Settings()
