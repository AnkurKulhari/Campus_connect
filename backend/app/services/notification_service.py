from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, update, delete

from app.models.notification import Notification
from app.models.user import User


def create_notification(
    recipient_id: int,
    sender_id: int,
    type: str,
    post_id: int | None = None,
    comment_id: int | None = None,
    message: str | None = None,
    db: Session = None,
) -> Notification | None:
    # Never notify the user of their own actions
    if recipient_id == sender_id:
        return None

    # Check for duplicate unread notification to prevent spamming
    existing = db.scalar(
        select(Notification).where(
            Notification.recipient_id == recipient_id,
            Notification.sender_id == sender_id,
            Notification.type == type,
            Notification.post_id == post_id,
            Notification.is_read == False,
        )
    )
    if existing:
        return existing

    # Generate default message if not provided
    if not message:
        sender = db.scalar(select(User).where(User.id == sender_id))
        sender_name = sender.username if sender else "Someone"
        if type == "like":
            message = f"@{sender_name} liked your post."
        elif type == "comment":
            message = f"@{sender_name} commented on your post."
        elif type == "follow":
            message = f"@{sender_name} started following you."

    notification = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=type,
        post_id=post_id,
        comment_id=comment_id,
        message=message,
        is_read=False,
    )
    db.add(notification)
    db.commit()
    return notification


def delete_notification(
    recipient_id: int,
    sender_id: int,
    type: str,
    post_id: int | None = None,
    db: Session = None,
):
    """Clean up notification on un-like or un-follow."""
    query = delete(Notification).where(
        Notification.recipient_id == recipient_id,
        Notification.sender_id == sender_id,
        Notification.type == type,
    )
    if post_id is not None:
        query = query.where(Notification.post_id == post_id)

    db.execute(query)
    db.commit()


def get_user_notifications(user_id: int, page: int, page_size: int, db: Session) -> dict:
    offset = (page - 1) * page_size
    total = db.scalar(
        select(func.count(Notification.id)).where(Notification.recipient_id == user_id)
    )

    notifications = db.scalars(
        select(Notification)
        .options(selectinload(Notification.sender))
        .where(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "notifications": notifications,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def get_unread_count(user_id: int, db: Session) -> int:
    return db.scalar(
        select(func.count(Notification.id)).where(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
        )
    ) or 0


def mark_notification_as_read(notification_id: int, user_id: int, db: Session) -> dict:
    notification = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_id == user_id,
        )
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read."}


def mark_all_as_read(user_id: int, db: Session) -> dict:
    db.execute(
        update(Notification)
        .where(Notification.recipient_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    db.commit()
    return {"message": "All notifications marked as read."}


def delete_user_notification(notification_id: int, user_id: int, db: Session) -> dict:
    notif = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_id == user_id,
        )
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.delete(notif)
    db.commit()
    return {"message": "Notification removed."}


def clear_all_user_notifications(user_id: int, db: Session) -> dict:
    db.execute(delete(Notification).where(Notification.recipient_id == user_id))
    db.commit()
    return {"message": "All notifications cleared."}
