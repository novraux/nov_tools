from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://novraux:novraux_secret@localhost:5433/novraux_v2"
    AI_API_KEY: str = ""          # Groq — free, trend scoring
    OPENAI_API_KEY: str = ""      # DALL-E — image generation
    GOOGLE_AI_KEY: str = ""       # Gemini — image generation alternative
    ANTHROPIC_API_KEY: str = ""   # Claude — deep analysis (gated, score >= 7 only)

    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
