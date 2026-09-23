from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Vacancy(Base):
    __tablename__ = "vacancies"

    vac_id = Column(Integer, primary_key=True, autoincrement=True)
    comp_id = Column(Integer, ForeignKey("companies.comp_id"), nullable=False)

    vac_title = Column(String(150), nullable=False)
    specialization = Column(String(150))
    hiring_plan = Column(Integer)
    employment_type = Column(String(20))   # full/part/project/internship
    schedule = Column(String(50))
    salary = Column(Integer)
    experience_required = Column(String(50))
    skills_required = Column(String(1000)) # "Python, Django, Docker"
    vac_description = Column(String(5000))
    vac_region = Column(String(100))
    vac_created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    company = relationship("Company", back_populates="vacancies")
    applications = relationship("Application", back_populates="vacancy")