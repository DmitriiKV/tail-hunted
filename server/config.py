import os


class Config:
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "dev-secret-change-me-to-something-longer-32b"
    )
    JWT_EXPIRES_HOURS = 24
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://jobuser:jobpass@localhost:5433/jobapp"
    )