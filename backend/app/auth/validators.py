from fastapi import HTTPException
import re

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number."
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\[\]~`';]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character."
        )

def validate_username(username: str):
    if len(username) < 3:
        raise HTTPException(status_code=400,detail="Username must be at least 3 characters long.")

    if len(username) > 30:
        raise HTTPException(status_code=400, detail="Username must be at most 30 characters long.")

    if not re.fullmatch(r"^[a-z0-9_.]+$", username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, periods (.) and underscores (_).")

    if ".." in username:
        raise HTTPException(status_code=400, detail="Username must not contain consecutive periods.")

    if username.startswith("."):
        raise HTTPException(status_code=400, detail="Username must not start with a period.")

    if username.endswith("."):
        raise HTTPException(status_code=400, detail="Username must not end with a period.")


def validate_email(college_email: str):
    if college_email != college_email.strip():
        raise HTTPException(status_code=400, detail="College email cannot contain leading or trailing spaces.")

    local_part, _, domain = college_email.lower().partition("@")

    if domain != "ipec.org.in":
        raise HTTPException(status_code=400, detail="College email must end with domain 'ipec.org.in'.")

    if not local_part.isdigit():
        raise HTTPException(status_code=400, detail="College email must contain a numeric roll number only.")