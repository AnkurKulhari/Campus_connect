from pydantic import BaseModel, ConfigDict
from datetime import datetime


class NotificationSenderResponse(BaseModel):
    username: str
    full_name: str
    profile_picture: str | None = None

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    type: str  # "like", "comment", "follow"
    sender: NotificationSenderResponse
    post_id: int | None = None
    comment_id: int | None = None
    message: str | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedNotificationsResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class UnreadCountResponse(BaseModel):
    unread_count: int
