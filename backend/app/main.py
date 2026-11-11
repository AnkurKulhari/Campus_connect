from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import base
from app.routers import auth, users, posts, likes, notifications
from app.routers.comments import posts_router as comments_posts_router, comments_router

app = FastAPI(title="CampusConnect API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
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


@app.get("/")
def home():
    return {"message": "CampusConnect API"}
