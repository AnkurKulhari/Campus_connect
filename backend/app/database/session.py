from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Handle database URL normalization for managed providers (Supabase, Neon, etc.)
raw_db_url = settings.normalized_database_url

is_pooler = "pooler.supabase.com" in raw_db_url

if is_pooler:
    # When connecting via Supabase Pooler (Supavisor in Transaction Mode port 6543),
    # use NullPool so SQLAlchemy does not maintain its own client-side queue pool.
    # Connections are acquired directly from Supavisor and released immediately upon session close,
    # completely eliminating QueuePool timeout and EMAXCONNSESSION exhaustion.
    engine = create_engine(
        raw_db_url,
        poolclass=NullPool,
        pool_pre_ping=True,
    )
else:
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