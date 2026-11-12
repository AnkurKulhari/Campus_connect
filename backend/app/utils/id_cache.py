import time
import secrets
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Ephemeral in-memory store for ID card image bytes prior to OTP email verification
# Structure: { token: { "bytes": bytes, "content_type": str, "expires_at": float } }
_CACHE: dict[str, dict] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes (matches OTP expiration window)


def store_cached_id_card(file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """
    Stores ID card bytes in temporary server-side memory cache.
    Returns an unguessable opaque token (e.g. 'temp_id_...').
    Does NOT upload to Cloudinary.
    """
    _purge_expired()
    token = f"temp_id_{secrets.token_urlsafe(24)}"
    _CACHE[token] = {
        "bytes": file_bytes,
        "content_type": content_type,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }
    logger.info(f"ID card stored in temporary memory cache with token '{token[:16]}...'")
    return token


def get_cached_id_card(token: str) -> Optional[dict]:
    """
    Retrieves cached ID card payload if valid and unexpired.
    """
    _purge_expired()
    item = _CACHE.get(token)
    if not item:
        return None
    if item["expires_at"] < time.time():
        _CACHE.pop(token, None)
        return None
    return item


def pop_cached_id_card(token: str) -> Optional[dict]:
    """
    Retrieves and removes cached ID card bytes once OTP email verification succeeds.
    """
    _purge_expired()
    return _CACHE.pop(token, None)


def _purge_expired():
    """Cleans up expired memory cache entries to prevent memory leaks."""
    now = time.time()
    expired = [k for k, v in _CACHE.items() if v.get("expires_at", 0) < now]
    for k in expired:
        _CACHE.pop(k, None)
