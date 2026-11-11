from sqlalchemy import String, DateTime, Integer
from datetime import datetime, UTC, timedelta
from app.database.session import Base
from sqlalchemy.orm import Mapped, mapped_column


class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    college_email: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    otp_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC) + timedelta(minutes=10)
    )
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_otp_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
