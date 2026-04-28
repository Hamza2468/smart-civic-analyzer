"""
Smart Civic Complaint Analyzer - FastAPI Backend
================================================
Main application entry point. Handles all API routes.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import engine, get_db
import models
import schemas
from classifier import ComplaintClassifier

# ─── App Setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Civic Complaint Analyzer API",
    description="AI-powered civic complaint classification and prioritization system",
    version="1.0.0"
)

# Allow React frontend (running on port 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
       
        "https://smart-civic-analyzer-pe1s.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all database tables on startup
models.Base.metadata.create_all(bind=engine)

# Load AI classifier once (not on every request — saves memory)
classifier = ComplaintClassifier()


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "Smart Civic Complaint Analyzer API is running ✅"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "model_loaded": classifier.is_ready()}


# ─── Complaints ───────────────────────────────────────────────────────────────

@app.post("/complaints/", response_model=schemas.ComplaintResponse, tags=["Complaints"])
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    """
    Submit a new civic complaint.
    The AI automatically classifies its category and priority.
    """
    # Run AI classification
    ai_result = classifier.classify(complaint.description)

    # Save to database
    db_complaint = models.Complaint(
        title=complaint.title,
        description=complaint.description,
        location=complaint.location,
        submitted_by=complaint.submitted_by,
        category=ai_result["category"],
        priority=ai_result["priority"],
        confidence=ai_result["confidence"],
        status="Open"
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint


@app.get("/complaints/", response_model=List[schemas.ComplaintResponse], tags=["Complaints"])
def get_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all complaints with optional filters.
    Filter by status (Open/In Progress/Resolved), category, or priority.
    """
    query = db.query(models.Complaint)

    if status:
        query = query.filter(models.Complaint.status == status)
    if category:
        query = query.filter(models.Complaint.category == category)
    if priority:
        query = query.filter(models.Complaint.priority == priority)

    return query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()


@app.get("/complaints/{complaint_id}", response_model=schemas.ComplaintResponse, tags=["Complaints"])
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Get a single complaint by its ID."""
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@app.patch("/complaints/{complaint_id}/status", response_model=schemas.ComplaintResponse, tags=["Complaints"])
def update_complaint_status(
    complaint_id: int,
    status_update: schemas.StatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of a complaint (Open → In Progress → Resolved)."""
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    valid_statuses = ["Open", "In Progress", "Resolved"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid_statuses}")

    complaint.status = status_update.status
    db.commit()
    db.refresh(complaint)
    return complaint


@app.delete("/complaints/{complaint_id}", tags=["Complaints"])
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Delete a complaint by ID."""
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully"}


# ─── Analytics ────────────────────────────────────────────────────────────────

@app.get("/analytics/summary", tags=["Analytics"])
def get_summary(db: Session = Depends(get_db)):
    """
    Dashboard summary: total counts by status, category, and priority.
    Used to power the analytics cards on the frontend.
    """
    from sqlalchemy import func

    total = db.query(func.count(models.Complaint.id)).scalar()

    # Count by status
    status_counts = dict(
        db.query(models.Complaint.status, func.count(models.Complaint.id))
        .group_by(models.Complaint.status).all()
    )

    # Count by category
    category_counts = dict(
        db.query(models.Complaint.category, func.count(models.Complaint.id))
        .group_by(models.Complaint.category).all()
    )

    # Count by priority
    priority_counts = dict(
        db.query(models.Complaint.priority, func.count(models.Complaint.id))
        .group_by(models.Complaint.priority).all()
    )

    return {
        "total": total,
        "by_status": status_counts,
        "by_category": category_counts,
        "by_priority": priority_counts
    }


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)