import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexora"
    CREATOR: str = "Parmanand Sharma"
    TAGLINE: str = "Learn Smarter. Grow Faster."
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Security
    JWT_SECRET: str = "nexora_super_secret_jwt_key_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./nexora.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://nexora-smart-learning:8080",
        "http://nexorasmartlearning:8080",
        "http://nexora:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 150
    
    # Optional external AI support (strictly opt-in via env var)
    ENABLE_EXTERNAL_AI: bool = False
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
