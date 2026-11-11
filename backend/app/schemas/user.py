from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserProfileResponse(BaseModel):
    id: int
    username: str
    full_name: str
    bio: str | None = None
    profile_picture: str | None = None
    roll_number: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_year_back: bool = False
    is_alumni: bool = False
    is_id_verified: bool = False
    linkedin_url: str | None = None
    last_academic_verified_at: datetime | None = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: bool = False
    is_self: bool = False
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    profile_picture: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_year_back: bool | None = None
    linkedin_url: str | None = None


class PaginatedAlumniResponse(BaseModel):
    alumni: list[UserProfileResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
