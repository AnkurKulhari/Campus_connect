from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.comment import LikeToggleResponse
from app.services.like_service import toggle_like

router = APIRouter(prefix="/posts", tags=["Likes"])


@router.post("/{post_id}/like", response_model=LikeToggleResponse)
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle like on a post. Calling again on a liked post will unlike it."""
    return toggle_like(post_id, current_user, db)
