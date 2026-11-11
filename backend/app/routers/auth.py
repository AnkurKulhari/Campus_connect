from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, HTTPException
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.schemas.auth import (
    UserCreate, Token, MessageResponse, VerifyEmail, UserResponse,
    ResendOTP, ForgotPassword, ResetPassword, ChangePassword
)
from app.models.user import User
from app.auth.jwt import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.cloudinary import upload_media, ALLOWED_IMAGE_TYPES
from app.services.auth_service import (
    register_user, login_user, verify_email_service,
    resend_otp_service, forgot_password_service,
    reset_password_service, change_password_service
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/upload-id-card")
def upload_id_card(file: UploadFile = File(...)):
    """Upload college ID card image to Cloudinary during registration."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{file.content_type}'. Must be JPEG, PNG, WEBP, or GIF."
        )
    uploaded = upload_media(file, folder="campusconnect/id_cards")
    return {"id_card_url": uploaded["url"]}


@router.post("/register", response_model=MessageResponse)
def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return register_user(user_data, background_tasks, db)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login_user(form_data, db)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(verify_data: VerifyEmail, db: Session = Depends(get_db)):
    return verify_email_service(verify_data, db)


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(resend_data: ResendOTP, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return resend_otp_service(resend_data, background_tasks, db)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(forgot_data: ForgotPassword, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return forgot_password_service(forgot_data, background_tasks, db)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(reset_data: ResetPassword, db: Session = Depends(get_db)):
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

