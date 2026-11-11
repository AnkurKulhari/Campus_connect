from fastapi import APIRouter, Depends, BackgroundTasks
from app.database.session import get_db
from sqlalchemy.orm import Session
from app.schemas.auth import (
    UserCreate, Token, MessageResponse, VerifyEmail, UserResponse,
    ResendOTP, ForgotPassword, ResetPassword, ChangePassword
)
from app.models.user import User
from app.auth.jwt import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth_service import (
    register_user, login_user, verify_email_service,
    resend_otp_service, forgot_password_service,
    reset_password_service, change_password_service
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


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
