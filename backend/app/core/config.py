from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Variables de entorno leídas de backend/.env (ver .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/foodstore_db"
    SECRET_KEY: str = "cambiar-esta-clave-de-al-menos-32-caracteres"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Uno o varios orígenes separados por coma
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    @property
    def origenes_cors(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]


settings = Settings()
