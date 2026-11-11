from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from app.database.session import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.post import Post
    from app.models.comment import Comment


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # "like", "comment", "follow"
    post_id: Mapped[int | None] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    comment_id: Mapped[int | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    message: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True
    )

    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
    post: Mapped["Post"] = relationship("Post", foreign_keys=[post_id])
    comment: Mapped["Comment"] = relationship("Comment", foreign_keys=[comment_id])
