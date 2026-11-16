from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Literal


class ClubRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Official Name of the Club or Society")
    slug: str = Field(..., min_length=3, max_length=50, description="Unique handle/slug for the club URL (e.g. csi_ipec)")
    category: str = Field(default="Technical", max_length=50, description="Club category (Technical, Cultural, Sports, Literary, Social, Departmental, Other)")
    tagline: str | None = Field(default=None, max_length=200, description="Short one-line motto or tagline")
    description: str | None = Field(default=None, max_length=2000, description="Detailed description of the society's activities and mission")
    logo_url: str | None = Field(default=None, max_length=500)
    banner_url: str | None = Field(default=None, max_length=500)
    instagram_url: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)
    faculty_coordinator_name: str | None = Field(default=None, max_length=100)
    faculty_coordinator_email: str | None = Field(default=None, max_length=100)
    declaration_accepted: bool = Field(..., description="Mandatory declaration that the registrant is the official President/Lead")


class ClubUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    slug: str | None = Field(default=None, min_length=3, max_length=50)
    category: str | None = Field(default=None, max_length=50)
    tagline: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    logo_url: str | None = Field(default=None, max_length=500)
    banner_url: str | None = Field(default=None, max_length=500)
    instagram_url: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=255)
    website_url: str | None = Field(default=None, max_length=255)
    faculty_coordinator_name: str | None = Field(default=None, max_length=100)
    faculty_coordinator_email: str | None = Field(default=None, max_length=100)


class ClubMemberAddRequest(BaseModel):
    username: str = Field(..., description="Username of verified student to add to core team")
    role: str = Field(default="CORE", description="Role: VICE_PRESIDENT, LEAD, CORE, MEMBER")
    title: str | None = Field(default=None, max_length=100, description="Display title like 'Vice President' or 'Tech Head'")


class ClubMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    title: str | None = None
    joined_at: datetime
    full_name: str
    username: str
    profile_picture: str | None = None
    year: str | None = None
    branch: str | None = None
    is_id_verified: bool = False

    model_config = ConfigDict(from_attributes=True)


class ClubResponse(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    tagline: str | None = None
    description: str | None = None
    logo_url: str | None = None
    banner_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    faculty_coordinator_name: str | None = None
    faculty_coordinator_email: str | None = None
    is_verified: bool = True
    created_at: datetime
    owner_id: int
    owner_name: str
    owner_username: str
    owner_profile_picture: str | None = None
    members_count: int = 0
    is_owner: bool = False
    my_role: str | None = None
    members: list[ClubMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ClubReportCreate(BaseModel):
    reason: str = Field(..., min_length=3, max_length=100)
    details: str | None = Field(default=None, max_length=1000)


class ClubManageableResponse(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: str | None = None
    role: str


class PaginatedClubsResponse(BaseModel):
    clubs: list[ClubResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
