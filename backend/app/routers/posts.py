from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Annotated

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.post import (
    PostResponse, PaginatedPostsResponse, PostCreate, PostUpdate,
    PostReportCreate, PostReportResponse, TrendingTopicResponse
)
from app.schemas.auth import MessageResponse
from app.services.post_service import (
    create_post, get_post, get_feed, get_following_feed,
    get_user_posts, update_post, delete_post, report_post,
    get_trending_topics
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/", response_model=PostResponse, status_code=201)
def create(
    content: Annotated[str | None, Form()] = None,
    files: Annotated[list[UploadFile], File()] = [],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new post. Accepts optional text content and up to 5 media files."""
    post_data = PostCreate(content=content)
    return create_post(post_data, files, current_user, db)


@router.get("/feed", response_model=PaginatedPostsResponse)
def feed(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    tag: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Paginated campus feed — most recent posts first, optionally filtered by tag."""
    return get_feed(page, page_size, current_user.id, db, tag=tag)


@router.get("/trending", response_model=list[TrendingTopicResponse])
def trending(
    limit: int = Query(default=6, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns actual trending hashtags and campus topics calculated from live posts."""
    return get_trending_topics(db, limit)


@router.get("/following", response_model=PaginatedPostsResponse)
def following_feed(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Paginated feed of posts from users you follow."""
    return get_following_feed(page, page_size, current_user.id, db)


@router.get("/user/{username}", response_model=PaginatedPostsResponse)
def user_posts(
    username: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All posts by a specific user, paginated."""
    return get_user_posts(username, page, page_size, current_user.id, db)


@router.get("/{post_id}", response_model=PostResponse)
def single_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch a single post by ID."""
    return get_post(post_id, current_user.id, db)


@router.patch("/{post_id}", response_model=PostResponse)
def edit_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit the text content of your own post."""
    return update_post(post_id, post_data, current_user, db)


@router.delete("/{post_id}", response_model=MessageResponse)
def remove_post(
    post_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete your own post (also removes media from Cloudinary)."""
    return delete_post(post_id, current_user, background_tasks, db)


@router.post("/{post_id}/report", response_model=PostReportResponse)
def flag_post(
    post_id: int,
    report_data: PostReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Report a post for 18+ content, harassment, or violations. Auto-quarantines once reported."""
    return report_post(post_id, report_data, current_user, db)
