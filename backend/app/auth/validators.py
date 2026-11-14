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
    clean_username = username.strip().lower()
    if len(clean_username) < 3:
        raise HTTPException(status_code=400,detail="Username must be at least 3 characters long.")

    if len(clean_username) > 30:
        raise HTTPException(status_code=400, detail="Username must be at most 30 characters long.")

    if not re.fullmatch(r"^[a-z0-9_.]+$", clean_username):
        raise HTTPException(status_code=400, detail="Username can only contain letters, numbers, periods (.) and underscores (_).")

    if ".." in clean_username:
        raise HTTPException(status_code=400, detail="Username must not contain consecutive periods.")

    if clean_username.startswith("."):
        raise HTTPException(status_code=400, detail="Username must not start with a period.")

    if clean_username.endswith("."):
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

    # IPEC Student Roll Number / College Email validation:
    # 1. AKTU Affiliated batches (3rd & 4th Year): 13 digits, digits 3-6 must be college code "0030"
    # 2. Autonomous batches (1st & 2nd Year): Admitted 2023 onwards (batch prefix 23, 24, 25, 26), 8-14 numeric digits
    # 3. Legacy alumni batches: 10 digits, digits 3-5 must be college code "030"
    is_valid_aktu_13 = len(local_part) == 13 and local_part[2:6] == "0030"
    is_valid_aktu_10 = len(local_part) == 10 and local_part[2:5] == "030"
    is_valid_autonomous = (
        len(local_part) >= 8
        and len(local_part) <= 14
        and local_part[:2] in {"23", "24", "25", "26"}
    )

    if not (is_valid_aktu_13 or is_valid_aktu_10 or is_valid_autonomous):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid college email roll number. Must be your official 13-digit AKTU roll number "
                "(containing IPEC institute code 0030) or your official IPEC Autonomous roll number "
                "(e.g. 2400300100032@ipec.org.in or 2300300100032@ipec.org.in)."
            )
        )
