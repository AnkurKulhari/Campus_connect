from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.post import Post


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_like_user_post"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)

    user: Mapped["User"] = relationship("User")
    post: Mapped["Post"] = relationship("Post")
