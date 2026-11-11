import json
import logging
import socket
import smtplib
import urllib.request
import urllib.error
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _create_ipv4_socket(host: str, port: int, timeout: float = 12):
    """Force IPv4 socket resolution. Prevents [Errno 101] Network is unreachable on cloud hosts without IPv6."""
    addr_info = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
    last_err = None
    for af, socktype, proto, _, sa in addr_info:
        sock = None
        try:
            sock = socket.socket(af, socktype, proto)
            sock.settimeout(timeout)
            sock.connect(sa)
            return sock
        except OSError as e:
            last_err = e
            if sock:
                sock.close()
    if last_err:
        raise last_err
    raise OSError(f"Could not connect to IPv4 for {host}:{port}")


class SMTP_IPv4(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return _create_ipv4_socket(host, port, timeout)


class SMTP_SSL_IPv4(smtplib.SMTP_SSL):
    def _get_socket(self, host, port, timeout):
        sock = _create_ipv4_socket(host, port, timeout)
        return self.context.wrap_socket(sock, server_hostname=self._host)


def send_via_resend(to_email: str, otp: str) -> bool:
    """Send verification email via Resend HTTP REST API (port 443 HTTPS)."""
    api_key = settings.RESEND_API_KEY.strip()
    if not api_key:
        return False

    payload = json.dumps({
        "from": "CampusConnect <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "CampusConnect Email Verification",
        "html": f"""
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">CampusConnect Email Verification</h2>
            <p>Your verification OTP is:</p>
            <h1 style="letter-spacing: 5px; color: #111;">{otp}</h1>
            <p>This code will expire in 10 minutes.</p>
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
                logger.info("✅ Verification email sent to %s via Resend API", to_email)
                return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        logger.warning("Resend HTTP API error (%s): %s", e.code, error_body)
    except Exception as e:
        logger.warning("Resend API request failed: %s", e)

    return False


def send_via_smtp(to_email: str, otp: str) -> bool:
    """Send verification email via IPv4 Gmail SMTP (trying port 587 STARTTLS, then port 465 SSL)."""
    username = settings.SMTP_USERNAME.strip() if settings.SMTP_USERNAME else ""
    password = settings.SMTP_PASSWORD.replace(" ", "").strip() if settings.SMTP_PASSWORD else ""

    if not username or not password:
        logger.warning("⚠️ SMTP credentials not set (SMTP_USERNAME or SMTP_PASSWORD is empty).")
        return False

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

    # 1. Try STARTTLS on configured port (or 587)
    try:
        with SMTP_IPv4(settings.SMTP_HOST, 587, timeout=12) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(message)
            logger.info("✅ OTP email sent successfully to %s via IPv4 SMTP (port 587)", to_email)
            return True
    except Exception as e587:
        logger.warning("Port 587 IPv4 SMTP failed (%s), trying port 465 SSL...", e587)

    # 2. Fallback to SMTPS / SSL on port 465
    try:
        with SMTP_SSL_IPv4(settings.SMTP_HOST, 465, timeout=12) as server:
            server.login(username, password)
            server.send_message(message)
            logger.info("✅ OTP email sent successfully to %s via IPv4 SSL (port 465)", to_email)
            return True
    except Exception as e465:
        logger.error("❌ Both port 587 and port 465 IPv4 SMTP failed for %s: %s", to_email, e465)

    return False


def send_otp_email(to_email: str, otp: str):
    # Always log OTP in server logs for instant debugging & fallback
    logger.info("🔑 [OTP Verification] Generated code for %s: %s", to_email, otp)

    # 1. Try Resend HTTP API if configured
    if send_via_resend(to_email, otp):
        return

    # 2. Try IPv4 Gmail SMTP (port 587 + 465)
    if send_via_smtp(to_email, otp):
        return

    logger.warning(
        "⚠️ All outgoing email methods failed for %s. OTP is stored in Supabase & logs: %s",
        to_email, otp
    )

