from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Resume(Base):
    __tablename__ = "resumes"

    res_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    res_title = Column(String(150), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    salary_expectation = Column(Integer)
    professional_area = Column(String(150))
    education = Column(String(1000))
    skills = Column(String(1000))
    experience = Column(String(3000))
    res_created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume")