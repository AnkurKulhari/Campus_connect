from sqlalchemy import String, DateTime, Boolean
from datetime import datetime, UTC
from app.database.session import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.post import Post

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(unique=False)
    username: Mapped[str] = mapped_column(String(30), index=True, unique=True)
    college_email: Mapped[str] = mapped_column(String(100), unique=True)
    hashed_password: Mapped[str] = mapped_column(unique=False)
    bio: Mapped[str | None] = mapped_column(nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Academic & Student Identity
    roll_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    course: Mapped[str | None] = mapped_column(String(50), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_year_back: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_alumni: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    id_card_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_id_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_academic_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author", cascade="all, delete-orphan")