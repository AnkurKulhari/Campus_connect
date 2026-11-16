from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.models.follow import Follow
from app.models.user import User
from app.services.notification_service import create_notification, delete_notification


def toggle_follow(username: str, current_user: User, db: Session) -> dict:
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself.")

    existing_follow = db.scalar(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == target_user.id,
        )
    )

    if existing_follow:
        # Unfollow
        db.delete(existing_follow)
        db.commit()
        delete_notification(
            recipient_id=target_user.id,
            sender_id=current_user.id,
            type="follow",
            db=db,
        )
        is_following = False
        message = f"Unfollowed @{target_user.username}."
    else:
        # Follow
        new_follow = Follow(follower_id=current_user.id, following_id=target_user.id)
        db.add(new_follow)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            is_following = True
        else:
            create_notification(
                recipient_id=target_user.id,
                sender_id=current_user.id,
                type="follow",
                db=db,
            )
            is_following = True
        message = f"Now following @{target_user.username}."

    followers_count = db.scalar(
        select(func.count(Follow.id)).where(Follow.following_id == target_user.id)
    ) or 0

    return {
        "message": message,
        "is_following": is_following,
        "followers_count": followers_count,
    }


def get_followers(username: str, page: int, page_size: int, current_user_id: int, db: Session) -> dict:
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    offset = (page - 1) * page_size
    total = db.scalar(
        select(func.count(Follow.id)).where(Follow.following_id == target_user.id)
    ) or 0

    # Get users who follow target_user
    followers = db.scalars(
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.following_id == target_user.id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    # Get set of IDs that the current user is following
    my_following_ids = set(
        db.scalars(
            select(Follow.following_id).where(Follow.follower_id == current_user_id)
        ).all()
    )
    # Get set of IDs that follow the current user
    my_follower_ids = set(
        db.scalars(
            select(Follow.follower_id).where(Follow.following_id == current_user_id)
        ).all()
    )

    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "profile_picture": u.profile_picture,
            "bio": u.bio,
            "is_following": u.id in my_following_ids,
            "is_followed_by": u.id in my_follower_ids,
            "is_self": u.id == current_user_id,
        }
        for u in followers
    ]

    return {
        "users": user_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def get_following(username: str, page: int, page_size: int, current_user_id: int, db: Session) -> dict:
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    offset = (page - 1) * page_size
    total = db.scalar(
        select(func.count(Follow.id)).where(Follow.follower_id == target_user.id)
    ) or 0

    # Get users whom target_user follows
    following_users = db.scalars(
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == target_user.id)
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    my_following_ids = set(
        db.scalars(
            select(Follow.following_id).where(Follow.follower_id == current_user_id)
        ).all()
    )
    my_follower_ids = set(
        db.scalars(
            select(Follow.follower_id).where(Follow.following_id == current_user_id)
        ).all()
    )

    user_list = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "profile_picture": u.profile_picture,
            "bio": u.bio,
            "is_following": u.id in my_following_ids,
            "is_followed_by": u.id in my_follower_ids,
            "is_self": u.id == current_user_id,
        }
        for u in following_users
    ]

    return {
        "users": user_list,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def remove_follower(follower_username: str, current_user: User, db: Session) -> dict:
    """
    Removes a follower from following the current user.
    Enforces authorization: Only the followed user can remove their own follower.
    """
    clean_username = follower_username.strip().lower().lstrip("@")
    follower_user = db.scalar(
        select(User).where(func.lower(User.username) == clean_username)
    )
    if not follower_user:
        raise HTTPException(status_code=404, detail="Student not found.")

    if follower_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself as a follower.")

    follow_record = db.scalar(
        select(Follow).where(
            Follow.follower_id == follower_user.id,
            Follow.following_id == current_user.id,
        )
    )
    if not follow_record:
        raise HTTPException(
            status_code=400,
            detail=f"@{follower_user.username} is not following you."
        )

    db.delete(follow_record)
    db.commit()

    # Clean up follow notification if pending
    try:
        delete_notification(
            recipient_id=current_user.id,
            sender_id=follower_user.id,
            type="follow",
            db=db,
        )
    except Exception:
        pass

    followers_count = db.scalar(
        select(func.count(Follow.id)).where(Follow.following_id == current_user.id)
    ) or 0

    return {
        "status": "success",
        "message": f"@{follower_user.username} was removed from your followers.",
        "followers_count": followers_count,
        "removed_user_id": follower_user.id,
    }
