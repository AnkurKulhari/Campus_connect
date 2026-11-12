import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

# In-memory sliding window history: { "action:ip": [timestamp1, timestamp2, ...] }
_REQUEST_HISTORY: dict[str, list[float]] = defaultdict(list)


def get_client_ip(request: Request) -> str:
    """Extracts client IP, respecting proxy headers from Railway / Cloudflare."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First IP in list is the original client IP
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(
    request: Request,
    action: str,
    max_requests: int,
    window_seconds: int,
) -> None:
    """
    Server-side sliding window rate limiter.
    Raises HTTPException 429 if the client IP exceeds max_requests within window_seconds.
    """
    client_ip = get_client_ip(request)
    key = f"{action}:{client_ip}"
    now = time.time()
    cutoff = now - window_seconds

    # Filter out entries older than window
    history = [t for t in _REQUEST_HISTORY[key] if t > cutoff]

    if len(history) >= max_requests:
        oldest = history[0]
        retry_after = max(1, int(oldest + window_seconds - now))
        logger.warning(
            f"Rate limit exceeded for action='{action}' from IP='{client_ip}'. "
            f"Allowed {max_requests} per {window_seconds}s. Retry after {retry_after}s."
        )
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Please wait {retry_after} seconds before trying again.",
            headers={"Retry-After": str(retry_after)},
        )

    history.append(now)
    _REQUEST_HISTORY[key] = history
