from db import Base, engine
import db.models  # noqa: F401


def init_db():
    Base.metadata.create_all(engine)
    print("Tables are successfully created")


if __name__ == "__main__":
    init_db()
