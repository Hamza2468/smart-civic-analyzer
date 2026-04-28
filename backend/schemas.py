"""
Pydantic Schemas
================
These define what data the API accepts (request) and returns (response).
Pydantic automatically validates types and gives clear error messages.
Think of schemas as the "contract" between frontend and backend.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Request Schemas (what the frontend sends) ─────────────────────────────────

class ComplaintCreate(BaseModel):
    """Data required to create a new complaint."""
    title: str = Field(..., min_length=5, max_length=200, examples=["Broken streetlight on Main Road"])
    description: str = Field(..., min_length=10, examples=["The streetlight near the park has been off for 2 weeks. It's dangerous at night."])
    location: Optional[str] = Field(None, examples=["Main Road, Block 5, Sector 4"])
    submitted_by: Optional[str] = Field("Anonymous", examples=["Ahmed Khan"])


class StatusUpdate(BaseModel):
    """Data required to update complaint status."""
    status: str = Field(..., examples=["In Progress"])


# ── Response Schemas (what the API returns) ────────────────────────────────────

class ComplaintResponse(BaseModel):
    """Full complaint data returned from the API."""
    id: int
    title: str
    description: str
    location: Optional[str]
    submitted_by: Optional[str]

    # AI-generated
    category: str
    priority: str
    confidence: Optional[float]

    # Workflow
    status: str

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        # This tells Pydantic to work with SQLAlchemy ORM objects
        from_attributes = True