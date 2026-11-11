from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import base
from app.database.session import get_db
from app.core.config import settings
from app.routers import auth, users, posts, likes, notifications
from app.routers.comments import posts_router as comments_posts_router, comments_router

app = FastAPI(title="CampusConnect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Matches all Vercel previews & production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(likes.router)
app.include_router(comments_posts_router)
app.include_router(comments_router)
app.include_router(notifications.router)


@app.get("/", tags=["Root"])
def home():
    return {"message": "CampusConnect API"}


@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health probe for Railway / cloud monitoring."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database_error": str(e)}
