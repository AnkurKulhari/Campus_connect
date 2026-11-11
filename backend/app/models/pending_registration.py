from sqlalchemy import String, DateTime, Boolean, Integer
from datetime import datetime, UTC, timedelta
from app.database.session import Base
from sqlalchemy.orm import Mapped, mapped_column

class PendingRegistration(Base):
    __tablename__ = "pending_registration"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(unique=False)
    username: Mapped[str] = mapped_column(String(30), index=True, unique=True)
    college_email: Mapped[str] = mapped_column(String(100), unique=True)
    hashed_password: Mapped[str] = mapped_column(unique=False)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    otp_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC) + timedelta(minutes=10))
    # Tracks failed OTP attempts; record is deleted after MAX_OTP_ATTEMPTS
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Prevents email-bombing by enforcing a resend cooldown
    last_otp_sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))