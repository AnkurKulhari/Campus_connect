from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func

from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate
from app.services.notification_service import create_notification
from app.utils.moderation import assert_safe_content


def _get_comment_or_404(comment_id: int, db: Session) -> Comment:
    comment = db.scalar(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    return comment


def create_comment(post_id: int, comment_data: CommentCreate, current_user: User, db: Session) -> Comment:
    post = db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    assert_safe_content(comment_data.content, "Comment")

    comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=comment_data.content,
    )
    db.add(comment)
    db.commit()

    create_notification(
        recipient_id=post.user_id,
        sender_id=current_user.id,
        type="comment",
        post_id=post.id,
        comment_id=comment.id,
        db=db,
    )

    return _get_comment_or_404(comment.id, db)


def get_comments(post_id: int, page: int, page_size: int, db: Session) -> dict:
    post = db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    offset = (page - 1) * page_size
    total = db.scalar(select(func.count(Comment.id)).where(Comment.post_id == post_id))

    comments = db.scalars(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())   # oldest first (chronological thread)
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "comments": comments,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def update_comment(comment_id: int, comment_data: CommentUpdate, current_user: User, db: Session) -> Comment:
    comment = _get_comment_or_404(comment_id, db)

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments.")

    assert_safe_content(comment_data.content, "Comment")
    comment.content = comment_data.content
    db.commit()
    return _get_comment_or_404(comment_id, db)


def delete_comment(comment_id: int, current_user: User, db: Session) -> dict:
    comment = _get_comment_or_404(comment_id, db)

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments.")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully."}
