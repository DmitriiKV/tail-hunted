# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, scoped_session
# import os

# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://user:biznessLogika@localhost:5432/database")

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(bind=engine)

# db_session = scoped_session(SessionLocal)

# Base = declarative_base()