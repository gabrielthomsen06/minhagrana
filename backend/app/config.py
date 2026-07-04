from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignora TELEGRAM_* e outras chaves não usadas
    )

    database_url: str
    secret_key: str
    admin_username: str
    admin_password_hash: str
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
