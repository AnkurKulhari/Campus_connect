from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/campus_connect"

    SECRET_KEY: str = "campus-connect-production-secret-key-change-in-production"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    RESEND_API_KEY: str = ""
    BREVO_API_KEY: str = ""

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Comma-separated allowed origins (e.g. "https://campusconnect.vercel.app,http://localhost:3000")
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        # Automatically redirect Supabase pooler from port 5432 (Session Mode, max 15 clients)
        # to port 6543 (Transaction Mode) to eliminate EMAXCONNSESSION errors under concurrency
        if "pooler.supabase.com:5432" in url:
            url = url.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
