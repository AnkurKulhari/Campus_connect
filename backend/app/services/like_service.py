from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.models.like import Like
from app.models.post import Post
from app.models.user import User
from app.services.notification_service import create_notification, delete_notification


def toggle_like(post_id: int, current_user: User, db: Session) -> dict:
    # Verify the post exists
    post = db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing_like = db.scalar(
        select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)
    )

    if existing_like:
        # Unlike
        db.delete(existing_like)
        db.commit()
        delete_notification(
            recipient_id=post.user_id,
            sender_id=current_user.id,
            type="like",
            post_id=post.id,
            db=db,
        )
        liked = False
    else:
        # Like
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.add(new_like)
        try:
            db.commit()
        except IntegrityError:
            # Race condition: duplicate like — treat as already liked
            db.rollback()
            liked = True
        else:
            create_notification(
                recipient_id=post.user_id,
                sender_id=current_user.id,
                type="like",
                post_id=post.id,
                db=db,
            )
            liked = True

    # Return fresh count
    like_count = db.scalar(select(func.count(Like.id)).where(Like.post_id == post_id))
    return {
        "message": "Post liked." if liked else "Post unliked.",
        "liked": liked,
        "like_count": like_count,
    }
