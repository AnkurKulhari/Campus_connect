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
    if not college_email:
        raise HTTPException(status_code=400, detail="College email is required.")

    if college_email != college_email.strip():
        raise HTTPException(status_code=400, detail="College email cannot contain leading or trailing spaces.")

    email_clean = college_email.strip().lower()
    local_part, sep, domain = email_clean.partition("@")

    if not sep or domain != "ipec.org.in":
        raise HTTPException(
            status_code=400,
            detail="College email must end with '@ipec.org.in' (e.g. 2300300100032@ipec.org.in)."
        )

    if not local_part.isdigit():
        raise HTTPException(
            status_code=400,
            detail="College email must contain your numeric roll number (e.g. 2300300100032@ipec.org.in)."
        )

    # IPEC / AKTU official roll number format:
    # Standard: 13 digits, digits 3-6 must be college code "0030"
    # Legacy alumni: 10 digits, digits 3-5 must be college code "030"
    is_valid_13 = len(local_part) == 13 and local_part[2:6] == "0030"
    is_valid_10 = len(local_part) == 10 and local_part[2:5] == "030"

    if not (is_valid_13 or is_valid_10):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid college email roll number. Must be your official 13-digit AKTU roll number "
                "containing IPEC institute code 0030 (e.g. 2300300100032@ipec.org.in)."
            )
        )
