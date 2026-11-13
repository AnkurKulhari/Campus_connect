from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

from app.core.config import settings

# Handle database URL normalization for managed providers (Supabase, Neon, etc.)
raw_db_url = settings.normalized_database_url

is_pooler = "pooler.supabase.com" in raw_db_url

if is_pooler:
    # When connecting via Supabase Pooler on port 6543 (Transaction Mode),
    # maintain a steady warm pool so connections are reused across HTTP requests
    # without paying TCP/TLS handshake latency on every query.
    engine = create_engine(
        raw_db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=10,
        pool_timeout=15,
        pool_recycle=300,
        connect_args={"connect_timeout": 10},
    )
else:
    engine = create_engine(
        raw_db_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=10,
        max_overflow=20,
        connect_args={"connect_timeout": 10},
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