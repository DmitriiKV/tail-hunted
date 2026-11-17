
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )

    app_id = Column(
        Integer,
        ForeignKey("applications.app_id"),
        nullable=True
    )

    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    notification_type = Column(String(30), nullable=False)

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    application = relationship("Application")
