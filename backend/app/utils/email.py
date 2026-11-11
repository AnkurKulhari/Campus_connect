import json
import logging
import urllib.request
import urllib.error

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_via_brevo(to_email: str, otp: str) -> bool:
    """Send verification email via Brevo (Sendinblue) HTTP REST API over port 443 HTTPS.
    Works on all cloud platforms (Railway, Vercel, AWS) and delivers to any student address."""
    api_key = settings.BREVO_API_KEY.strip()
    if not api_key:
        return False

    sender_email = settings.SMTP_USERNAME.strip() or "onboarding@campusconnect.app"
    payload = json.dumps({
        "sender": {"name": "CampusConnect", "email": sender_email},
        "to": [{"email": to_email}],
        "subject": "CampusConnect Email Verification",
        "htmlContent": f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 700;">CampusConnect</h1>
                <p style="color: #71717a; font-size: 13px; margin-top: 4px;">Inderprastha Engineering College</p>
            </div>
            <div style="padding: 24px; background: #f8fafc; border-radius: 12px; text-align: center;">
                <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0;">Your email verification code is:</p>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e1b4b; padding: 12px 0; font-family: monospace;">
                    {otp}
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0;">This OTP will expire in 10 minutes. Max 5 attempts allowed.</p>
            </div>
            <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin-top: 24px;">
                If you did not request this verification code, please ignore this email.
            </p>
        </div>
        """
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "CampusConnect/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in (200, 201):
                logger.info("✅ Verification OTP email successfully delivered to %s via Brevo", to_email)
                return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        logger.error("❌ Brevo API error (%s): %s", e.code, error_body)
    except Exception as e:
        logger.error("❌ Brevo API request failed: %s", e)

    return False


def send_via_resend(to_email: str, otp: str) -> bool:
    """Send verification email via Resend HTTP REST API over port 443 HTTPS."""
    api_key = settings.RESEND_API_KEY.strip()
    if not api_key:
        return False

    payload = json.dumps({
        "from": "CampusConnect <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "CampusConnect Email Verification",
        "html": f"""
        <div style="font-family: sans-serif; padding: 24px; max-width: 500px; margin: auto;">
            <h2 style="color: #4F46E5;">CampusConnect Verification</h2>
            <p>Your verification code is: <strong>{otp}</strong></p>
            <p>Expires in 10 minutes.</p>
        </div>
        """
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CampusConnect/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in (200, 201):
                logger.info("✅ Verification OTP email sent to %s via Resend", to_email)
                return True
    except Exception as e:
        logger.warning("Resend API failed: %s", e)

    return False


def send_otp_email(to_email: str, otp: str):
    """Primary entry point for OTP delivery across all auth flows."""
    logger.info("🔑 [OTP Verification] Generated code for %s: %s", to_email, otp)

    # 1. Primary: Brevo HTTP REST API (port 443 HTTPS)
    if send_via_brevo(to_email, otp):
        return

    # 2. Secondary: Resend HTTP REST API (port 443 HTTPS)
    if send_via_resend(to_email, otp):
        return

    logger.warning(
        "⚠️ Email delivery failed for %s. Code is saved in Supabase pending_registration table: %s",
        to_email, otp
    )
