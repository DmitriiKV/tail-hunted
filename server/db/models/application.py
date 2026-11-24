from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("res_id", "vac_id", name="uq_resume_vacancy"),
    )

    app_id = Column(Integer, primary_key=True, autoincrement=True)
    res_id = Column(Integer, ForeignKey("resumes.res_id"), nullable=False)
    vac_id = Column(Integer, ForeignKey("vacancies.vac_id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    app_created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status_changed_at = Column(DateTime)

    resume = relationship("Resume", back_populates="applications")
    vacancy = relationship("Vacancy", back_populates="applications")