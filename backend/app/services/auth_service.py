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
from app.utils.moderation import assert_safe_content
from app.utils.id_cache import get_cached_id_card, pop_cached_id_card
from app.utils.cloudinary import upload_media_bytes

# Constants for brute-force and spam protection
MAX_OTP_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def register_user(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Normalize email and username to lowercase before any check or storage
    user_data.college_email = user_data.college_email.strip().lower()
    user_data.username = user_data.username.strip().lower()

    # Content moderation: prevent profanity, cuss words, and abusive handles
    assert_safe_content(user_data.full_name, "Full name")
    assert_safe_content(user_data.username, "Username")

    # Validate ID Card URL is provided and strictly from ephemeral in-memory cache
    if not user_data.id_card_url or not user_data.id_card_url.startswith("temp_id_"):
        raise HTTPException(
            status_code=400,
            detail="Official College ID card photo must be verified and uploaded via /auth/upload-id-card."
        )

    cached = get_cached_id_card(user_data.id_card_url)
    if not cached:
        raise HTTPException(
            status_code=400,
            detail="ID card upload session has expired or is invalid. Please upload your ID card photo again."
        )

    # Bind identity: verify that full_name and roll_number match the verified ID card session
    cached_name = cached.get("full_name", "")
    cached_roll = cached.get("roll_number", "")
    if cached_name and cached_name != user_data.full_name.strip().lower():
        raise HTTPException(
            status_code=400,
            detail="Full name in registration does not match the name verified on your uploaded ID card."
        )
    if cached_roll and user_data.roll_number and cached_roll != user_data.roll_number.strip():
        raise HTTPException(
            status_code=400,
            detail="Roll number in registration does not match the roll number verified on your uploaded ID card."
        )

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
        existing_pending.gender = user_data.gender
        existing_pending.hashed_password = get_password_hash(user_data.password)
        existing_pending.roll_number = user_data.roll_number
        existing_pending.course = user_data.course
        existing_pending.branch = user_data.branch
        existing_pending.year = user_data.year
        existing_pending.is_year_back = user_data.is_year_back
        existing_pending.is_alumni = user_data.is_alumni or (bool(user_data.year) and "alumni" in user_data.year.lower())
        existing_pending.id_card_url = user_data.id_card_url
        existing_pending.linkedin_url = user_data.linkedin_url
        existing_pending.otp = otp
        existing_pending.failed_attempts = 0
        existing_pending.otp_expires_at = datetime.now(UTC) + timedelta(minutes=10)
        existing_pending.last_otp_sent_at = datetime.now(UTC)
        db.commit()

        # Send email asynchronously so the HTTP response returns immediately
        background_tasks.add_task(send_otp_email, user_data.college_email, otp)
        return {"message": "New OTP sent successfully."}

    is_alumni_flag = user_data.is_alumni or (bool(user_data.year) and "alumni" in user_data.year.lower())
    pending_user = PendingRegistration(
        full_name=user_data.full_name,
        college_email=user_data.college_email,
        username=user_data.username,
        gender=user_data.gender,
        hashed_password=get_password_hash(user_data.password),
        roll_number=user_data.roll_number,
        course=user_data.course,
        branch=user_data.branch,
        year="Alumni" if is_alumni_flag else user_data.year,
        is_year_back=user_data.is_year_back,
        is_alumni=is_alumni_flag,
        id_card_url=user_data.id_card_url,
        linkedin_url=user_data.linkedin_url,
        otp=otp
    )
    db.add(pending_user)
    db.commit()

    background_tasks.add_task(send_otp_email, user_data.college_email, otp)
    return {"message": "OTP has been sent."}


def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    clean_identifier = form_data.username.strip()
    user_login = db.query(User).filter(
        or_(
            User.username == clean_identifier,
            User.username == clean_identifier.lower(),
            User.college_email == clean_identifier.lower(),
            User.roll_number == clean_identifier,
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

    clean_submitted_otp = str(verify_data.otp).strip()
    clean_pending_otp = str(pending_user.otp).strip()
    import secrets
    if not secrets.compare_digest(clean_pending_otp, clean_submitted_otp):
        pending_user.failed_attempts += 1
        if pending_user.failed_attempts >= MAX_OTP_ATTEMPTS:
            db.delete(pending_user)
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Too many incorrect attempts (limit of 5 reached). Pending registration purged. Please register again."
            )
        db.commit()
        remaining = MAX_OTP_ATTEMPTS - pending_user.failed_attempts
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect OTP. {remaining} attempt(s) remaining."
        )

    is_alumni_flag = pending_user.is_alumni or (bool(pending_user.year) and "alumni" in pending_user.year.lower())
    is_id_verified = False

    # Automated verification logic: supports AKTU affiliated batches (3rd/4th year) and IPEC Autonomous batches (1st/2nd year)
    if pending_user.roll_number:
        clean_roll = pending_user.roll_number.strip()
        if clean_roll.isdigit() and len(clean_roll) >= 8:
            batch_yy = int(clean_roll[:2])
            now = datetime.now(UTC)
            # Academic year index (sessions start around July/August)
            current_academic_start = now.year if now.month >= 7 else now.year - 1
            calculated_year_num = current_academic_start - (2000 + batch_yy) + 1
            standing_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}
            expected_prefix = standing_map.get(calculated_year_num)

            # 1. Standard AKTU format: 13 digits, digits 3-6: 0030
            if len(clean_roll) == 13 and clean_roll[2:6] == "0030":
                if is_alumni_flag and calculated_year_num > 4:
                    is_id_verified = True
                elif not is_alumni_flag:
                    if expected_prefix and pending_user.year and expected_prefix in pending_user.year:
                        is_id_verified = True
                    elif pending_user.is_year_back and pending_user.id_card_url:
                        is_id_verified = True
                    elif pending_user.id_card_url:
                        is_id_verified = True

            # 2. Autonomous batches (1st & 2nd Year, admitted 2023 onwards)
            elif clean_roll[:2] in ("23", "24", "25", "26"):
                if not is_alumni_flag:
                    if expected_prefix and pending_user.year and expected_prefix in pending_user.year:
                        is_id_verified = True
                    elif pending_user.id_card_url:
                        is_id_verified = True

            # 3. Legacy AKTU Alumni (10 digits with 030)
            elif len(clean_roll) == 10 and clean_roll[2:5] == "030":
                if is_alumni_flag or pending_user.id_card_url:
                    is_id_verified = True

    # If ID card was uploaded and valid roll number
    if pending_user.id_card_url and is_id_verified:
        is_id_verified = True

    # Secure deferred upload: ID card was held in memory cache; upload to Cloudinary now that email OTP is verified!
    final_id_card_url = pending_user.id_card_url
    if pending_user.id_card_url and pending_user.id_card_url.startswith("temp_id_"):
        cached_id = pop_cached_id_card(pending_user.id_card_url)
        if cached_id:
            uploaded = upload_media_bytes(
                cached_id["bytes"],
                folder="campusconnect/id_cards",
                filename=f"{pending_user.username}_id.jpg"
            )
            final_id_card_url = uploaded["url"]

    new_user = User(
        full_name=pending_user.full_name,
        username=pending_user.username,
        college_email=pending_user.college_email,
        gender=pending_user.gender,
        hashed_password=pending_user.hashed_password,
        is_verified=True,
        roll_number=pending_user.roll_number,
        course=pending_user.course,
        branch=pending_user.branch,
        year="Alumni" if is_alumni_flag else pending_user.year,
        is_year_back=pending_user.is_year_back,
        is_alumni=is_alumni_flag,
        id_card_url=final_id_card_url,
        is_id_verified=is_id_verified,
        linkedin_url=pending_user.linkedin_url,
        last_academic_verified_at=datetime.now(UTC)
    )
    db.add(new_user)
    db.delete(pending_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": str(new_user.id), "username": new_user.username}
    )
    return {
        "status": "success",
        "verified": True,
        "message": "Email verified successfully.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
    }


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

    # Enforce strict college email format and numeric roll number
    validate_email(email)

    user = db.query(User).filter(User.college_email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No registered account found with college email '{email}'. Please check your roll number or register."
        )

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
    return {"message": "A password reset code has been sent to your college email."}


def reset_password_service(reset_data: ResetPassword, db: Session):
    email = reset_data.college_email.strip().lower()

    # Enforce strict college email format
    validate_email(email)

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
