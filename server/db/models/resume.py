from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Resume(Base):
    __tablename__ = "resumes"

    res_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)

    res_title = Column(String(150), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    salary_expectation = Column(Integer)
    professional_area = Column(String(150))
    education = Column(String(1000))
    skills = Column(String(1000))
    experience = Column(String(3000))  # Подробное описание опыта работы
    experience_level = Column(String(50))  # Стаж работы
    preferred_region = Column(
        String(100),
        nullable=False,
        default="Любой регион"
    )
    res_created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")