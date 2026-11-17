from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(120), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    last_name = Column(String(150), nullable=False)
    first_name = Column(String(150), nullable=False)
    middle_name = Column(String(150), nullable=False)
    role = Column(String(20), nullable=False)
    
    company = relationship("Company", back_populates="user", uselist=False)
    resumes = relationship("Resume", back_populates="user")

    notifications = relationship(
    "Notification",
    back_populates="user",
    cascade="all, delete-orphan"
)