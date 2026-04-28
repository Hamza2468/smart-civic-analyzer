"""
Database Models
===============
Defines the shape of our database tables using SQLAlchemy ORM.
Think of these as Python classes that map directly to PostgreSQL tables.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Complaint(Base):
    """
    Main complaints table.
    Every civic complaint submitted goes here.
    """
    __tablename__ = "complaints"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False)
    description  = Column(Text, nullable=False)
    location     = Column(String(300), nullable=True)
    submitted_by = Column(String(100), nullable=True, default="Anonymous")

    # AI-generated fields
    category     = Column(String(100), nullable=False)   # e.g. Roads, Water, Electricity
    priority     = Column(String(20), nullable=False)    # Critical / High / Medium / Low
    confidence   = Column(Float, nullable=True)          # AI confidence score (0.0 to 1.0)

    # Workflow
    status       = Column(String(50), nullable=False, default="Open")  # Open / In Progress / Resolved

    # Timestamps (auto-managed)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())