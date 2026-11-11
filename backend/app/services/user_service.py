from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.schemas.user import UserProfileUpdate
from app.utils.cloudinary import upload_media, ALLOWED_IMAGE_TYPES


def _build_profile_response(user: User, current_user_id: int | None, db: Session) -> dict:
    posts_count = db.scalar(select(func.count(Post.id)).where(Post.user_id == user.id)) or 0
    followers_count = db.scalar(select(func.count(Follow.id)).where(Follow.following_id == user.id)) or 0
    following_count = db.scalar(select(func.count(Follow.id)).where(Follow.follower_id == user.id)) or 0

    is_self = (current_user_id == user.id) if current_user_id is not None else False
    is_following = False
    if current_user_id is not None and not is_self:
        is_following = bool(
            db.scalar(
                select(Follow.id).where(
                    Follow.follower_id == current_user_id,
                    Follow.following_id == user.id,
                )
            )
        )

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "profile_picture": user.profile_picture,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "is_following": is_following,
        "is_self": is_self,
        "created_at": user.created_at,
    }


def get_my_profile(current_user: User, db: Session) -> dict:
    return _build_profile_response(current_user, current_user.id, db)


def update_my_profile(current_user: User, profile_data: UserProfileUpdate, db: Session) -> dict:
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return _build_profile_response(current_user, current_user.id, db)


def update_avatar(file: UploadFile, current_user: User, db: Session) -> dict:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{file.content_type}'. Must be JPEG, PNG, WEBP, or GIF."
        )

    uploaded = upload_media(file, folder="campusconnect/avatars")
    current_user.profile_picture = uploaded["url"]

    db.commit()
    db.refresh(current_user)
    return _build_profile_response(current_user, current_user.id, db)


def get_user_profile(username: str, current_user_id: int | None, db: Session) -> dict:
    user = db.scalar(select(User).where(User.username == username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return _build_profile_response(user, current_user_id, db)
