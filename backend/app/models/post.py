from sqlalchemy import String, DateTime, Integer, ForeignKey, Text, literal
from sqlalchemy.orm import Mapped, mapped_column, relationship, query_expression
from datetime import datetime, UTC
from app.database.session import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_hidden: Mapped[bool] = mapped_column(default=False, nullable=False)
    report_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # ORM relationships (data access)
    author: Mapped["User"] = relationship("User", back_populates="posts")
    media: Mapped[list["PostMedia"]] = relationship(
        "PostMedia", back_populates="post", cascade="all, delete-orphan", order_by="PostMedia.order"
    )

    # Computed at query time via with_expression() — no DB columns created
    like_count = query_expression(default_expr=literal(0))
    comment_count = query_expression(default_expr=literal(0))
    is_liked_by_me = query_expression(default_expr=literal(False))


class PostMedia(Base):
    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    cloudinary_url: Mapped[str] = mapped_column(String(500), nullable=False)
    cloudinary_public_id: Mapped[str] = mapped_column(String(200), nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    post: Mapped["Post"] = relationship("Post", back_populates="media")
