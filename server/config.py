import os

class Config:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://jobuser:jobpass@localhost:5432/jobapp"
    )
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")