"""
Database Connection
===================
Sets up SQLAlchemy connection to PostgreSQL.
The get_db() function is used as a FastAPI dependency —
it opens a DB session per request and closes it after.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Load .env file BEFORE reading environment variables
load_dotenv()

# ── Connection String ────────────────────────────────────────────────────────
# Format: postgresql://username:password@host:port/database_name
# We read from environment variable for security.
# Default value is for local development only.

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/civic_complaints"
)

# ── Engine ───────────────────────────────────────────────────────────────────
# The engine is the core SQLAlchemy object that talks to PostgreSQL.
engine = create_engine(DATABASE_URL)

# ── Session Factory ──────────────────────────────────────────────────────────
# Each request gets its own session (transaction).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base Class ───────────────────────────────────────────────────────────────
# All models inherit from this. SQLAlchemy uses it to track table definitions.
Base = declarative_base()


# ── Dependency ───────────────────────────────────────────────────────────────
def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session after each request (even if an error occurs).
    
    Usage in route:
        def my_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()