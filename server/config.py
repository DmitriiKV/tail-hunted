import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_EXPIRES_HOURS = 24
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://jobuser:jobpass@localhost:5432/jobapp"
    )