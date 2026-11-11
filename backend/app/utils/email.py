import logging
import smtplib
from email.message import EmailMessage
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str):
    # Always log OTP in server logs for instant debugging & fallback
    logger.info("🔑 [OTP Verification] Generated code for %s: %s", to_email, otp)

    username = settings.SMTP_USERNAME.strip() if settings.SMTP_USERNAME else ""
    # Strip spaces in case 16-character Google App Password was pasted with spaces
    password = settings.SMTP_PASSWORD.replace(" ", "").strip() if settings.SMTP_PASSWORD else ""

    if not username or not password:
        logger.warning(
            "⚠️ SMTP credentials not set (SMTP_USERNAME or SMTP_PASSWORD is empty). "
            "Cannot send outgoing email. Use OTP from server logs or Supabase: %s",
            otp
        )
        return

    message = EmailMessage()
    message["From"] = username
    message["To"] = to_email
    message["Subject"] = "CampusConnect Email Verification"

    message.set_content(
        f"""
        CampusConnect Email Verification

        Your verification OTP is: {otp}

        This OTP will expire in 10 minutes.
        """
    )
    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.starttls()
                server.login(username, password)
                server.send_message(message)
        logger.info("✅ OTP email sent successfully to %s", to_email)
    except Exception as e:
        logger.error(
            "❌ Failed to send verification email to %s via SMTP (%s:%s): %s",
            to_email, settings.SMTP_HOST, settings.SMTP_PORT, e, exc_info=True
        )
