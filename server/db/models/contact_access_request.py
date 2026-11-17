from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class ContactAccessRequest(Base):
    __tablename__ = "contact_access_requests"

    request_id = Column(Integer, primary_key=True, autoincrement=True)

    resume_id = Column(
        Integer,
        ForeignKey("resumes.res_id"),
        nullable=False
    )

    employer_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    resume = relationship("Resume")

    employer = relationship(
        "User",
        foreign_keys=[employer_id]
    )

    candidate = relationship(
        "User",
        foreign_keys=[candidate_id]
    )