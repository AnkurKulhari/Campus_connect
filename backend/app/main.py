import logging
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import base
from app.database.session import get_db
from app.core.config import settings
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.routers import auth, users, posts, likes, notifications, messages
from app.routers.comments import posts_router as comments_posts_router, comments_router

app = FastAPI(title="CampusConnect API", version="1.0.0")

# Respect X-Forwarded-Proto and X-Forwarded-For from reverse proxies (Railway, Cloudflare)
# This prevents scheme downgrades to http:// during URL generation or redirects
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Matches all Vercel previews & production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Ensure ASGI scope scheme reflects forwarded protocol
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto:
        request.scope["scheme"] = forwarded_proto

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/auth"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled exception during request to %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Database / Server error: {str(exc)}"},
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(likes.router)
app.include_router(comments_posts_router)
app.include_router(comments_router)
app.include_router(notifications.router)
app.include_router(messages.router)


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
