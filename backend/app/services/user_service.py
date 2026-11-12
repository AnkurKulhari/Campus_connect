from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_

from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.schemas.user import UserProfileUpdate
from app.utils.cloudinary import upload_media, ALLOWED_IMAGE_TYPES
from app.utils.moderation import assert_safe_content


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
        "gender": getattr(user, "gender", None),
        "roll_number": user.roll_number,
        "course": user.course,
        "branch": user.branch,
        "year": user.year,
        "is_year_back": user.is_year_back,
        "is_alumni": user.is_alumni,
        "is_id_verified": user.is_id_verified,
        "linkedin_url": user.linkedin_url,
        "last_academic_verified_at": user.last_academic_verified_at,
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
    if profile_data.full_name:
        assert_safe_content(profile_data.full_name, "Full name")
    if profile_data.bio:
        assert_safe_content(profile_data.bio, "Bio")

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


def get_alumni_circle(
    search: str | None,
    branch: str | None,
    page: int,
    page_size: int,
    current_user_id: int | None,
    db: Session,
) -> dict:
    """Retrieve verified and registered Alumni for the Alumni Circle tab."""
    query = select(User).where(
        or_(
            User.is_alumni == True,
            User.year == "Alumni"
        )
    )

    if search:
        search_filter = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(User.full_name).ilike(search_filter),
                func.lower(User.username).ilike(search_filter),
                func.lower(User.bio).ilike(search_filter),
            )
        )

    if branch and branch != "All":
        query = query.where(User.branch.ilike(f"%{branch.strip()}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    offset = (page - 1) * page_size
    alumni_users = db.scalars(
        query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
    ).all()

    alumni_profiles = [
        _build_profile_response(alumnus, current_user_id, db)
        for alumnus in alumni_users
    ]

    return {
        "alumni": alumni_profiles,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + len(alumni_users)) < total,
    }


def search_users(
    query_str: str | None,
    role: str | None,
    branch: str | None,
    page: int,
    page_size: int,
    current_user_id: int | None,
    db: Session,
) -> dict:
    """Search registered students and alumni across name, username, branch, and bio."""
    query = select(User).where(User.is_verified == True)

    if query_str and query_str.strip():
        term = f"%{query_str.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(User.full_name).ilike(term),
                func.lower(User.username).ilike(term),
                func.lower(User.branch).ilike(term),
                func.lower(User.course).ilike(term),
                func.lower(User.bio).ilike(term),
                func.lower(User.year).ilike(term),
            )
        )

    if role == "students":
        query = query.where(
            User.is_alumni == False,
            or_(User.year == None, User.year != "Alumni")
        )
    elif role == "alumni":
        query = query.where(
            or_(User.is_alumni == True, User.year == "Alumni")
        )

    if branch and branch != "All":
        query = query.where(User.branch.ilike(f"%{branch.strip()}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    offset = (page - 1) * page_size
    matched_users = db.scalars(
        query.order_by(User.is_id_verified.desc(), User.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    user_profiles = [
        _build_profile_response(u, current_user_id, db)
        for u in matched_users
    ]

    return {
        "users": user_profiles,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + len(matched_users)) < total,
    }


def get_suggested_users(current_user_id: int, limit: int, db: Session) -> list[dict]:
    """Return top suggested peers/seniors from campus that current user is not yet following."""
    following_ids_subq = (
        select(Follow.following_id).where(Follow.follower_id == current_user_id)
    )

    suggested = db.scalars(
        select(User)
        .where(
            User.id != current_user_id,
            User.is_verified == True,
            User.id.not_in(following_ids_subq),
        )
        .order_by(User.is_id_verified.desc(), User.created_at.desc())
        .limit(limit)
    ).all()

    return [_build_profile_response(u, current_user_id, db) for u in suggested]
