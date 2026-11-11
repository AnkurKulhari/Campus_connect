from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

from app.core.config import settings

# Handle database URL normalization for managed providers (Supabase, Neon, etc.)
raw_db_url = settings.normalized_database_url

engine = create_engine(
    raw_db_url,
    pool_pre_ping=True,  # Tests connection liveness before executing queries
    pool_recycle=1800,   # Recycles idle connections every 30 minutes
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
class Base(DeclarativeBase):
    pass

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()