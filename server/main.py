from db import engine, Base

from db.models.user import User
from db.models.company import Company
from db.models.resume import Resume
from db.models.vacancy import Vacancy
from db.models.application import Application


def init_db():
    # Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("Tables are successfully created")


if __name__ == "__main__":
    init_db()