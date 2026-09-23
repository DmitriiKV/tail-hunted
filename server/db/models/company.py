from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Company(Base):
    __tablename__ = "companies"

    comp_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)

    comp_name = Column(String(150), nullable=False)
    comp_region = Column(String(100))
    address = Column(String(255))
    size = Column(String(20))
    comp_description = Column(String(2000))
    comp_phone = Column(String(30))
    comp_email = Column(String(120))

    user = relationship("User", back_populates="company")
    vacancies = relationship("Vacancy", back_populates="company")