from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://novraux:novraux_secret@localhost:5433/novraux_v2"
    AI_API_KEY: str = ""          # Groq — free, trend scoring
    OPENAI_API_KEY: str = ""      # DALL-E — image generation
    GOOGLE_AI_KEY: str = ""       # Gemini — image generation alternative
    ANTHROPIC_API_KEY: str = ""   # Claude — kept for future use (research now uses Groq)

    # Cloudflare R2 — image storage
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_ACCOUNT_ID: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT: str = ""

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
