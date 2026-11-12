from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, Form, HTTPException, Request
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.schemas.auth import (
    UserCreate, Token, MessageResponse, VerifyEmail, UserResponse,
    ResendOTP, ForgotPassword, ResetPassword, ChangePassword
)
from app.models.user import User
from app.auth.jwt import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.cloudinary import ALLOWED_IMAGE_TYPES
from app.utils.moderation import assert_safe_content
from app.utils.id_verification import verify_id_card_name
from app.utils.id_cache import store_cached_id_card
from app.utils.rate_limiter import enforce_rate_limit
from app.services.auth_service import (
    register_user, login_user, verify_email_service,
    resend_otp_service, forgot_password_service,
    reset_password_service, change_password_service
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/upload-id-card")
def upload_id_card(
    request: Request,
    file: UploadFile = File(...),
    full_name: str | None = Form(None),
    roll_number: str | None = Form(None),
):
    """
    Validates and securely caches college ID card image in server memory during registration.
    Does NOT upload to Cloudinary or expose CDN URLs prior to email OTP verification.
    """
    enforce_rate_limit(request, "upload_id_card", max_requests=8, window_seconds=300)

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{file.content_type}'. Must be JPEG, PNG, WEBP, or GIF."
        )

    # Read bytes and enforce size limit
    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ID card file exceeds maximum 10MB limit.")

    # Moderation check on name
    if full_name and full_name.strip():
        assert_safe_content(full_name.strip(), "Full name")
        is_valid, reason = verify_id_card_name(file_bytes, full_name.strip(), roll_number)
        if not is_valid:
            raise HTTPException(status_code=400, detail=reason)

    # Cache image in memory — Cloudinary is NEVER touched here!
    temp_token = store_cached_id_card(file_bytes, file.content_type or "image/jpeg")

    return {
        "temp_token": temp_token,
        "id_card_url": temp_token,
        "message": "ID card verified and held in memory cache until OTP verification."
    }


@router.post("/register", response_model=MessageResponse)
def register(
    request: Request,
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "register", max_requests=10, window_seconds=600)
    return register_user(user_data, background_tasks, db)


@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "login", max_requests=20, window_seconds=300)
    return login_user(form_data, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    request: Request,
    verify_data: VerifyEmail,
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "verify_email", max_requests=15, window_seconds=300)
    return verify_email_service(verify_data, db)


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(
    request: Request,
    resend_data: ResendOTP,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "resend_otp", max_requests=5, window_seconds=600)
    return resend_otp_service(resend_data, background_tasks, db)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    request: Request,
    forgot_data: ForgotPassword,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "forgot_password", max_requests=5, window_seconds=600)
    return forgot_password_service(forgot_data, background_tasks, db)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    request: Request,
    reset_data: ResetPassword,
    db: Session = Depends(get_db)
):
    enforce_rate_limit(request, "reset_password", max_requests=10, window_seconds=600)
    return reset_password_service(reset_data, db)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    change_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return change_password_service(change_data, current_user, db)


@router.get("/test-email", tags=["Authentication"])
def test_email():
    """Diagnostic endpoint to test live email delivery on Railway."""
    from app.utils.email import send_via_brevo, send_via_resend
    from app.core.config import settings

    username = settings.SMTP_USERNAME.strip() if settings.SMTP_USERNAME else ""
    target_email = username or "test@example.com"
    dummy_otp = "999888"

    results = {}

    # Test Brevo (Sendinblue HTTP API)
    if settings.BREVO_API_KEY:
        try:
            brevo_ok = send_via_brevo(target_email, dummy_otp)
            results["brevo"] = "success" if brevo_ok else "failed (check logs)"
        except Exception as e:
            results["brevo"] = f"error: {e}"
    else:
        results["brevo"] = "not configured (BREVO_API_KEY empty)"

    # Test Resend (Resend HTTP API)
    if settings.RESEND_API_KEY:
        try:
            resend_ok = send_via_resend(target_email, dummy_otp)
            results["resend"] = "success" if resend_ok else "failed (check logs)"
        except Exception as e:
            results["resend"] = f"error: {e}"
    else:
        results["resend"] = "not configured (RESEND_API_KEY empty)"

    success = (
        results.get("brevo") == "success"
        or results.get("resend") == "success"
    )
    return {
        "status": "success" if success else "failed",
        "primary_provider": "brevo",
        "results": results,
        "target_email": target_email,
    }

