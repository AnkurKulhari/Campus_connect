from fastapi import HTTPException, Depends, BackgroundTasks
from app.schemas.auth import UserCreate, VerifyEmail, ResendOTP, ForgotPassword, ResetPassword, ChangePassword
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.auth.validators import validate_password, validate_username, validate_email
from app.auth.security import verify_password, get_password_hash
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_
from app.auth.jwt import create_access_token
from app.models.pending_registration import PendingRegistration
from app.models.password_reset import PasswordResetRequest
from app.utils.otp import generate_otp
from datetime import datetime, timedelta, UTC
from app.utils.email import send_otp_email

# Constants for brute-force and spam protection
MAX_OTP_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def register_user(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Normalize email to lowercase before any check or storage
    user_data.college_email = user_data.college_email.strip().lower()

    validate_email(user_data.college_email)
    validate_username(user_data.username)
    validate_password(user_data.password)

    # Check if email is already registered (verified account)
    existing_user = db.query(User).filter(User.college_email == user_data.college_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists.")

    # Check if username is already taken by a verified account
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken.")

    # Check if username is held by a *non-expired* pending registration (squatting guard)
    pending_username = db.query(PendingRegistration).filter(
        PendingRegistration.username == user_data.username
    ).first()
    if pending_username and pending_username.college_email != user_data.college_email:
        if pending_username.otp_expires_at > datetime.now(UTC):
            raise HTTPException(status_code=400, detail="Username already taken.")
        # Expired pending registration — the username slot is now free; clean it up
        db.delete(pending_username)
        db.commit()

    # Check if a pending registration already exists for this email
    existing_pending = db.query(PendingRegistration).filter(
        PendingRegistration.college_email == user_data.college_email
    ).first()

    otp = generate_otp()
    if existing_pending:
        # Enforce resend cooldown to prevent email bombing
        cooldown_until = existing_pending.last_otp_sent_at + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if datetime.now(UTC) < cooldown_until:
            remaining = int((cooldown_until - datetime.now(UTC)).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new OTP."
            )

        existing_pending.full_name = user_data.full_name
        existing_pending.username = user_data.username
        existing_pending.hashed_password = get_password_hash(user_data.password)
        existing_pending.otp = otp
        existing_pending.failed_attempts = 0
        existing_pending.otp_expires_at = datetime.now(UTC) + timedelta(minutes=10)
        existing_pending.last_otp_sent_at = datetime.now(UTC)
        db.commit()

        # Send email asynchronously so the HTTP response returns immediately
        background_tasks.add_task(send_otp_email, user_data.college_email, otp)
        return {"message": "New OTP sent successfully."}

    pending_user = PendingRegistration(
        full_name=user_data.full_name,
        college_email=user_data.college_email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        otp=otp
    )
    db.add(pending_user)
    db.commit()

    background_tasks.add_task(send_otp_email, user_data.college_email, otp)
    return {"message": "OTP has been sent."}


def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_login = db.query(User).filter(
        or_(
            User.username == form_data.username,
            User.college_email == form_data.username.strip().lower()
        )
    ).first()

    if not user_login:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not verify_password(form_data.password, user_login.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not user_login.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your college email before logging in.")

    access_token = create_access_token(data={"sub": str(user_login.id)})
    return {"access_token": access_token, "token_type": "bearer"}


def verify_email_service(verify_data: VerifyEmail, db: Session):
    email = verify_data.college_email.strip().lower()
    pending_user = db.query(PendingRegistration).filter(
        PendingRegistration.college_email == email
    ).first()

    if not pending_user:
        raise HTTPException(status_code=400, detail="No pending registration found.")

    if pending_user.otp_expires_at < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="OTP has expired. Please register again to get a new OTP.")

    # Brute-force guard: max 5 failed attempts
    if pending_user.failed_attempts >= MAX_OTP_ATTEMPTS:
        db.delete(pending_user)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Too many incorrect attempts. Please register again."
        )

    if pending_user.otp != verify_data.otp:
        pending_user.failed_attempts += 1
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - pending_user.failed_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    new_user = User(
        full_name=pending_user.full_name,
        username=pending_user.username,
        college_email=pending_user.college_email,
        hashed_password=pending_user.hashed_password,
        is_verified=True
    )
    db.add(new_user)
    db.delete(pending_user)
    db.commit()
    return {"message": "Email verified. You can now log in."}


def resend_otp_service(resend_data: ResendOTP, background_tasks: BackgroundTasks, db: Session):
    email = resend_data.college_email.strip().lower()
    pending_user = db.query(PendingRegistration).filter(
        PendingRegistration.college_email == email
    ).first()

    if not pending_user:
        raise HTTPException(status_code=400, detail="No pending registration found for this email.")

    # Enforce resend cooldown
    cooldown_until = pending_user.last_otp_sent_at + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
    if datetime.now(UTC) < cooldown_until:
        remaining = int((cooldown_until - datetime.now(UTC)).total_seconds())
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {remaining} seconds before requesting a new OTP."
        )

    otp = generate_otp()
    pending_user.otp = otp
    pending_user.failed_attempts = 0
    pending_user.otp_expires_at = datetime.now(UTC) + timedelta(minutes=10)
    pending_user.last_otp_sent_at = datetime.now(UTC)
    db.commit()

    background_tasks.add_task(send_otp_email, email, otp)
    return {"message": "A new OTP has been sent to your email."}


def forgot_password_service(forgot_data: ForgotPassword, background_tasks: BackgroundTasks, db: Session):
    email = forgot_data.college_email.strip().lower()

    # Silently succeed even if user not found to prevent email enumeration attacks
    user = db.query(User).filter(User.college_email == email).first()
    if not user:
        return {"message": "If that email is registered, a reset OTP has been sent."}

    existing_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.college_email == email
    ).first()

    otp = generate_otp()

    if existing_request:
        cooldown_until = existing_request.last_otp_sent_at + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if datetime.now(UTC) < cooldown_until:
            remaining = int((cooldown_until - datetime.now(UTC)).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new OTP."
            )
        existing_request.otp = otp
        existing_request.failed_attempts = 0
        existing_request.otp_expires_at = datetime.now(UTC) + timedelta(minutes=10)
        existing_request.last_otp_sent_at = datetime.now(UTC)
        db.commit()
    else:
        reset_request = PasswordResetRequest(college_email=email, otp=otp)
        db.add(reset_request)
        db.commit()

    background_tasks.add_task(send_otp_email, email, otp)
    return {"message": "If that email is registered, a reset OTP has been sent."}


def reset_password_service(reset_data: ResetPassword, db: Session):
    email = reset_data.college_email.strip().lower()

    reset_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.college_email == email
    ).first()

    if not reset_request:
        raise HTTPException(status_code=400, detail="No password reset request found.")

    if reset_request.otp_expires_at < datetime.now(UTC):
        db.delete(reset_request)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if reset_request.failed_attempts >= MAX_OTP_ATTEMPTS:
        db.delete(reset_request)
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Too many incorrect attempts. Please request a new reset OTP."
        )

    if reset_request.otp != reset_data.otp:
        reset_request.failed_attempts += 1
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - reset_request.failed_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    validate_password(reset_data.new_password)

    user = db.query(User).filter(User.college_email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(reset_data.new_password)
    db.delete(reset_request)
    db.commit()
    return {"message": "Password has been reset successfully. You can now log in."}


def change_password_service(change_data: ChangePassword, current_user: User, db: Session):
    if not verify_password(change_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if change_data.current_password == change_data.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from your current password.")

    validate_password(change_data.new_password)

    current_user.hashed_password = get_password_hash(change_data.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
