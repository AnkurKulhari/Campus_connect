from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.schemas.follow import FollowToggleResponse, PaginatedFollowUsersResponse
from app.models.user import User
from app.services.user_service import get_my_profile, update_my_profile, get_user_profile, update_avatar
from app.services.follow_service import toggle_follow, get_followers, get_following
from app.auth.jwt import get_current_user
from app.database.session import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_my_profile(current_user, db)


@router.patch("/me", response_model=UserProfileResponse)
def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_my_profile(current_user, profile_data, db)


@router.post("/me/avatar", response_model=UserProfileResponse)
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a new profile picture to Cloudinary and update current user."""
    return update_avatar(file, current_user, db)


@router.get("/{username}", response_model=UserProfileResponse)
def get_public_profile(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_profile(username, current_user.id, db)


# ── Follows ──────────────────────────────────────────────────────────────────

@router.post("/{username}/follow", response_model=FollowToggleResponse)
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle follow/unfollow a user."""
    return toggle_follow(username, current_user, db)


@router.get("/{username}/followers", response_model=PaginatedFollowUsersResponse)
def list_followers(
    username: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List users following this user."""
    return get_followers(username, page, page_size, current_user.id, db)


@router.get("/{username}/following", response_model=PaginatedFollowUsersResponse)
def list_following(
    username: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List users this user is following."""
    return get_following(username, page, page_size, current_user.id, db)
