from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.notification import (
    PaginatedNotificationsResponse,
    UnreadCountResponse,
)
from app.schemas.auth import MessageResponse
from app.services.notification_service import (
    get_user_notifications,
    get_unread_count,
    mark_notification_as_read,
    mark_all_as_read,
    delete_user_notification,
    clear_all_user_notifications,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=PaginatedNotificationsResponse)
def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated notifications for current user, newest first."""
    return get_user_notifications(current_user.id, page, page_size, db)


@router.get("/unread-count", response_model=UnreadCountResponse)
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get total unread notifications count (for notification badge)."""
    count = get_unread_count(current_user.id, db)
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=MessageResponse)
def read_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a single notification as read."""
    return mark_notification_as_read(notification_id, current_user.id, db)


@router.patch("/read-all", response_model=MessageResponse)
def read_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications for current user as read."""
    return mark_all_as_read(current_user.id, db)


@router.delete("/clear-all", response_model=MessageResponse)
def clear_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all notifications for the current user."""
    return clear_all_user_notifications(current_user.id, db)


@router.delete("/{notification_id}", response_model=MessageResponse)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an individual notification."""
    return delete_user_notification(notification_id, current_user.id, db)
