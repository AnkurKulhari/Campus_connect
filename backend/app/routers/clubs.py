import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.club import Club, ClubMember
from app.schemas.club import (
    ClubRegisterRequest,
    ClubUpdateRequest,
    ClubMemberAddRequest,
    ClubResponse,
    ClubMemberResponse,
    PaginatedClubsResponse,
)
from app.utils.moderation import assert_safe_content

router = APIRouter(prefix="/clubs", tags=["Clubs & Societies"])

RESERVED_SLUGS = {
    "admin", "api", "auth", "login", "register", "home", "alumni", "profile",
    "posts", "clubs", "societies", "notifications", "messages", "search",
    "settings", "feed", "explore", "about", "help", "terms", "privacy", "new"
}


def build_club_response(club: Club, current_user: User | None = None) -> ClubResponse:
    members_data: list[ClubMemberResponse] = []
    my_role: str | None = None
    is_owner = (current_user is not None and club.owner_id == current_user.id)

    for cm in club.members:
        u = cm.user
        if current_user and u.id == current_user.id:
            my_role = cm.role
        members_data.append(
            ClubMemberResponse(
                id=cm.id,
                user_id=u.id,
                role=cm.role,
                title=cm.title or cm.role.replace("_", " ").title(),
                joined_at=cm.joined_at,
                full_name=u.full_name,
                username=u.username,
                profile_picture=u.profile_picture,
                year=u.year,
                branch=u.branch,
                is_id_verified=u.is_id_verified,
            )
        )

    return ClubResponse(
        id=club.id,
        name=club.name,
        slug=club.slug,
        category=club.category,
        tagline=club.tagline,
        description=club.description,
        logo_url=club.logo_url,
        banner_url=club.banner_url,
        instagram_url=club.instagram_url,
        linkedin_url=club.linkedin_url,
        website_url=club.website_url,
        faculty_coordinator_name=club.faculty_coordinator_name,
        faculty_coordinator_email=club.faculty_coordinator_email,
        is_verified=club.is_verified,
        created_at=club.created_at,
        owner_id=club.owner_id,
        owner_name=club.owner.full_name if club.owner else "",
        owner_username=club.owner.username if club.owner else "",
        members_count=len(club.members),
        is_owner=is_owner,
        my_role=my_role,
        members=members_data,
    )


@router.post("", response_model=ClubResponse, status_code=201)
@router.post("/", response_model=ClubResponse, status_code=201)
def register_club(
    payload: ClubRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registers a new college club or society.
    Enforces that:
    1. Only ID-verified students can register.
    2. Only 3rd and 4th year senior batch students can register.
    3. The applicant must accept the mandatory Anti-Rogue society declaration.
    4. Unique club name and unique slug.
    5. Bilingual profanity filtering across all text fields.
    """
    # Gate 1: Verified student check
    if not current_user.is_id_verified or not current_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Only ID-verified students can register a college society or club."
        )

    # Gate 2: Senior batch check (3rd and 4th years only)
    user_year = (current_user.year or "").strip()
    if user_year not in ["3rd Year", "4th Year"]:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Eligibility restricted: Only verified 3rd Year and 4th Year student coordinators "
                f"are authorized to register an official college society or club (Current standing: {user_year or 'Unspecified'})."
            )
        )

    # Gate 3: Anti-Rogue Declaration Check
    if not payload.declaration_accepted:
        raise HTTPException(
            status_code=400,
            detail=(
                "You must accept the mandatory anti-rogue declaration confirming that you are the "
                "official President / Lead Coordinator of this society before proceeding."
            )
        )

    # Gate 4: Slug format & reserved slugs
    clean_slug = payload.slug.strip().lower()
    if not re.match(r"^[a-z0-9_]{3,50}$", clean_slug):
        raise HTTPException(
            status_code=400,
            detail="Club handle (slug) must be 3-50 characters long and contain only lowercase letters, numbers, and underscores."
        )
    if clean_slug in RESERVED_SLUGS:
        raise HTTPException(
            status_code=400,
            detail=f"The handle '{clean_slug}' is reserved by the campus platform. Please choose a different handle."
        )

    # Gate 5: Uniqueness checks
    existing_slug = db.query(Club).filter(func.lower(Club.slug) == clean_slug).first()
    if existing_slug:
        raise HTTPException(
            status_code=409,
            detail=f"A society with the handle '@{clean_slug}' is already registered."
        )

    clean_name = payload.name.strip()
    existing_name = db.query(Club).filter(func.lower(Club.name) == clean_name.lower()).first()
    if existing_name:
        raise HTTPException(
            status_code=409,
            detail=f"A society with the name '{clean_name}' is already registered."
        )

    # Gate 6: Bilingual Profanity & Content Safety
    assert_safe_content(clean_name, "Society Name")
    assert_safe_content(clean_slug, "Society Handle")
    if payload.tagline:
        assert_safe_content(payload.tagline, "Society Tagline")
    if payload.description:
        assert_safe_content(payload.description, "Society Description")

    # Create club
    club = Club(
        name=clean_name,
        slug=clean_slug,
        category=payload.category.strip() if payload.category else "Technical",
        tagline=payload.tagline.strip() if payload.tagline else None,
        description=payload.description.strip() if payload.description else None,
        logo_url=payload.logo_url,
        banner_url=payload.banner_url,
        instagram_url=payload.instagram_url,
        linkedin_url=payload.linkedin_url,
        website_url=payload.website_url,
        faculty_coordinator_name=payload.faculty_coordinator_name,
        faculty_coordinator_email=payload.faculty_coordinator_email,
        owner_id=current_user.id,
        is_verified=True,
        is_active=True,
    )
    db.add(club)
    db.flush()

    # Automatically add creator as PRESIDENT
    president_member = ClubMember(
        club_id=club.id,
        user_id=current_user.id,
        role="PRESIDENT",
        title="President",
    )
    db.add(president_member)
    db.commit()
    db.refresh(club)

    return build_club_response(club, current_user)


@router.get("", response_model=PaginatedClubsResponse)
@router.get("/", response_model=PaginatedClubsResponse)
def list_clubs(
    category: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all registered campus societies and clubs with category filters and search."""
    query = db.query(Club).filter(Club.is_active == True)

    if category and category.lower() != "all":
        query = query.filter(func.lower(Club.category) == category.lower())

    if q:
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Club.name).like(search_term),
                func.lower(Club.slug).like(search_term),
                func.lower(Club.tagline).like(search_term),
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    clubs = query.order_by(Club.name.asc()).offset(offset).limit(page_size).all()

    return PaginatedClubsResponse(
        clubs=[build_club_response(c, current_user) for c in clubs],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + page_size) < total,
    )


@router.get("/{slug}", response_model=ClubResponse)
def get_club(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details, members, and permissions for a specific society."""
    club = db.query(Club).filter(func.lower(Club.slug) == slug.strip().lower()).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club or society not found.")
    return build_club_response(club, current_user)


@router.patch("/{slug}", response_model=ClubResponse)
def update_club(
    slug: str,
    payload: ClubUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update club profile details. Restricted to the President or authorized Lead Coordinators."""
    club = db.query(Club).filter(func.lower(Club.slug) == slug.strip().lower()).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club or society not found.")

    # Check permission: Must be owner or have role PRESIDENT / VICE_PRESIDENT
    user_member = db.query(ClubMember).filter(
        ClubMember.club_id == club.id,
        ClubMember.user_id == current_user.id,
        ClubMember.role.in_(["PRESIDENT", "VICE_PRESIDENT", "LEAD"])
    ).first()

    if club.owner_id != current_user.id and not user_member:
        raise HTTPException(
            status_code=403,
            detail="Only the society President or authorized Lead Coordinators can update club details."
        )

    if payload.name:
        clean_name = payload.name.strip()
        assert_safe_content(clean_name, "Society Name")
        club.name = clean_name
    if payload.category:
        club.category = payload.category.strip()
    if payload.tagline is not None:
        if payload.tagline:
            assert_safe_content(payload.tagline, "Society Tagline")
        club.tagline = payload.tagline.strip() if payload.tagline else None
    if payload.description is not None:
        if payload.description:
            assert_safe_content(payload.description, "Society Description")
        club.description = payload.description.strip() if payload.description else None
    if payload.logo_url is not None:
        club.logo_url = payload.logo_url
    if payload.banner_url is not None:
        club.banner_url = payload.banner_url
    if payload.instagram_url is not None:
        club.instagram_url = payload.instagram_url
    if payload.linkedin_url is not None:
        club.linkedin_url = payload.linkedin_url
    if payload.website_url is not None:
        club.website_url = payload.website_url
    if payload.faculty_coordinator_name is not None:
        club.faculty_coordinator_name = payload.faculty_coordinator_name
    if payload.faculty_coordinator_email is not None:
        club.faculty_coordinator_email = payload.faculty_coordinator_email

    db.commit()
    db.refresh(club)
    return build_club_response(club, current_user)


@router.post("/{slug}/members", response_model=ClubResponse)
def add_club_member(
    slug: str,
    payload: ClubMemberAddRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a verified student to the society core team. Restricted to the President."""
    club = db.query(Club).filter(func.lower(Club.slug) == slug.strip().lower()).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found.")

    if club.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the Society President can add or appoint core team members."
        )

    clean_username = payload.username.strip().lower().lstrip("@")
    target_user = db.query(User).filter(
        or_(
            func.lower(User.username) == clean_username,
            func.lower(User.roll_number) == clean_username,
        )
    ).first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"Student '@{clean_username}' not found.")

    if not target_user.is_id_verified:
        raise HTTPException(
            status_code=400,
            detail=f"Student {target_user.full_name} is not ID-verified. Only verified students can be added to the official core team."
        )

    existing_member = db.query(ClubMember).filter(
        ClubMember.club_id == club.id,
        ClubMember.user_id == target_user.id
    ).first()
    if existing_member:
        existing_member.role = payload.role
        if payload.title:
            existing_member.title = payload.title
    else:
        new_member = ClubMember(
            club_id=club.id,
            user_id=target_user.id,
            role=payload.role,
            title=payload.title,
        )
        db.add(new_member)

    db.commit()
    db.refresh(club)
    return build_club_response(club, current_user)


@router.delete("/{slug}/members/{user_id}", response_model=ClubResponse)
def remove_club_member(
    slug: str,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the society. Restricted to the President."""
    club = db.query(Club).filter(func.lower(Club.slug) == slug.strip().lower()).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found.")

    if club.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the Society President can remove members.")

    if user_id == club.owner_id:
        raise HTTPException(status_code=400, detail="The Society President cannot be removed from the team.")

    member = db.query(ClubMember).filter(
        ClubMember.club_id == club.id,
        ClubMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this society.")

    db.delete(member)
    db.commit()
    db.refresh(club)
    return build_club_response(club, current_user)
