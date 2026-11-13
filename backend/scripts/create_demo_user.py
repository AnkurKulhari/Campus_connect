#!/usr/bin/env python3
"""
CampusConnect — Demo Account Generator for Testing
Creates a fully verified student account in the database so you can test
messaging, notifications, comments, and following without needing a second college email.
"""

import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import argparse
from app.database.session import SessionLocal
from app.models.user import User
from app.auth.security import get_password_hash
from sqlalchemy import select


def create_or_reset_demo_user(
    username: str = "demo_student",
    email: str = "2300300100099@ipec.org.in",
    password: str = "Password@1234",
    full_name: str = "Priya Sharma",
    course: str = "B.Tech",
    branch: str = "CSE",
    year: str = "3rd Year",
    bio: str = "IPEC CSE 3rd Year student. Tech enthusiast & builder.",
    is_alumni: bool = False,
):
    db = SessionLocal()
    try:
        # Check if user already exists by email or username
        existing = db.scalar(
            select(User).where((User.college_email == email) | (User.username == username))
        )

        if existing:
            print(f"[*] Found existing account for '{existing.username}' ({existing.college_email}).")
            existing.hashed_password = get_password_hash(password)
            existing.is_verified = True
            existing.is_id_verified = True
            existing.full_name = full_name
            existing.course = course
            existing.branch = branch
            existing.year = year
            existing.bio = bio
            db.commit()
            db.refresh(existing)
            print(f"[+] Successfully updated password and verified status for: {existing.username}")
            print(f"    Email:    {existing.college_email}")
            print(f"    Password: {password}")
            return existing

        # Create new verified student
        new_user = User(
            full_name=full_name,
            username=username.lower().strip(),
            college_email=email.lower().strip(),
            hashed_password=get_password_hash(password),
            gender="Female",
            is_verified=True,
            is_id_verified=True,
            roll_number=email.split("@")[0],
            course=course,
            branch=branch,
            year=year,
            is_year_back=False,
            is_alumni=is_alumni,
            bio=bio,
            profile_picture=None,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print("[+] Demo Student Account Created Successfully!")
        print("=" * 50)
        print(f"  Name:     {new_user.full_name}")
        print(f"  Username: {new_user.username}")
        print(f"  Email:    {new_user.college_email}")
        print(f"  Password: {password}")
        print(f"  Standing: {new_user.course} - {new_user.branch} ({new_user.year})")
        print("=" * 50)
        return new_user

    except Exception as e:
        db.rollback()
        print(f"[!] Error creating demo user: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a demo student account on CampusConnect")
    parser.add_argument("--username", default="demo_student", help="Username for demo account")
    parser.add_argument("--email", default="2300300100099@ipec.org.in", help="College email")
    parser.add_argument("--password", default="Password@1234", help="Password for login")
    parser.add_argument("--name", default="Priya Sharma", help="Full name")
    parser.add_argument("--branch", default="CSE", help="Branch")
    parser.add_argument("--year", default="3rd Year", help="Academic year")
    args = parser.parse_args()

    create_or_reset_demo_user(
        username=args.username,
        email=args.email,
        password=args.password,
        full_name=args.name,
        branch=args.branch,
        year=args.year,
    )
