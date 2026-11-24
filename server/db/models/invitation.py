from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.orm import relationship

from ..database import Base


class Invitation(Base):
    __tablename__ = "invitations"
    __table_args__ = (
        Index(
            "uq_active_invitation",
            "vac_id",
            "res_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
    )

    inv_id = Column(Integer, primary_key=True, autoincrement=True)
    vac_id = Column(Integer, ForeignKey("vacancies.vac_id"), nullable=False, index=True)
    res_id = Column(Integer, ForeignKey("resumes.res_id"), nullable=False, index=True)
    employer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    message = Column(String(500))
    status = Column(String(20), nullable=False, default="pending")
    decline_reason = Column(String(300))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    vacancy = relationship("Vacancy")
    resume = relationship("Resume")
    employer = relationship("User", foreign_keys=[employer_id])
    candidate = relationship("User", foreign_keys=[candidate_id])
