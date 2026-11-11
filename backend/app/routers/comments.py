from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.comment import (
    CommentCreate, CommentUpdate, CommentResponse, PaginatedCommentsResponse
)
from app.schemas.auth import MessageResponse
from app.services.comment_service import (
    create_comment, get_comments, update_comment, delete_comment
)

# Two routers in one file: /posts/{post_id}/comments and /comments/{comment_id}
posts_router = APIRouter(prefix="/posts", tags=["Comments"])
comments_router = APIRouter(prefix="/comments", tags=["Comments"])


@posts_router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
def add_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to a post."""
    return create_comment(post_id, comment_data, current_user, db)


@posts_router.get("/{post_id}/comments", response_model=PaginatedCommentsResponse)
def list_comments(
    post_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get paginated comments for a post, oldest first."""
    return get_comments(post_id, page, page_size, db)


@comments_router.patch("/{comment_id}", response_model=CommentResponse)
def edit_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit your own comment."""
    return update_comment(comment_id, comment_data, current_user, db)


@comments_router.delete("/{comment_id}", response_model=MessageResponse)
def remove_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete your own comment."""
    return delete_comment(comment_id, current_user, db)
