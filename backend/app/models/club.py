from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from datetime import datetime, UTC
from app.database.session import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Technical")
    tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    instagram_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    faculty_coordinator_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty_coordinator_email: Mapped[str | None] = mapped_column(String(100), nullable=True)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    members: Mapped[list["ClubMember"]] = relationship(
        "ClubMember",
        back_populates="club",
        cascade="all, delete-orphan",
        order_by="ClubMember.joined_at"
    )


class ClubMember(Base):
    __tablename__ = "club_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="MEMBER")
    title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    club: Mapped["Club"] = relationship("Club", back_populates="members")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint("club_id", "user_id", name="uq_club_member"),
    )


class ClubReport(Base):
    __tablename__ = "club_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    club: Mapped["Club"] = relationship("Club")
    reporter: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint("club_id", "reporter_id", name="uq_club_report_reporter"),
    )
