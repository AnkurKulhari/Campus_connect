import smtplib
from email.message import EmailMessage
from fastapi import HTTPException

from app.core.config import settings

def send_otp_email(to_email: str, otp: str):
    message = EmailMessage()
    message["From"] = settings.SMTP_USERNAME
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
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification email."
        )