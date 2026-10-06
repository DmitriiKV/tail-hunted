from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://jobuser:jobpass@localhost:5433/jobapp"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db_session = scoped_session(SessionLocal)
Base = declarative_base()